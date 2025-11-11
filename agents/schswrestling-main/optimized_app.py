import streamlit as st
import os
import time
import tempfile
import threading
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any, Union, Tuple
import traceback
from functools import lru_cache
import gc
import contextlib
import hashlib

import google.generativeai as genai
from google.generativeai import upload_file, get_file
from google.api_core.exceptions import GoogleAPIError

# Optional ElevenLabs integration for voice synthesis
ELEVENLABS_AVAILABLE = False
try:
    __import__('elevenlabs')
    ELEVENLABS_AVAILABLE = True
except ImportError:
    pass

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("wrestling_analyzer.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("wrestling_analyzer")

# Constants
GEMINI_MODEL_ID = "gemini-2.5-flash"
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Default ElevenLabs voice ID
MAX_VIDEO_PROCESSING_TIME = 180  # seconds
MAX_VIDEO_SIZE_MB = 50  # Maximum video size in MB
SAGE_CREEK_LOGO = "https://files.smartsites.parentsquare.com/3483/design_img__ljsgi1.png"
DEFAULT_VOICES = {
    "Coach Voice (Default)": DEFAULT_VOICE_ID,
    "Female Coach": "AZnzlk1XvdvUeBnXmlld",
    "Authoritative Male": "pNInz6obpgDQGcFmaJgB",
    "Commanding Female": "EXAVITQu4vr4xnSDxMaL"
}

# API Retry settings
API_MAX_RETRIES = 3
API_RETRY_DELAY = 2  # seconds

# Set page configuration with wider layout
st.set_page_config(
    page_title="Sage Creek Wrestling Analyzer",
    page_icon="🤼",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Modernized CSS with consistent design system
def load_css():
    st.markdown("""
        <style>
        /* Modern Design System */
        :root {
            /* Brand Colors */
            --primary: #2B4736;
            --primary-light: #3D6A4D;
            --primary-dark: #1A332A;
            --secondary: #BF9D4E;
            --secondary-light: #D9BE7F;
            --secondary-dark: #A37B2C;
            
            /* Neutral Colors */
            --neutral-100: #FFFFFF;
            --neutral-200: #F8F9FA;
            --neutral-300: #E9ECEF;
            --neutral-400: #DEE2E6;
            --neutral-500: #CED4DA;
            --neutral-600: #ADB5BD;
            --neutral-700: #6C757D;
            --neutral-800: #495057;
            --neutral-900: #343A40;
            --neutral-1000: #212529;
            
            /* Feedback Colors */
            --success: #28a745;
            --info: #17a2b8;
            --warning: #ffc107;
            --danger: #dc3545;
            
            /* Typography */
            --font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif;
            --font-size-xs: 0.75rem;
            --font-size-sm: 0.875rem;
            --font-size-md: 1rem;
            --font-size-lg: 1.125rem;
            --font-size-xl: 1.25rem;
            --font-size-2xl: 1.5rem;
            --font-size-3xl: 1.875rem;
            --font-size-4xl: 2.25rem;
            
            /* Spacing */
            --space-xs: 0.25rem;
            --space-sm: 0.5rem;
            --space-md: 1rem;
            --space-lg: 1.5rem;
            --space-xl: 2rem;
            --space-2xl: 3rem;
            
            /* Border Radius */
            --radius-sm: 0.25rem;
            --radius-md: 0.5rem;
            --radius-lg: 1rem;
            --radius-full: 9999px;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
            --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
            
            /* Animation */
            --transition-fast: 150ms ease;
            --transition-normal: 300ms ease;
            --transition-slow: 500ms ease;
        }
        
        /* Base Styles */
        body {
            font-family: var(--font-family);
            color: var(--neutral-100); /* Changed to neutral-100 for better contrast on dark background */
            background-color: var(--neutral-900); /* Changed to neutral-900 for dark background */
        }
        
        .stApp {
            max-width: 1400px;
            margin: 0 auto;
            background-color: var(--neutral-900); /* Ensure stApp container also has dark background */
        }
        
        /* Header */
        .header-container {
            background: linear-gradient(to right, var(--primary-dark), var(--primary));
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-lg);
            padding: var(--space-lg);
            box-shadow: var(--shadow-md);
            display: flex;
            align-items: center;
            gap: var(--space-lg);
            transition: transform var(--transition-normal);
        }
        
        .header-container:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .header-container img {
            max-width: 120px;
            border-radius: var(--radius-md);
        }
        
        .header-content h1 {
            font-size: var(--font-size-3xl);
            font-weight: 800;
            color: var(--neutral-100);
            margin: 0;
            letter-spacing: -0.02em;
            text-transform: uppercase;
        }
        
        .header-content h3 {
            font-size: var(--font-size-xl);
            font-weight: 500;
            color: var(--neutral-300);
            margin: 0;
            opacity: 0.9;
        }
        
        /* Cards */
        .card {
            background-color: var(--neutral-100);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            padding: var(--space-lg);
            margin-bottom: var(--space-lg);
            transition: all var(--transition-normal);
            border: 1px solid var(--neutral-300);
        }
        
        .card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--neutral-400);
        }
        
        .card-header {
            border-bottom: 1px solid var(--neutral-300);
            padding-bottom: var(--space-md);
            margin-bottom: var(--space-md);
        }
        
        .card-title {
            font-size: var(--font-size-xl);
            font-weight: 700;
            color: var(--primary);
            margin: 0;
        }
        
        /* Section Headers */
        .section-header {
            background: linear-gradient(to right, var(--primary), var(--primary-light));
            color: var(--neutral-100);
            padding: var(--space-md);
            border-radius: var(--radius-md);
            margin: var(--space-lg) 0 var(--space-md) 0;
            font-size: var(--font-size-xl);
            font-weight: 600;
            text-transform: uppercase;
        }
        
        /* Buttons */
        .stButton > button, .stDownloadButton > button {
            background: linear-gradient(to right, var(--primary), var(--primary-light));
            color: var(--neutral-100);
            font-weight: 600;
            border: none;
            border-radius: var(--radius-md);
            padding: 0.6rem 1.2rem;
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-fast);
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        
        .stButton > button:hover, .stDownloadButton > button:hover {
            background: linear-gradient(to right, var(--primary-light), var(--primary));
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }
        
        .stButton > button:active, .stDownloadButton > button:active {
            transform: translateY(0);
        }
        
        .action-button {
            background: linear-gradient(to right, var(--secondary), var(--secondary-light));
            color: var(--neutral-1000);
        }
        
        /* Video Container */
        .video-container {
            border-radius: var(--radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-md);
            margin: var(--space-lg) 0;
            border: 1px solid var(--neutral-400);
        }
        
        /* Analysis Section */
        .analysis-section {
            background-color: var(--neutral-100);
            border-radius: var(--radius-lg);
            padding: var(--space-lg);
            margin-top: var(--space-lg);
            box-shadow: var(--shadow-sm);
            border-left: 4px solid var(--primary);
        }
        
        /* Loading Animation */
        .loading-animation {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: var(--space-lg);
            background-color: var(--neutral-200);
            border-radius: var(--radius-lg);
            margin: var(--space-lg) 0;
        }
        
        /* Progress Bar */
        .stProgress > div > div {
            background: linear-gradient(to right, var(--secondary), var(--secondary-light));
        }
        
        /* Status Messages */
        .success-message {
            background-color: rgba(40, 167, 69, 0.1);
            border-left: 4px solid var(--success);
            color: var(--success);
            padding: var(--space-md);
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
            margin: var(--space-md) 0;
        }
        
        .error-message {
            background-color: rgba(220, 53, 69, 0.1);
            border-left: 4px solid var(--danger);
            color: var(--danger);
            padding: var(--space-md);
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
            margin: var(--space-md) 0;
        }
        
        .info-message {
            background-color: rgba(23, 162, 184, 0.1);
            border-left: 4px solid var(--info);
            color: var(--info);
            padding: var(--space-md);
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
            margin: var(--space-md) 0;
        }
        
        /* Audio Player */
        .audio-player {
            background-color: var(--neutral-200);
            border-radius: var(--radius-lg);
            padding: var(--space-lg);
            margin: var(--space-lg) 0;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--neutral-400);
        }
        
        /* Tips Section */
        .tips-section {
            background-color: rgba(191, 157, 78, 0.1);
            border-left: 4px solid var(--secondary);
            padding: var(--space-md);
        }
        
        /* Sidebar */
        .sidebar-content {
            background-color: var(--neutral-100);
            border-radius: var(--radius-lg);
            padding: var(--space-md);
            margin-bottom: var(--space-md);
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(to right, var(--primary-dark), var(--primary));
            color: var(--neutral-300);
            padding: var(--space-lg);
            text-align: center;
            border-radius: var(--radius-lg);
            margin-top: var(--space-2xl);
            font-size: var(--font-size-sm);
        }
        
        /* Status Tag */
        .status-tag {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-full);
            font-size: var(--font-size-xs);
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-tag.success {
            background-color: rgba(40, 167, 69, 0.1);
            color: var(--success);
            border: 1px solid var(--success);
        }
        
        .status-tag.error {
            background-color: rgba(220, 53, 69, 0.1);
            color: var(--danger);
            border: 1px solid var(--danger);
        }
        
        .status-tag.warning {
            background-color: rgba(255, 193, 7, 0.1);
            color: var(--warning);
            border: 1px solid var(--warning);
        }
        
        /* Animations */
        @keyframes fadeIn {
            0% {opacity: 0;}
            100% {opacity: 1;}
        }
        
        .animate-fade-in {
            animation: fadeIn var(--transition-normal);
        }
        
        @keyframes slideUp {
            0% {transform: translateY(20px); opacity: 0;}
            100% {transform: translateY(0); opacity: 1;}
        }
        
        .animate-slide-up {
            animation: slideUp var(--transition-normal);
        }
        
        /* Pulse animation for loading states */
        @keyframes pulse {
            0% {opacity: 0.6;}
            50% {opacity: 1;}
            100% {opacity: 0.6;}
        }
        
        .animate-pulse {
            animation: pulse 1.5s infinite ease-in-out;
        }
        
        /* Progress steps */
        .progress-steps {
            display: flex;
            justify-content: space-between;
            margin: var(--space-md) 0;
            position: relative;
        }
        
        .progress-steps::before {
            content: '';
            position: absolute;
            top: 15px;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--neutral-300);
            z-index: 1;
        }
        
        .step {
            position: relative;
            z-index: 2;
            text-align: center;
            width: 85px;
        }
        
        .step-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: var(--neutral-300);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto var(--space-xs);
            transition: all var(--transition-normal);
        }
        
        .step-text {
            font-size: var(--font-size-xs);
            color: var(--neutral-700);
            transition: all var(--transition-normal);
        }
        
        .step.active .step-icon {
            background-color: var(--primary);
            color: var(--neutral-100);
        }
        
        .step.active .step-text {
            color: var(--primary);
            font-weight: 600;
        }
        
        .step.completed .step-icon {
            background-color: var(--success);
            color: var(--neutral-100);
        }
        
        /* Performance optimization for mobile */
        @media (max-width: 992px) {
            .header-container {
                flex-direction: column;
                padding: var(--space-md);
            }
            
            .header-content h1 {
                font-size: var(--font-size-2xl);
            }
            
            .header-content h3 {
                font-size: var(--font-size-lg);
            }
            
            .progress-steps {
                flex-wrap: wrap;
                gap: var(--space-md);
            }
            
            .progress-steps::before {
                display: none;
            }
            
            .step {
                width: calc(50% - var(--space-md));
                margin-bottom: var(--space-md);
            }
        }
        
        /* Resource usage indicator */
        .resource-indicator {
            position: fixed;
            bottom: 0;
            right: 0;
            background: var(--neutral-100);
            border-top-left-radius: var(--radius-md);
            border: 1px solid var(--neutral-300);
            border-bottom: none;
            border-right: none;
            padding: var(--space-xs) var(--space-sm);
            font-size: var(--font-size-xs);
            color: var(--neutral-600);
            z-index: 1000;
            opacity: 0.8;
            transition: opacity var(--transition-fast);
        }
        
        .resource-indicator:hover {
            opacity: 1;
        }
        </style>
    """, unsafe_allow_html=True)

# Initialize session state variables with enhanced state management
def init_session_state():
    """Initialize session state variables if they don't exist"""
    default_states = {
        # Configuration
        'google_api_configured': False,
        'elevenlabs_configured': False,
        
        # Analysis state
        'analysis_result': None,
        'audio_script': None,
        'audio_generated': False,
        'show_audio_options': False,
        'analysis_completed': False,
        
        # Video state
        'video_uploaded': False,
        'temp_video_path': None,
        'video_size_mb': 0,
        
        # Processing state
        'error_message': None,
        'processing': False,
        'current_step': None,
        'progress_percent': 0,
        'progress_detail': '',
        'api_retries': 0,
        
        # Performance metrics
        'analysis_start_time': None,
        'analysis_duration': None,
        'memory_usage': None,
        
        # Cache state
        'cache_id': None,
        'last_query': None,
        'cache_hits': 0,
        
        # Background processing
        'background_task_active': False,
        'background_task_complete': False,
        'background_task_result': None,
        'background_task_error': None
    }
    
    # Initialize all default states if they don't exist
    for key, default_value in default_states.items():
        if key not in st.session_state:
            st.session_state[key] = default_value

# Initialize resources and check configurations with improved error handling
def initialize_app():
    """Initialize API keys and resources with validation"""
    # Get API keys from Streamlit secrets
    api_key_google = st.secrets.get("google", {}).get("api_key")
    api_key_elevenlabs = st.secrets.get("elevenlabs", {}).get("api_key")
    
    # Configure Google AI with validation
    if api_key_google:
        try:
            os.environ["GOOGLE_API_KEY"] = api_key_google
            genai.configure(api_key=api_key_google)
            
            # Test the API connection
            test_model = genai.GenerativeModel("gemini-2.5-flash")
            test_response = test_model.generate_content("Test connection")
            
            if test_response and hasattr(test_response, 'text'):
                st.session_state.google_api_configured = True
                logger.info("Google Gemini API connection successful")
            else:
                st.session_state.google_api_configured = False
                logger.warning("Google Gemini API connection test failed")
        except Exception as e:
            st.session_state.google_api_configured = False
            logger.error(f"Error configuring Google API: {e}")
    else:
        st.session_state.google_api_configured = False
        logger.warning("Google API key not found in secrets")
    
    # Check ElevenLabs configuration with validation
    if api_key_elevenlabs and ELEVENLABS_AVAILABLE:
        try:
            # Test ElevenLabs configuration by attempting to list voices
            elevenlabs_module = __import__('elevenlabs')
            
            if hasattr(elevenlabs_module, 'Client'):
                client = elevenlabs_module.Client(api_key=api_key_elevenlabs)
                voices = client.voices.get_all()
                if voices:
                    st.session_state.elevenlabs_configured = True
                    logger.info("ElevenLabs API connection successful")
                else:
                    st.session_state.elevenlabs_configured = False
                    logger.warning("ElevenLabs API connection test failed")
            elif hasattr(elevenlabs_module, 'voices'):
                elevenlabs_module.set_api_key(api_key_elevenlabs)
                voices = elevenlabs_module.voices.get_all()
                if voices:
                    st.session_state.elevenlabs_configured = True
                    logger.info("ElevenLabs API connection successful")
                else:
                    st.session_state.elevenlabs_configured = False
                    logger.warning("ElevenLabs API connection test failed")
        except Exception as e:
            st.session_state.elevenlabs_configured = False
            logger.error(f"Error configuring ElevenLabs API: {e}")
    else:
        st.session_state.elevenlabs_configured = False
        logger.info("ElevenLabs API not available or not configured")
    
    return api_key_google, api_key_elevenlabs

def display_header():
    """Display the application header with Sage Creek branding"""
    st.markdown(f"""
        <div class="header-container">
            <img src="{SAGE_CREEK_LOGO}" alt="Sage Creek Logo">
            <div class="header-content">
                <h1>Sage Creek Wrestling</h1>
                <h3>AI-Powered Technique Analyzer</h3>
            </div>
        </div>
        """, unsafe_allow_html=True)

def setup_sidebar():
    """Configure and display the sidebar content"""
    with st.sidebar:
        st.image(SAGE_CREEK_LOGO, width=120)
        
        st.markdown('<div class="sidebar-content">', unsafe_allow_html=True)
        st.header("Wrestling Form Analysis")
        st.write("Level up your wrestling with AI-powered technique analysis. Upload a video and get detailed feedback in the voice of Coach Steele.")
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Show configuration status with enhanced visual indicators
        st.markdown('<div class="sidebar-content">', unsafe_allow_html=True)
        st.subheader("System Status")
        
        if st.session_state.google_api_configured:
            st.markdown('<p><span class="status-tag success">✓ Google AI Connected</span></p>', unsafe_allow_html=True)
        else:
            st.markdown('<p><span class="status-tag error">× Google AI Not Connected</span></p>', unsafe_allow_html=True)
            st.info("Google AI connection is required for analysis. Please check your API key configuration in .streamlit/secrets.toml")
        
        if st.session_state.elevenlabs_configured:
            st.markdown('<p><span class="status-tag success">✓ Voice API Connected</span></p>', unsafe_allow_html=True)
        else:
            st.markdown('<p><span class="status-tag warning">! Voice API Not Available</span></p>', unsafe_allow_html=True)
            if ELEVENLABS_AVAILABLE:
                st.info("Voice feature requires an ElevenLabs API key. Text analysis will still work.")
            else:
                st.info("Voice feature requires the ElevenLabs package. Install with: pip install elevenlabs")
        
        # Display performance metrics when available
        if st.session_state.analysis_duration:
            st.markdown('<div class="info-message">', unsafe_allow_html=True)
            st.markdown(f"Last analysis time: {st.session_state.analysis_duration:.1f}s", unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Add helpful tips with improved content
        with st.expander("Tips for Best Results", expanded=False):
            st.markdown("""
            - Keep videos under 60 seconds for faster processing
            - Ensure good lighting and clear visibility
            - Try to capture the complete technique from multiple angles if possible
            - Be specific in your analysis request (mention the exact technique)
            - For best results, film against a plain background
            - Include both slow-motion and full-speed versions when possible
            """)
            
        # Add sample queries with improved examples
        with st.expander("Sample Analysis Requests", expanded=False):
            st.markdown("""
            - "Analyze my single leg takedown technique and check my head positioning"
            - "Check my stance and penetration steps during this shot attempt"
            - "Evaluate my defensive position from bottom, focusing on hip movement"
            - "Assess my hand control and grip positioning during this tie-up"
            - "How's my hip positioning and angle during this sweep?"
            - "Analyze my stance, level change, and shot timing in this takedown"
            """)
        
        # Add troubleshooting section
        with st.expander("Troubleshooting", expanded=False):
            st.markdown("""
            - If analysis is taking too long, try with a shorter video clip
            - For video playback issues, ensure your browser is up-to-date
            - If you receive an error, try refreshing the page and uploading again
            - Large videos (>50MB) may cause performance issues
            - If audio generation fails, try a different voice option
            """)
        
        st.markdown('<div class="sidebar-content">', unsafe_allow_html=True)
        st.info("Go Bobcats! 🤼")
        st.markdown('</div>', unsafe_allow_html=True)

def check_temp_file_exists():
    """Check if the temporary video file still exists and reset state if not"""
    if st.session_state.temp_video_path:
        if not Path(st.session_state.temp_video_path).exists():
            st.session_state.video_uploaded = False
            st.session_state.temp_video_path = None
            logger.warning("Temporary video file no longer exists")
            return False
        return True
    return False

def get_file_size_mb(file_path):
    """Get file size in megabytes"""
    try:
        size_bytes = Path(file_path).stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        return size_mb
    except Exception as e:
        logger.error(f"Error getting file size: {e}")
        return 0

def process_video_upload():
    """Handle video upload and processing with enhanced error handling and validation"""
    # Always check if temporary file still exists
    if st.session_state.video_uploaded:
        check_temp_file_exists()
    
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown('<div class="card-header"><h3 class="card-title">Video Upload</h3></div>', unsafe_allow_html=True)
    
    # Help text with file size limits
    st.markdown(f"""
    <div class="info-message">
        <p>Upload a video of your wrestling technique (max {MAX_VIDEO_SIZE_MB}MB). 
        Supported formats: MP4, MOV, AVI.</p>
    </div>
    """, unsafe_allow_html=True)
    
    video_file = st.file_uploader("Upload wrestling video for analysis", type=['mp4', 'mov', 'avi'])
    
    if video_file:
        # Save uploaded video to temp file if not already processed
        if not st.session_state.video_uploaded or st.session_state.temp_video_path is None:
            with st.spinner("Processing uploaded video..."):
                try:
                    # Read the video data once and store it
                    video_data = video_file.read()
                    video_size_mb = len(video_data) / (1024 * 1024)
                    
                    # Check if file is too large
                    if video_size_mb > MAX_VIDEO_SIZE_MB:
                        st.error(f"Video is too large ({video_size_mb:.1f}MB). Maximum size is {MAX_VIDEO_SIZE_MB}MB.")
                        st.markdown('</div>', unsafe_allow_html=True)
                        return False
                    
                    st.session_state.video_size_mb = video_size_mb
                    
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
                        temp_video.write(video_data)
                        temp_path = temp_video.name
                    
                    # Verify the file was created successfully
                    if Path(temp_path).exists() and Path(temp_path).stat().st_size > 0:
                        st.session_state.temp_video_path = temp_path
                        st.session_state.video_uploaded = True
                        
                        # Calculate hash of video content for caching
                        video_hash = hashlib.sha256(video_data).hexdigest()
                        st.session_state.video_hash = video_hash
                        
                        logger.info(f"Video uploaded successfully: {video_size_mb:.1f}MB, hash: {video_hash}")
                    else:
                        st.error("Failed to save video file. Please try again.")
                        logger.error("Failed to save uploaded video file")
                        st.markdown('</div>', unsafe_allow_html=True)
                        return False
                    
                    # Force garbage collection after handling large file
                    del video_data
                    gc.collect()
                    
                except Exception as e:
                    st.error(f"Error processing video: {str(e)}")
                    logger.error(f"Video upload error: {e}")
                    traceback.print_exc()
                    st.markdown('</div>', unsafe_allow_html=True)
                    return False
        
        # Verify the file still exists before displaying
        if check_temp_file_exists():
            # Display video preview with improved layout
            st.markdown('<div class="video-container animate-fade-in">', unsafe_allow_html=True)
            
            try:
                # Display file size information
                st.markdown(f"""
                <div class="info-message">
                    <p>Video size: {st.session_state.video_size_mb:.1f}MB</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Use the file data directly for the video component
                with open(st.session_state.temp_video_path, "rb") as video_file:
                    video_bytes = video_file.read()
                    st.video(video_bytes, format="video/mp4", start_time=0)
            except Exception as e:
                st.error(f"Error displaying video: {str(e)}")
                logger.error(f"Error displaying video: {e}")
                st.session_state.video_uploaded = False
                st.session_state.temp_video_path = None
                st.markdown('</div>', unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True)
                return False
                
            st.markdown('</div>', unsafe_allow_html=True)
            
            col1, col2 = st.columns([3, 1])
            with col2:
                if st.button("⟳ Change Video"):
                    # Clean up old resources
                    reset_analysis_state()
                    if st.session_state.temp_video_path:
                        try:
                            Path(st.session_state.temp_video_path).unlink(missing_ok=True)
                            logger.info("Previous video file deleted")
                        except Exception as e:
                            logger.error(f"Error deleting video file: {e}")
                    st.session_state.temp_video_path = None
                    st.rerun()
            
            st.markdown('</div>', unsafe_allow_html=True)
            return True
        else:
            # File doesn't exist anymore, reset state
            st.error("Video file not found. Please upload again.")
            logger.warning("Video file not found, requesting re-upload")
            st.session_state.video_uploaded = False
            st.session_state.temp_video_path = None
            st.markdown('</div>', unsafe_allow_html=True)
            return False
    
    st.markdown('</div>', unsafe_allow_html=True)
    return False

def reset_analysis_state():
    """Reset all analysis-related state variables"""
    analysis_keys = [
        'video_uploaded', 'analysis_completed', 'analysis_result',
        'audio_generated', 'audio_script', 'show_audio_options'
    ]
    for key in analysis_keys:
        if key in st.session_state:
            st.session_state[key] = False if isinstance(st.session_state[key], bool) else None
    
    # Clear any stored audio data
    if 'audio' in st.session_state:
        del st.session_state['audio']
    
    logger.info("Analysis state reset")

def get_user_query():
    """Get the wrestling technique analysis query from user with improved guidance"""
    st.markdown('<div class="card animate-slide-up">', unsafe_allow_html=True)
    st.markdown('<div class="card-header"><h3 class="card-title">Technique Analysis Request</h3></div>', unsafe_allow_html=True)
    
    # Improved guidance for better analysis results
    st.markdown("""
    <div class="info-message">
        <p>Be specific about what you want analyzed. Mention the technique name and any specific aspects you want feedback on.</p>
    </div>
    """, unsafe_allow_html=True)
    
    user_query = st.text_area(
        "What wrestling technique would you like analyzed?",
        placeholder="e.g., 'Analyze my single leg takedown with focus on my head position', 'How's my top control?', 'Check my stand-up escape technique'",
        height=80,
        key="technique_query"
    )
    
    st.markdown('</div>', unsafe_allow_html=True)
    return user_query

def display_analysis_progress_steps(current_step):
    """Display a visual progress indicator for the analysis process"""
    steps = {
        "uploading": {"index": 0, "name": "Upload"},
        "processing": {"index": 1, "name": "Process"},
        "analyzing": {"index": 2, "name": "Analyze"},
        "completed": {"index": 3, "name": "Complete"}
    }
    
    current_index = steps.get(current_step, {}).get("index", -1)
    
    st.markdown('<div class="progress-steps">', unsafe_allow_html=True)
    
    for step_key, step_info in steps.items():
        index = step_info["index"]
        name = step_info["name"]
        
        if index < current_index:
            # Completed step
            st.markdown(f"""
                <div class="step completed">
                    <div class="step-icon">✓</div>
                    <div class="step-text">{name}</div>
                </div>
            """, unsafe_allow_html=True)
        elif index == current_index:
            # Current step
            st.markdown(f"""
                <div class="step active">
                    <div class="step-icon animate-pulse">⦿</div>
                    <div class="step-text">{name}</div>
                </div>
            """, unsafe_allow_html=True)
        else:
            # Future step
            st.markdown(f"""
                <div class="step">
                    <div class="step-icon">○</div>
                    <div class="step-text">{name}</div>
                </div>
            """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

def safe_api_call(func, *args, **kwargs):
    """Safely call an API function with retries and error handling"""
    max_retries = API_MAX_RETRIES
    retry_delay = API_RETRY_DELAY
    
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except GoogleAPIError as e:
            # Handle rate limiting
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                if attempt < max_retries - 1:
                    logger.warning(f"API rate limit hit, retrying in {retry_delay}s (attempt {attempt+1}/{max_retries})")
                    st.session_state.progress_detail = f"API rate limit hit, retrying in {retry_delay}s..."
                    time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                    continue
            # Re-raise exception if we've exhausted retries
            raise
        except Exception as e:
            # Log other exceptions but don't retry
            logger.error(f"API call error: {e}")
            raise

@contextlib.contextmanager
def measure_performance():
    """Context manager to measure execution time and memory usage"""
    import time
    import psutil
    
    start_time = time.time()
    process = psutil.Process(os.getpid())
    start_memory = process.memory_info().rss / (1024 * 1024)  # MB
    
    try:
        yield
    finally:
        end_time = time.time()
        end_memory = process.memory_info().rss / (1024 * 1024)  # MB
        
        st.session_state.analysis_duration = end_time - start_time
        st.session_state.memory_usage = end_memory - start_memory
        
        logger.info(f"Performance: {st.session_state.analysis_duration:.2f}s, Memory: {st.session_state.memory_usage:.2f}MB")

def analyze_wrestling_video(video_path: str, user_query: str):
    """Analyze wrestling video using Google's Gemini model with enhanced prompt and error handling"""
    # Initialize Gemini model
    model = genai.GenerativeModel(GEMINI_MODEL_ID)
    
    # Create progress elements
    progress_bar = st.progress(0)
    status_text = st.empty()
    error_container = st.empty()
    
    # Set analysis start time for performance tracking
    st.session_state.analysis_start_time = time.time()
    
    # Check if we have a cached result for this query and video
    cache_key = f"{video_path}_{user_query}"
    if st.session_state.cache_id == cache_key and st.session_state.analysis_result:
        status_text.text("Using cached analysis result")
        progress_bar.progress(100)
        st.session_state.cache_hits += 1
        logger.info(f"Using cached analysis result (hits: {st.session_state.cache_hits})")
        time.sleep(0.5)
        progress_bar.empty()
        status_text.empty()
        return st.session_state.analysis_result
    
    # Create a new cache ID for this analysis
    st.session_state.cache_id = cache_key
    st.session_state.last_query = user_query
    
    try:
        with measure_performance():
            # Set session state to track current processing step
            st.session_state.current_step = "uploading"
            st.session_state.progress_percent = 10
            display_analysis_progress_steps(st.session_state.current_step)
            
            # Upload video to Google AI
            status_text.text("Uploading video to Gemini...")
            progress_bar.progress(10)
            
            # Calculate chunks for large videos
            file_size_mb = get_file_size_mb(video_path)
            
            # Safely upload file with retries
            processed_video = safe_api_call(upload_file, video_path)
            if processed_video is None:
                raise Exception("Video upload failed")
            
            st.session_state.current_step = "processing"
            st.session_state.progress_percent = 30
            display_analysis_progress_steps(st.session_state.current_step)
            
            # Wait for processing
            status_text.text("Processing video frames...")
            progress_bar.progress(30)
            processing_start = time.time()
            
            while processed_video.state.name == "PROCESSING":
                elapsed = time.time() - processing_start
                if elapsed > MAX_VIDEO_PROCESSING_TIME:
                    raise TimeoutError(f"Video processing timed out after {MAX_VIDEO_PROCESSING_TIME} seconds")
                
                # Update progress based on elapsed time (max 50%)
                progress_percent = min(30 + int((elapsed / MAX_VIDEO_PROCESSING_TIME) * 20), 50)
                st.session_state.progress_percent = progress_percent
                progress_bar.progress(progress_percent)
                
                # More detailed progress message
                processing_percent = min(100, int((elapsed / MAX_VIDEO_PROCESSING_TIME) * 100))
                status_text.text(f"Processing video frames... ({processing_percent}%)")
                
                time.sleep(1)
                processed_video = safe_api_call(get_file, processed_video.name)
                if processed_video is None:
                    raise Exception("Failed to retrieve processed video file")
            
            st.session_state.current_step = "analyzing"
            st.session_state.progress_percent = 60
            display_analysis_progress_steps(st.session_state.current_step)
            
            status_text.text("Analyzing wrestling technique with Gemini AI...")
            progress_bar.progress(60)
            
            # Enhanced analysis prompt with better structure and wrestling-specific context
            analysis_prompt = f"""
# ROLE: EXPERT WRESTLING COACH ANALYSIS SYSTEM

You are embodying Coach David Steele, the highly respected wrestling coach at Sage Creek High School. 
You're analyzing a student wrestler's video with a coaching mindset that blends technical precision with motivational intensity.

## BACKGROUND CONTEXT
- You are known for your detailed technical knowledge and your ability to quickly identify fundamental issues
- Your coaching philosophy emphasizes proper technique, explosive movement, and mental toughness
- You build strong rapport with wrestlers by balancing direct criticism with constructive guidance
- Your analysis should reflect years of wrestling expertise and coaching experience
- You frequently reference wrestling principles inspired by legendary coaches like Cary Kolat

## VIDEO CONTEXT
A high school wrestler has submitted footage showing: {user_query}

## ANALYSIS FRAMEWORK
Analyze this wrestling video comprehensively, focusing on the specific technique mentioned by the wrestler.
Your analysis should follow this exact structure:

### 1. INITIAL ASSESSMENT (Clear, direct technical overview)
Provide a 2-3 sentence expert assessment of what you're seeing. Be direct but constructive.
Example: "Your double-leg takedown shows good initial explosion but lacks proper head position and follow-through. Your stance is too high, compromising your leverage and leaving you vulnerable to counters."

### 2. CORE TECHNICAL BREAKDOWN (2-3 key issues with specific timestamps)
Identify 2-3 specific technical issues that need immediate attention. For each issue:
- Name the specific technical problem and reference the timestamp in the video [00:00]
- Explain the exact mechanical/positional error using precise wrestling terminology
- Detail how this error impacts performance (defensive vulnerability, lost power, etc.)
- Reference relevant wrestling principles and fundamentals
Example: 
"HEAD POSITION ERROR [0:12]: Your head is positioned outside during the shot, rather than driving into opponent's sternum. This creates vulnerability to crossface counters and reduces your driving power by 40-50%. Proper head positioning is fundamental to all successful takedowns."

### 3. CORRECTIVE DRILL PRESCRIPTION (2-3 specific, actionable drills)
Prescribe 2-3 specific drills to address the identified issues. For each drill:
- Name the specific drill and explain the exact execution (sets, reps, focus)
- Explain precisely how this drill corrects the identified technical issue
- Include guidance on proper form and what the wrestler should feel when executing correctly
Example:
"PENETRATION STEP DRILL: 3 sets of 15 reps with focus on explosive hip drive. Start from proper stance, take deep penetration step while maintaining level change. Partner provides light resistance. This drill specifically targets your shallow penetration identified at [0:08] and builds the muscle memory for proper depth on shots."

### 4. MENTAL APPROACH & STRATEGIC INSIGHT (One key mindset/strategy takeaway)
Provide ONE powerful insight about the mental or strategic aspect of the technique.
- Focus on a key principle that will elevate their wrestling IQ
- Frame it as a memorable coaching point they can internalize
- Connect it to both immediate improvement and long-term development
Example:
"TIMING TRANSFORMS TECHNIQUE: Great wrestling isn't just about perfect form—it's about perfect timing. I noticed you're executing mechanically rather than reacting to openings. Start focusing on your opponent's weight distribution. When they're heavy on their lead leg, that's your signal to explode. This shift from mechanical execution to opportunistic attacking will take your wrestling to the next level."

## RESPONSE GUIDELINES:
- Use direct, authoritative language reflective of an experienced coach
- Be specific and technical, using proper wrestling terminology
- Include exact timestamps when referencing moments in the video [00:00]
- Balance constructive criticism with encouraging guidance
- Keep your analysis concise and actionable—focus on the most critical improvements

## OUTPUT FORMAT:
Format your response as a clean, organized analysis following the exact sections above.
Make each section visually distinct for clarity using markdown formatting.
"""
            
            # Check if the video is properly processed
            if processed_video.state.name != "SUCCEEDED":
                error_message = f"Video processing failed with state: {processed_video.state.name}"
                logger.error(error_message)
                raise Exception(error_message)
            
            # Run analysis through the Gemini model with the video
            contents = [
                {"role": "user", "parts": [
                    {"text": analysis_prompt},
                    {"file_data": {"mime_type": processed_video.mime_type, "file_uri": processed_video.uri}}
                ]}
            ]
            
            status_text.text("Generating coaching feedback...")
            progress_bar.progress(80)
            
            # Safely generate content with retries for API rate limits
            response = safe_api_call(model.generate_content, contents=contents)
            if response is None:
                raise Exception("Gemini API content generation failed")
            
            st.session_state.current_step = "completed"
            st.session_state.progress_percent = 100
            display_analysis_progress_steps(st.session_state.current_step)
            
            # Complete analysis
            progress_bar.progress(100)
            status_text.text("Analysis complete! 💪")
            time.sleep(0.5)
            progress_bar.empty()
            status_text.empty()
            error_container.empty()
            
            return response.text
        
    except TimeoutError as e:
        progress_bar.empty()
        status_text.empty()
        st.session_state.current_step = "error"
        error_container.error(f"Analysis timed out: The video may be too long to process. Try with a shorter clip.")
        logger.error(f"Analysis timeout: {e}")
        raise TimeoutError(f"Analysis timeout: {str(e)}")
    except GoogleAPIError as e:
        progress_bar.empty()
        status_text.empty()
        st.session_state.current_step = "error"
        
        if "quota" in str(e).lower():
            error_message = "API rate limit exceeded. Please try again in a few minutes."
        else:
            error_message = f"Google API error: {str(e)}"
        
        error_container.error(error_message)
        logger.error(f"Google API error: {e}")
        raise Exception(error_message)
    except Exception as e:
        progress_bar.empty()
        status_text.empty()
        st.session_state.current_step = "error"
        error_container.error(f"Analysis error: {str(e)}")
        logger.error(f"Analysis error: {e}")
        traceback.print_exc()
        raise Exception(f"Analysis error: {str(e)}")

@lru_cache(maxsize=10)
def generate_audio_script(analysis_text: str):
    """Generate a coach-like script from analysis text with performance optimization"""
    model = genai.GenerativeModel(GEMINI_MODEL_ID)
    
    try:
        script_prompt = f"""
Convert the following wrestling technique analysis into a spoken monologue script for Coach David Steele.

The tone MUST be:
- Direct and authoritative - this is a coach who demands excellence
- Intense but constructive - tough feedback delivered with purpose
- Focused on actionable corrections - give the wrestler specific guidance
- Conversational - remove all markdown formatting, headers, and bullet points

Guidelines:
1. Remove all section headers, formatting, and timestamps
2. Convert bullet points into natural speech patterns
3. Use coaching language with strong action verbs
4. Add natural transitions between topics
5. Include motivational elements that push the wrestler to improve
6. Keep technical wrestling terminology intact
7. Make it sound like a real-time coaching session rather than a written analysis

Original analysis:
{analysis_text}

Convert this into a natural, spoken coaching monologue that feels like Coach Steele is talking directly to the wrestler.
"""
        
        response = safe_api_call(model.generate_content, script_prompt)
        if response is None:
            return analysis_text # Fallback to original text
        return response.text
    except Exception as e:
        logger.error(f"Error generating audio script: {e}")
        return analysis_text  # Fallback to original text

# ElevenLabs API wrapper functions with improved error handling
def generate_elevenlabs_audio(text: str, voice_id: str, api_key: str):
    """Generate audio using ElevenLabs API with better error handling"""
    if not ELEVENLABS_AVAILABLE:
        return None
    
    try:
        # Dynamically load the module to avoid linting errors
        elevenlabs_module = __import__('elevenlabs')
        
        # Check which API version is available
        if hasattr(elevenlabs_module, 'generate'):
            return elevenlabs_module.generate(
                text=text,
                voice=voice_id,
                model="eleven_monolingual_v1",
                api_key=api_key
            )
        elif hasattr(elevenlabs_module, 'Client'):
            client = elevenlabs_module.Client(api_key=api_key)
            return client.generate(
                model="eleven_monolingual_v1", 
                voice=voice_id,
                text=text
            )
        return None
    except Exception as e:
        logger.error(f"Error generating audio: {e}")
        traceback.print_exc()
        return None

def get_elevenlabs_voices(api_key: str):
    """Get available voices from ElevenLabs API with caching"""
    if not ELEVENLABS_AVAILABLE:
        return None, None
    
    # Check if we have cached results
    if 'cached_voices' in st.session_state and 'cached_voice_ids' in st.session_state:
        return st.session_state.cached_voices, st.session_state.cached_voice_ids
    
    try:
        # Dynamically load the module to avoid linting errors
        elevenlabs_module = __import__('elevenlabs')
        
        if hasattr(elevenlabs_module, 'Client'):
            client = elevenlabs_module.Client(api_key=api_key)
            voices = client.voices.get_all()
            voices_list = [v.name for v in voices]
            voice_ids = {v.name: v.id for v in voices}
            
            # Cache the results
            st.session_state.cached_voices = voices_list
            st.session_state.cached_voice_ids = voice_ids
            
            return voices_list, voice_ids
        elif hasattr(elevenlabs_module, 'voices'):
            voices = elevenlabs_module.voices.get_all()
            voices_list = [v.name for v in voices]
            voice_ids = {v.name: v.voice_id for v in voices}
            
            # Cache the results
            st.session_state.cached_voices = voices_list
            st.session_state.cached_voice_ids = voice_ids
            
            return voices_list, voice_ids
        return None, None
    except Exception as e:
        logger.error(f"Error fetching ElevenLabs voices: {e}")
        return None, None

def display_voice_selection():
    """Display voice selection options, using fallback when API fails"""
    elevenlabs_api_key = st.secrets.get("elevenlabs", {}).get("api_key")
    
    try:
        # Try to get voices from ElevenLabs API
        if ELEVENLABS_AVAILABLE and elevenlabs_api_key:
            voices_list, voice_ids = get_elevenlabs_voices(elevenlabs_api_key)
            
            if voices_list and voice_ids:
                selected_voice_name = st.selectbox(
                    "Choose Coach Voice", 
                    options=voices_list, 
                    index=0
                )
                return voice_ids.get(selected_voice_name, DEFAULT_VOICE_ID)
            
        # Default voice options when API call fails or not available
        voice_options = list(DEFAULT_VOICES.keys())
        selected_voice_option = st.selectbox("Choose Voice Style", options=voice_options, index=0)
        return DEFAULT_VOICES.get(selected_voice_option, DEFAULT_VOICE_ID)
        
    except Exception as e:
        logger.error(f"Error setting up voice options: {e}")
        st.error(f"Error setting up voice options: {str(e)}")
        return DEFAULT_VOICE_ID

def generate_audio_analysis(audio_script: str, voice_id: str, elevenlabs_api_key: Optional[str] = None):
    """Generate audio version of the analysis using ElevenLabs with improved error handling"""
    if not elevenlabs_api_key:
        return None, "ElevenLabs API key not provided"
    
    if not ELEVENLABS_AVAILABLE:
        return None, "ElevenLabs package not installed. Install with: pip install elevenlabs"
    
    # Try to generate audio with ElevenLabs
    try:
        with st.spinner("Generating Coach Steele voice audio..."):
            audio_bytes = generate_elevenlabs_audio(audio_script, voice_id, elevenlabs_api_key)
            if audio_bytes:
                return audio_bytes, None
            else:
                logger.error("Failed to generate audio with ElevenLabs (empty response)")
                return None, "Failed to generate audio with ElevenLabs"
    except Exception as e:
        error_msg = f"ElevenLabs API error: {str(e)}"
        logger.error(f"ElevenLabs API error: {e}")
        traceback.print_exc()
        return None, error_msg

def run_in_background(func, *args, **kwargs):
    """Run a function in a background thread"""
    if st.session_state.background_task_active:
        return False
    
    # Reset background task state
    st.session_state.background_task_active = True
    st.session_state.background_task_complete = False
    st.session_state.background_task_result = None
    st.session_state.background_task_error = None
    
    def wrapper():
        try:
            result = func(*args, **kwargs)
            st.session_state.background_task_result = result
            st.session_state.background_task_complete = True
        except Exception as e:
            st.session_state.background_task_error = str(e)
            logger.error(f"Background task error: {e}")
        finally:
            st.session_state.background_task_active = False
    
    thread = threading.Thread(target=wrapper)
    thread.daemon = True
    thread.start()
    return True

def display_analysis_results():
    """Display analysis results and audio options with improved layout and features"""
    if st.session_state.analysis_result:
        st.markdown('<div class="analysis-section animate-fade-in">', unsafe_allow_html=True)
        st.subheader("Wrestling Technique Analysis")
        
        # Show performance metrics if available
        if st.session_state.analysis_duration:
            st.markdown(f"""
            <div class="info-message">
                <p>Analysis generated in {st.session_state.analysis_duration:.1f} seconds</p>
            </div>
            """, unsafe_allow_html=True)
        
        # Display the analysis
        st.markdown(st.session_state.analysis_result)
        st.markdown('</div>', unsafe_allow_html=True)
        
        col1, col2 = st.columns([1, 1])
        with col1:
            # Add download button for analysis
            st.download_button(
                label="📄 Download Analysis",
                data=st.session_state.analysis_result,
                file_name="sage_creek_wrestling_analysis.md",
                mime="text/markdown"
            )
        
        # Audio options
        if st.session_state.elevenlabs_configured:
            with col2:
                if not st.session_state.show_audio_options:
                    if st.button("🔊 Generate Coach Audio"):
                        st.session_state.show_audio_options = True
                        st.rerun()
        
        if st.session_state.show_audio_options and st.session_state.elevenlabs_configured:
            st.markdown('<div class="card animate-slide-up">', unsafe_allow_html=True)
            st.markdown('<div class="card-header"><h3 class="card-title">Audio Voice Settings</h3></div>', unsafe_allow_html=True)
            
            elevenlabs_api_key = st.secrets.get("elevenlabs", {}).get("api_key")
            
            # Get selected voice ID
            voice_id = display_voice_selection()
            
            # Add length warning for very long texts
            analysis_word_count = len(st.session_state.analysis_result.split())
            if analysis_word_count > 500:
                st.warning(f"The analysis is quite long ({analysis_word_count} words). Audio generation may take longer than usual.")
            
            if st.button("Generate Coach Voice Analysis"):
                # Check if we're already processing in the background
                if st.session_state.background_task_active:
                    st.info("Audio generation is already in progress. Please wait...")
                    return
                
                # Generate audio script if needed
                if not st.session_state.audio_script:
                    with st.spinner("Converting analysis to speech format..."):
                        # Make sure we have a string for the audio script
                        if st.session_state.analysis_result:
                            audio_script = generate_audio_script(st.session_state.analysis_result)
                            if audio_script:  # Check that it's not None
                                st.session_state.audio_script = audio_script
                            else:
                                st.session_state.audio_script = st.session_state.analysis_result
                        else:
                            st.error("No analysis result available")
                            return
                
                # Make sure audio_script is a string
                if st.session_state.audio_script:
                    # Start audio generation in the background
                    success = run_in_background(
                        generate_audio_analysis,
                        st.session_state.audio_script,
                        voice_id,
                        elevenlabs_api_key
                    )
                    
                    if success:
                        st.info("Generating audio in the background. This may take a moment...")
                        st.rerun()
                    else:
                        st.error("An audio generation task is already running. Please wait for it to complete.")
                else:
                    st.error("No script available for audio generation")
            
            # Check if we have a background task running
            if st.session_state.background_task_active:
                st.markdown("""
                <div class="loading-animation">
                    <div class="animate-pulse">Generating audio... This may take a moment.</div>
                </div>
                """, unsafe_allow_html=True)
            
            # Check if background task completed
            if st.session_state.background_task_complete and st.session_state.background_task_result:
                audio_bytes, error_msg = st.session_state.background_task_result
                
                if audio_bytes:
                    st.session_state.audio = audio_bytes
                    st.session_state.audio_generated = True
                    
                    # Reset background task state
                    st.session_state.background_task_active = False
                    st.session_state.background_task_complete = False
                    st.session_state.background_task_result = None
                    
                    st.success("Audio generated successfully!")
                    st.rerun()
                else:
                    st.error(f"Could not generate audio: {error_msg}")
            
            # Check for background task errors
            if st.session_state.background_task_error:
                st.error(f"Error generating audio: {st.session_state.background_task_error}")
                st.session_state.background_task_error = None
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Display generated audio if available
        if st.session_state.audio_generated and hasattr(st.session_state, 'audio'):
            st.markdown('<div class="audio-player animate-fade-in">', unsafe_allow_html=True)
            st.subheader("Coach Steele's Audio Analysis")
            st.audio(st.session_state.audio, format="audio/mp3")
            
            # Audio download button
            st.download_button(
                label="📥 Download Audio Feedback",
                data=st.session_state.audio,
                file_name="coach_steele_wrestling_analysis.mp3",
                mime="audio/mp3"
            )
            st.markdown('</div>', unsafe_allow_html=True)

def cleanup_resources():
    """Clean up temporary files when app is rerun or closed"""
    if st.session_state.temp_video_path and not st.session_state.processing:
        try:
            Path(st.session_state.temp_video_path).unlink(missing_ok=True)
            logger.info(f"Temporary file cleaned up: {st.session_state.temp_video_path}")
        except Exception as e:
            logger.error(f"Error cleaning up temporary file: {e}")

def display_footer():
    """Display the application footer"""
    st.markdown("""
        <div class="footer">
            <p>Sage Creek High School | 3900 Bobcat Blvd. | Carlsbad, CA 92010</p>
            <p>Phone: 760-331-6600 • Email: office.schs@carlsbadusd.net</p>
            <p>© 2025 Sage Creek High School Wrestling Program</p>
        </div>
    """, unsafe_allow_html=True)

def display_welcome_message():
    """Display welcome message with instructions when no video is uploaded"""
    st.markdown("""
        <div class="card animate-fade-in">
            <div class="card-header">
                <h3 class="card-title">Wrestling Technique Analyzer</h3>
            </div>
            <p>Upload a wrestling video to receive detailed Coach Steele-style technique analysis powered by advanced AI.</p>
            <p>This tool will analyze your form and provide specific feedback to help you improve.</p>
            
            <div class="section-header">How It Works</div>
        </div>
        """, unsafe_allow_html=True)
    st.markdown("""
        <div class="card animate-fade-in">
            <ol>
                <li><strong>Upload Video:</strong> Share a clear video of your wrestling technique (under 50MB)</li>
                <li><strong>Specify Focus:</strong> Tell us what aspect of your technique you want analyzed</li>
                <li><strong>Get Analysis:</strong> Receive detailed feedback with specific improvements</li>
                <li><strong>Hear Coach Feedback:</strong> Convert analysis to Coach Steele's voice (optional)</li>
            </ol>
        </div>""", unsafe_allow_html=True)
    st.markdown("""
        <div class="tips-section">
            <strong>Coach Tip:</strong> Videos under 60 seconds with good lighting and clear visibility produce the best analysis results. Try to capture your technique from a good angle where all movements are clearly visible.
        </div>
    """, unsafe_allow_html=True)

def display_resource_usage():
    """Display resource usage indicators"""
    # Only display when we have performance metrics
    if st.session_state.memory_usage:
        st.markdown(f"""
        <div class="resource-indicator">
            Analysis: {st.session_state.analysis_duration:.1f}s | Memory: {st.session_state.memory_usage:.1f}MB
        </div>
        """, unsafe_allow_html=True)

def main():
    """Main application flow with improved error handling and performance monitoring"""
    try:
        # Initialize session state
        init_session_state()
        
        # Load CSS
        load_css()
        
        # Initialize API keys and configurations
        api_key_google, api_key_elevenlabs = initialize_app()
        
        # Check if Google API is configured
        if not st.session_state.google_api_configured:
            st.error("Google AI API key is not configured. Please set the API key in .streamlit/secrets.toml")
            st.info("Without a valid Google API key, the video analysis features will not work. Please add your API key to the .streamlit/secrets.toml file with the format: google.api_key = 'your_api_key_here'")
            st.stop()
        
        # Display header and sidebar
        display_header()
        setup_sidebar()
        
        # Main app flow
        st.markdown('<div class="animate-slide-up">', unsafe_allow_html=True)
        
        # Process video upload
        video_uploaded = process_video_upload()
        
        if video_uploaded:
            # Get user query for analysis
            user_query = get_user_query()
            
            # Analyze button with improved layout
            analyze_btn_col1, analyze_btn_col2 = st.columns([1, 3])
            with analyze_btn_col1:
                if st.button("🤼 Analyze Technique", use_container_width=True):
                    if not user_query:
                        st.warning("Please enter a wrestling technique you want analyzed.")
                    else:
                        try:
                            # Set processing flag
                            st.session_state.processing = True
                            
                            # Clear previous results if query changed
                            if st.session_state.last_query != user_query:
                                st.session_state.analysis_result = None
                                st.session_state.audio_generated = False
                                st.session_state.show_audio_options = False
                                st.session_state.audio_script = None
                            
                            # Run analysis
                            analysis_result = analyze_wrestling_video(
                                st.session_state.temp_video_path, 
                                user_query
                            )
                            
                            # Store results
                            st.session_state.analysis_result = analysis_result
                            st.session_state.analysis_completed = True
                            st.session_state.processing = False
                            
                            # Rerun to show results
                            st.rerun()
                            
                        except Exception as error:
                            st.session_state.processing = False
                            st.error(f"Analysis error: {str(error)}")
                            st.info("Try uploading a shorter video or check your internet connection.")
                            logger.error(f"Analysis function error: {error}")
        else:
            display_welcome_message()
        
        # Display results if analysis is complete
        if st.session_state.analysis_completed:
            display_analysis_results()
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Display footer
        display_footer()
        
        # Display resource usage if available
        display_resource_usage()
        
        # Clean up resources on page reload
        cleanup_resources()
    
    except Exception as e:
        st.error(f"Application error: {str(e)}")
        logger.error(f"Main application error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()