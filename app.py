import streamlit as st
from streamlit_webrtc import WebRtcMode, webrtc_streamer, RTCConfiguration
import av
import queue
import time
import cv2
import logging
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.cognitiveservices.speech import SpeechConfig, SpeechRecognizer, AudioConfig, ResultReason, CancellationReason
from dotenv import load_dotenv
import os

# Set up logging for the app
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress verbose Azure SDK logs (HTTP requests/responses)
logging.getLogger('azure').setLevel(logging.WARNING)
logging.getLogger('azure.core.pipeline.policies.http_logging_policy').setLevel(logging.WARNING)

# Load environment variables from .env file
load_dotenv()
VISION_ENDPOINT = os.getenv("VISION_ENDPOINT")
VISION_KEY = os.getenv("VISION_KEY")
SPEECH_KEY = os.getenv("SPEECH_KEY")
SPEECH_REGION = os.getenv("SPEECH_REGION")

# Validate environment variables
if not VISION_ENDPOINT or not VISION_KEY:
    st.error("Missing VISION_ENDPOINT or VISION_KEY. Please check your .env file.")
    st.stop()
if not SPEECH_KEY or not SPEECH_REGION:
    st.error("Missing SPEECH_KEY or SPEECH_REGION. Please check your .env file.")
    st.stop()

# Set up Azure AI Vision client
client = ImageAnalysisClient(endpoint=VISION_ENDPOINT, credential=AzureKeyCredential(VISION_KEY))

# Set up Azure Speech-to-Text client with default microphone
speech_config = SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
speech_config.speech_recognition_language = "en-US"
audio_config = AudioConfig(use_default_microphone=True)
speech_recognizer = SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

# Streamlit app title
st.title("Real-Time OCR and Speech-to-Text with Azure AI")

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
.debug-text {
    font-size: 14px;
    color: #888;
    margin-top: 20px;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
}
.alert-text {
    font-size: 16px;
    color: red;
    margin-top: 20px;
}
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "last_processed" not in st.session_state:
    st.session_state.last_processed = time.time()
if "extracted_text" not in st.session_state:
    st.session_state.extracted_text = "Waiting for text..."
if "previous_extracted_text" not in st.session_state:
    st.session_state.previous_extracted_text = None
if "stt_text" not in st.session_state:
    st.session_state.stt_text = "Waiting for speech..."
if "previous_stt_text" not in st.session_state:
    st.session_state.previous_stt_text = None
if "debug_messages" not in st.session_state:
    st.session_state.debug_messages = []
if "last_debug_message" not in st.session_state:
    st.session_state.last_debug_message = None
if "stream_stopped" not in st.session_state:
    st.session_state.stream_stopped = False

# Queues for passing STT results and debug messages from callbacks to the main thread
stt_queue = queue.Queue()
debug_queue = queue.Queue()

# Placeholder for video feed, OCR extracted text, STT text, debug info, and alerts
video_placeholder = st.empty()
ocr_text_placeholder = st.empty()
stt_text_placeholder = st.empty()
debug_placeholder = st.empty()
alert_placeholder = st.empty()

# Display the initial OCR text
ocr_text_placeholder.markdown(
    f"<div class='extracted-text'><strong>OCR Extracted Text:</strong><ul><li>{st.session_state.extracted_text}</li></ul></div>",
    unsafe_allow_html=True
)

# Display the initial STT text
stt_text_placeholder.markdown(
    f"<div class='extracted-text'><strong>Speech-to-Text:</strong><ul><li>{st.session_state.stt_text}</li></ul></div>",
    unsafe_allow_html=True
)

# Display initial debug info
debug_placeholder.markdown(
    "<div class='debug-text'><strong>Debug Info:</strong><br>Initializing...</div>",
    unsafe_allow_html=True
)

# Microphone permission prompt and usage note
alert_placeholder.markdown(
    "<div class='alert-text'>Please ensure microphone permissions are granted in your browser and system settings.<br>"
    "Note: Pause after speaking to finalize transcription (partial results are still saved).</div>",
    unsafe_allow_html=True
)

# Start the WebRTC stream for video only in SENDONLY mode
ctx = webrtc_streamer(
    key="video-only-sendonly",
    mode=WebRtcMode.SENDONLY,
    media_stream_constraints={"video": True, "audio": False},
    video_receiver_size=100,
    rtc_configuration=RTCConfiguration(
        {
            "iceServers": [
                {"urls": ["stun:stun.l.google.com:19302"]},
                {"urls": ["stun:stun1.l.google.com:19302"]},
                {"urls": ["stun:stun2.l.google.com:19302"]},
                {"urls": ["stun:stun3.l.google.com:19302"]},
                {"urls": ["stun:stun4.l.google.com:19302"]},
                {"urls": ["turn:openrelay.metered.ca:80"], "username": "openrelayproject", "credential": "openrelayproject"},
                {"urls": ["turn:openrelay.metered.ca:443"], "username": "openrelayproject", "credential": "openrelayproject"}
            ]
        }
    ),
)

# File paths for saving OCR and STT output
OCR_OUTPUT_FILE = "ocr_output.txt"
STT_OUTPUT_FILE = "stt_output.txt"

# Callback for STT results (finalized)
def on_recognized(evt):
    if evt.result.reason == ResultReason.RecognizedSpeech and evt.result.text:
        new_stt_text = evt.result.text.strip()
        stt_queue.put(("final", new_stt_text))
        logger.info(f"Recognized: {new_stt_text}")
    elif evt.result.reason == ResultReason.NoMatch:
        logger.warning("No speech recognized in this segment")

# Callback for recognizing (partial results)
def on_recognizing(evt):
    if evt.result.reason == ResultReason.RecognizingSpeech and evt.result.text:
        new_stt_text = evt.result.text.strip()
        stt_queue.put(("partial", new_stt_text))
        logger.info(f"Recognizing: {new_stt_text}")

# Callback for session started
def on_session_started(evt):
    logger.info("Speech recognition session started")
    debug_queue.put("Speech recognition session started")

# Callback for STT errors with detailed logging
def on_error(evt):
    logger.error(f"Speech recognition error: {evt}")
    debug_queue.put(f"Speech recognition error: {evt}")
    if evt.reason == CancellationReason.Error:
        logger.error(f"Error details: {evt.error_details}")
        debug_queue.put(f"Error details: {evt.error_details}")
    # Restart speech recognition
    speech_recognizer.stop_continuous_recognition()
    speech_recognizer.start_continuous_recognition()
    logger.info("Restarted speech recognition due to error")

# Callback for session stopped
def on_session_stopped(evt):
    logger.warning("Speech recognition session stopped")
    debug_queue.put("Speech recognition session stopped")
    # Restart speech recognition
    speech_recognizer.stop_continuous_recognition()
    speech_recognizer.start_continuous_recognition()
    logger.info("Restarted speech recognition due to session stop")

# Connect the STT callbacks
speech_recognizer.recognized.connect(on_recognized)
speech_recognizer.recognizing.connect(on_recognizing)
speech_recognizer.session_started.connect(on_session_started)
speech_recognizer.canceled.connect(on_error)
speech_recognizer.session_stopped.connect(on_session_stopped)

# Start speech recognition with error handling
try:
    speech_recognizer.start_continuous_recognition()
    logger.info("Started speech recognition")
except Exception as e:
    logger.error(f"Failed to start speech recognition: {str(e)}")
    debug_queue.put(f"Failed to start speech recognition: {str(e)}")

# Wait for the stream to start
start_time = time.time()
while not ctx.state.playing and time.time() - start_time < 10:  # Wait up to 10 seconds
    logger.info(f"Waiting for stream to start... State: {ctx.state}")
    time.sleep(0.5)

if not ctx.state.playing:
    logger.error("Stream failed to start after 10 seconds.")
    current_debug_message = "Stream failed to start after 10 seconds."
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    st.session_state.debug_messages.append(f"[{timestamp}] {current_debug_message}")
    st.session_state.debug_messages = st.session_state.debug_messages[-10:]
    debug_text = "<div class='debug-text'><strong>Debug Info:</strong><br>" + "<br>".join(st.session_state.debug_messages) + "</div>"
    debug_placeholder.markdown(debug_text, unsafe_allow_html=True)

# Main loop to capture and process video frames and handle STT updates
previous_stt_text = None  # Track previous STT text in the main loop
while True:
    current_debug_message = None

    # Process STT updates from the queue
    while not stt_queue.empty():
        result_type, new_stt_text = stt_queue.get()
        # Update UI with both partial and final results if the text has changed
        if new_stt_text != previous_stt_text:
            st.session_state.stt_text = new_stt_text
            previous_stt_text = new_stt_text
            formatted_stt_text = f"<div class='extracted-text'><strong>Speech-to-Text:</strong><ul><li>{new_stt_text}</li></ul></div>"
            stt_text_placeholder.markdown(formatted_stt_text, unsafe_allow_html=True)
            # Append to file for both partial and final results
            with open(STT_OUTPUT_FILE, "a", encoding="utf-8") as f:
                f.write(f"{new_stt_text} ({result_type})\n")
            # Add to debug logs
            current_debug_message = f"{'Recognizing' if result_type == 'partial' else 'Recognized'} speech: {new_stt_text}"
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            st.session_state.debug_messages.append(f"[{timestamp}] {current_debug_message}")
            st.session_state.debug_messages = st.session_state.debug_messages[-10:]
            debug_text = "<div class='debug-text'><strong>Debug Info:</strong><br>" + "<br>".join(st.session_state.debug_messages) + "</div>"
            debug_placeholder.markdown(debug_text, unsafe_allow_html=True)

    # Process debug messages from the queue
    while not debug_queue.empty():
        debug_message = debug_queue.get()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        st.session_state.debug_messages.append(f"[{timestamp}] {debug_message}")
        st.session_state.debug_messages = st.session_state.debug_messages[-10:]
        debug_text = "<div class='debug-text'><strong>Debug Info:</strong><br>" + "<br>".join(st.session_state.debug_messages) + "</div>"
        debug_placeholder.markdown(debug_text, unsafe_allow_html=True)

    # Check if the stream has stopped
    if not ctx.state.playing and not st.session_state.stream_stopped:
        logger.warning("WebRTC stream stopped unexpectedly")
        current_debug_message = "WebRTC stream stopped unexpectedly. Please reload the page to restart the stream."
        st.session_state.stream_stopped = True
        alert_placeholder.markdown(
            "<div class='alert-text'>WebRTC stream stopped unexpectedly. Please reload the page to restart the stream.</div>",
            unsafe_allow_html=True
        )

    # Process video frames for OCR
    if ctx.state.playing and ctx.video_receiver:
        try:
            # Get a frame from the video receiver
            video_frame = ctx.video_receiver.get_frame(timeout=1)
            
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
                    new_text = extracted_text.strip()
                    if new_text and new_text != st.session_state.previous_extracted_text:
                        st.session_state.extracted_text = new_text
                        st.session_state.previous_extracted_text = new_text
                        # Split the text into lines and format as a bullet list
                        text_lines = new_text.split("\n")
                        formatted_text = "<div class='extracted-text'><strong>OCR Extracted Text:</strong><ul>"
                        for line in text_lines:
                            if line.strip():  # Only include non-empty lines
                                formatted_text += f"<li>{line.strip()}</li>"
                        formatted_text += "</ul></div>"
                        ocr_text_placeholder.markdown(formatted_text, unsafe_allow_html=True)
                        logger.info(f"Updated OCR extracted text: {st.session_state.extracted_text}")

                        # Write OCR text to file (overwrite) only if text is detected
                        with open(OCR_OUTPUT_FILE, "w", encoding="utf-8") as f:
                            f.write(st.session_state.extracted_text)

                    # Update the last processed time
                    st.session_state.last_processed = current_time

                except Exception as e:
                    new_text = f"Error processing frame: {str(e)}"
                    if new_text != st.session_state.previous_extracted_text:
                        st.session_state.extracted_text = new_text
                        st.session_state.previous_extracted_text = new_text
                        formatted_text = f"<div class='extracted-text'><strong>OCR Extracted Text:</strong><ul><li>{new_text}</li></ul></div>"
                        ocr_text_placeholder.markdown(formatted_text, unsafe_allow_html=True)
                        logger.info(f"Updated OCR extracted text with error: {st.session_state.extracted_text}")

                        # Write error to OCR file
                        with open(OCR_OUTPUT_FILE, "w", encoding="utf-8") as f:
                            f.write(st.session_state.extracted_text)
                    st.session_state.last_processed = current_time

        except queue.Empty:
            current_debug_message = "Video queue is empty. Waiting for frames..."
            logger.warning(current_debug_message)
            time.sleep(0.1)
        except Exception as e:
            current_debug_message = f"Error getting video frame: {str(e)}"
            logger.error(f"Error getting video frame: {str(e)}")
            time.sleep(0.1)

    else:
        current_debug_message = f"Video receiver is not set. Waiting... State: {ctx.state}"
        logger.warning(current_debug_message)
        new_text = "Webcam not active. Please start the stream."
        if new_text != st.session_state.previous_extracted_text:
            st.session_state.extracted_text = new_text
            st.session_state.previous_extracted_text = new_text
            formatted_text = f"<div class='extracted-text'><strong>OCR Extracted Text:</strong><ul><li>{new_text}</li></ul></div>"
            ocr_text_placeholder.markdown(formatted_text, unsafe_allow_html=True)

            # Write to OCR file
            with open(OCR_OUTPUT_FILE, "w", encoding="utf-8") as f:
                f.write(st.session_state.extracted_text)
        time.sleep(0.1)

    # Update debug messages only if the message changes
    if current_debug_message and current_debug_message != st.session_state.last_debug_message:
        st.session_state.last_debug_message = current_debug_message
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        st.session_state.debug_messages.append(f"[{timestamp}] {current_debug_message}")
        st.session_state.debug_messages = st.session_state.debug_messages[-10:]
        debug_text = "<div class='debug-text'><strong>Debug Info:</strong><br>" + "<br>".join(st.session_state.debug_messages) + "</div>"
        debug_placeholder.markdown(debug_text, unsafe_allow_html=True)

    # Ensure at least some debug message is logged periodically
    if not current_debug_message:
        current_debug_message = "Main loop running, waiting for frames..."
        if current_debug_message != st.session_state.last_debug_message:
            st.session_state.last_debug_message = current_debug_message
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            st.session_state.debug_messages.append(f"[{timestamp}] {current_debug_message}")
            st.session_state.debug_messages = st.session_state.debug_messages[-10:]
            debug_text = "<div class='debug-text'><strong>Debug Info:</strong><br>" + "<br>".join(st.session_state.debug_messages) + "</div>"
            debug_placeholder.markdown(debug_text, unsafe_allow_html=True)