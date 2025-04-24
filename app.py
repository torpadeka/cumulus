import streamlit as st
from streamlit_webrtc import WebRtcMode, webrtc_streamer
import av
import queue
import time
import cv2
import logging
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
import os

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()
VISION_ENDPOINT = os.getenv("VISION_ENDPOINT")
VISION_KEY = os.getenv("VISION_KEY")

# Validate environment variables
if not VISION_ENDPOINT or not VISION_KEY:
    st.error("Missing VISION_ENDPOINT or VISION_KEY. Please check your .env file.")
    st.stop()

# Set up Azure AI Vision client
client = ImageAnalysisClient(endpoint=VISION_ENDPOINT, credential=AzureKeyCredential(VISION_KEY))

# Streamlit app title
st.title("Real-Time OCR with Azure AI Vision")

# Custom CSS for better text formatting
st.markdown("""
<style>
.extracted-text {
    font-size: 18px;
    line-height: 1.6;
    margin-top: 20px;
}
.extracted-text ul {
    padding-left: 20px;
}
.extracted-text li {
    margin-bottom: 10px;
}
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "last_processed" not in st.session_state:
    st.session_state.last_processed = time.time()
if "extracted_text" not in st.session_state:
    st.session_state.extracted_text = "Waiting for text..."
if "previous_extracted_text" not in st.session_state:
    st.session_state.previous_extracted_text = None  # To track changes in extracted text

# Placeholder for video feed and extracted text
video_placeholder = st.empty()
text_placeholder = st.empty()

# Display the initial text
text_placeholder.markdown(
    f"<div class='extracted-text'><strong>Extracted Text:</strong><ul><li>{st.session_state.extracted_text}</li></ul></div>",
    unsafe_allow_html=True
)

# Start the WebRTC stream in SENDONLY mode
webrtc_ctx = webrtc_streamer(
    key="video-sendonly",
    mode=WebRtcMode.SENDONLY,
    media_stream_constraints={"video": True, "audio": False},
)

# Main loop to capture and process frames
while True:
    if webrtc_ctx.video_receiver:
        try:
            # Get a frame from the video receiver
            video_frame = webrtc_ctx.video_receiver.get_frame(timeout=1)
            
            # Convert the frame to RGB for display
            img_rgb = video_frame.to_ndarray(format="rgb24")
            video_placeholder.image(img_rgb, caption="Webcam Feed", use_container_width=True)

            # Process every 5 seconds
            current_time = time.time()
            if current_time - st.session_state.last_processed >= 5:
                logger.info(f"Processing frame at {current_time:.2f} seconds")
                try:
                    # Convert the frame to BGR for JPEG encoding
                    img_bgr = video_frame.to_ndarray(format="bgr24")
                    
                    # Convert frame to JPEG for Azure AI Vision
                    _, buffer = cv2.imencode(".jpg", img_bgr)
                    img_data = buffer.tobytes()

                    # Send frame to Azure AI Vision for OCR
                    result = client.analyze(
                        image_data=img_data,
                        visual_features=["READ"]
                    )

                    # Extract text from the result
                    extracted_text = ""
                    if result.read and result.read.blocks:
                        for block in result.read.blocks:
                            for line in block.lines:
                                extracted_text += line.text + "\n"

                    # Update the extracted text in session state if it has changed
                    if extracted_text:
                        new_text = extracted_text.strip()
                    else:
                        new_text = "No text detected in frame."
                    
                    # Format the text as a bullet list
                    if new_text != st.session_state.previous_extracted_text:
                        st.session_state.extracted_text = new_text
                        st.session_state.previous_extracted_text = new_text
                        # Split the text into lines and format as a bullet list
                        text_lines = new_text.split("\n")
                        formatted_text = "<div class='extracted-text'><strong>Extracted Text:</strong><ul>"
                        for line in text_lines:
                            if line.strip():  # Only include non-empty lines
                                formatted_text += f"<li>{line.strip()}</li>"
                        formatted_text += "</ul></div>"
                        text_placeholder.markdown(formatted_text, unsafe_allow_html=True)
                        logger.info(f"Updated extracted text: {st.session_state.extracted_text}")

                    # Update the last processed time
                    st.session_state.last_processed = current_time

                except Exception as e:
                    new_text = f"Error processing frame: {str(e)}"
                    if new_text != st.session_state.previous_extracted_text:
                        st.session_state.extracted_text = new_text
                        st.session_state.previous_extracted_text = new_text
                        formatted_text = f"<div class='extracted-text'><strong>Extracted Text:</strong><ul><li>{new_text}</li></ul></div>"
                        text_placeholder.markdown(formatted_text, unsafe_allow_html=True)
                        logger.info(f"Updated extracted text with error: {st.session_state.extracted_text}")
                    st.session_state.last_processed = current_time

        except queue.Empty:
            logger.warning("Queue is empty. Waiting for frames...")
            time.sleep(0.1)
            continue

    else:
        logger.warning("Video receiver is not set. Waiting...")
        new_text = "Webcam not active. Please start the stream."
        if new_text != st.session_state.previous_extracted_text:
            st.session_state.extracted_text = new_text
            st.session_state.previous_extracted_text = new_text
            formatted_text = f"<div class='extracted-text'><strong>Extracted Text:</strong><ul><li>{new_text}</li></ul></div>"
            text_placeholder.markdown(formatted_text, unsafe_allow_html=True)
        time.sleep(0.1)
        continue