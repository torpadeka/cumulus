# Cumulus: Classroom Intelligence System

<p align="center">
  <img src="https://res.cloudinary.com/dxcn5osfu/image/upload/v1745730483/Cumulus_-_Logo_vubivn.png" alt="Cumulus Logo" width="200"/>
</p>

<p align="center">
  <b>Azure AI-powered classroom assistant that transforms learning experiences</b>
</p>

## 🌟 Overview

Cumulus is an innovative educational technology platform built on Azure AI services and Streamlit. It captures, processes, and enhances classroom learning through multiple AI modalities:

- **Computer Vision**: Scans and digitizes classroom board content in real-time
- **Speech Processing**: Transcribes teacher lectures and explanations
- **Intelligent Bot**: Processes captured content to create comprehensive learning materials
- **Emotion Analysis**: Monitors classroom engagement to optimize teaching effectiveness

## 🧠 Key Features

### 📝 Classroom Content Capture

- **Board OCR**: Advanced optical character recognition scans text and diagrams from classroom boards
- **Speech-to-Text**: Captures teacher explanations and converts them to searchable text
- **Multi-modal Integration**: Combines visual and audio inputs for comprehensive context

### 📚 Intelligent Processing

- **Contextual Understanding**: Bot processes captured content with educational context
- **Knowledge Synthesis**: Combines board content with verbal explanations
- **Automated Note Generation**: Creates structured, comprehensive notes from class sessions

### 🔍 Learning Enhancement

- **Personalized Study Materials**: Students receive complete, organized notes for home study
- **Accessibility Mode**: Text-to-speech functionality for students with visual impairments
- **Search & Review**: Easy navigation through captured content

### 📊 Classroom Analytics

- **Emotion Detection**: Computer vision analyzes student engagement and interest levels
- **Effectiveness Scoring**: Compares teaching methods with engagement metrics
- **Insight Reporting**: Provides teachers with actionable feedback on lesson effectiveness

## 🛠️ Technology Stack

- **Azure AI Services**

  - Azure Computer Vision for OCR and emotion detection
  - Azure Speech Services for speech-to-text and text-to-speech
  - Azure Bot Framework for intelligent processing
  - Azure Cognitive Services for contextual understanding

- **Python & Streamlit**
  - Intuitive, responsive web interface
  - Real-time processing and visualization
  - Cross-platform compatibility

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Azure subscription with AI services enabled
- Webcam and microphone access

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cumulus.git
cd cumulus

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Azure credentials
# Create a .env file with your Azure API keys
VISION_ENDPOINT=
VISION_KEY=
```

### Running Cumulus

```shellscript
streamlit run app.py
```

## 📋 Usage Scenarios

### For Teachers

- Start Cumulus before beginning your lecture
- Teach naturally, writing on the board and explaining concepts verbally
- Review engagement analytics after class to improve teaching methods

### For Students

- Access comprehensive notes after class
- Use accessibility features as needed
- Review difficult concepts with integrated learning materials

## 🔒 Privacy & Security

Cumulus is designed with privacy in mind:

- All data processing complies with educational privacy standards
- Emotion detection is anonymized and used only for aggregate insights
- Students can opt out of specific features

## 📊 Effectiveness Metrics

Cumulus measures teaching effectiveness through:

- Student engagement levels during different teaching activities
- Correlation between teaching methods and student attention
- Comparative analysis across different classes and subjects

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

For questions, support, or feedback, please contact the owner of this repository.
