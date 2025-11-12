import streamlit as st
import os
import time
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any, Union
import traceback

import google.generativeai as genai
from google.generativeai import upload_file, get_file

# Optional ElevenLabs integration for voice synthesis
ELEVENLABS_AVAILABLE = False
try:
    __import__('elevenlabs')
    ELEVENLABS_AVAILABLE = True
except ImportError:
    pass

# Constants
GEMINI_MODEL_ID = "gemini-2.5-flash"
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Default ElevenLabs voice ID
MAX_VIDEO_PROCESSING_TIME = 180  # seconds
SAGE_CREEK_LOGO = "https://files.smartsites.parentsquare.com/3483/design_img__ljsgi1.png"
DEFAULT_VOICES = {
    "Coach Voice (Default)": DEFAULT_VOICE_ID,
    "Female Coach": "AZnzlk1XvdvUeBnXmlld",
    "Authoritative Male": "pNInz6obpgDQGcFmaJgB",
    "Commanding Female": "EXAVITQu4vr4xnSDxMaL"
}

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
            color: var(--neutral-900);
            background-color: var(--neutral-200);
        }
        
        .stApp {
            max-width: 1400px;
            margin: 0 auto;
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
            margin: var(--space-md) 0;
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
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
        
        /* Responsive Adjustments */
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
        }
        </style>
    """, unsafe_allow_html=True)

# Initialize session state variables
def init_session_state():
    """Initialize session state variables if they don't exist"""
    default_states = {
        'google_api_configured': False,
        'elevenlabs_configured': False,
        'analysis_result': None,
        'audio_script': None,
        'audio_generated': False,
        'show_audio_options': False,
        'analysis_completed': False,
        'video_uploaded': False,
        'temp_video_path': None,
        'error_message': None,
        'processing': False,
        'current_step': None
    }
    
    # Initialize all default states if they don't exist
    for key, default_value in default_states.items():
        if key not in st.session_state:
            st.session_state[key] = default_value

# Initialize resources and check configurations
def initialize_app():
    """Initialize API keys and resources"""
    # Get API keys from Streamlit secrets
    api_key_google = st.secrets.get("google", {}).get("api_key")
    api_key_elevenlabs = st.secrets.get("elevenlabs", {}).get("api_key")
    
    # Configure Google AI
    if api_key_google:
        os.environ["GOOGLE_API_KEY"] = api_key_google
        genai.configure(api_key=api_key_google)
        st.session_state.google_api_configured = True
    else:
        st.session_state.google_api_configured = False
    
    # Check ElevenLabs configuration
    if api_key_elevenlabs and ELEVENLABS_AVAILABLE:
        st.session_state.elevenlabs_configured = True
    else:
        st.session_state.elevenlabs_configured = False
    
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
        
        # Show configuration status
        st.markdown('<div class="sidebar-content">', unsafe_allow_html=True)
        st.subheader("System Status")
        
        if st.session_state.google_api_configured:
            st.markdown('<p><span class="status-tag success">✓ Google AI Connected</span></p>', unsafe_allow_html=True)
        else:
            st.markdown('<p><span class="status-tag error">× Google AI Not Connected</span></p>', unsafe_allow_html=True)
        
        if st.session_state.elevenlabs_configured:
            st.markdown('<p><span class="status-tag success">✓ Voice API Connected</span></p>', unsafe_allow_html=True)
        else:
            st.markdown('<p><span class="status-tag warning">! Voice API Not Available</span></p>', unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Add helpful tips
        with st.expander("Tips for Best Results", expanded=False):
            st.markdown("""
            - Keep videos under 60 seconds for faster processing
            - Ensure good lighting and clear visibility
            - Try to capture the complete technique
            - Be specific in your analysis request
            """)
            
        # Add sample queries
        with st.expander("Sample Analysis Requests", expanded=False):
            st.markdown("""
            - "Analyze my single leg takedown technique"
            - "Check my stance and penetration steps"
            - "Evaluate my defensive position from bottom"
            - "Assess my hand control and grip positioning"
            - "How's my hip positioning during this sweep?"
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
            return False
        return True
    return False

def process_video_upload():
    """Handle video upload and processing"""
    # Always check if temporary file still exists
    if st.session_state.video_uploaded:
        check_temp_file_exists()
    
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown('<div class="card-header"><h3 class="card-title">Video Upload</h3></div>', unsafe_allow_html=True)
    
    video_file = st.file_uploader("Upload wrestling video for analysis", type=['mp4', 'mov', 'avi'])
    
    if video_file:
        # Save uploaded video to temp file if not already processed
        if not st.session_state.video_uploaded or st.session_state.temp_video_path is None:
            with st.spinner("Processing uploaded video..."):
                # Read the video data once and store it
                video_data = video_file.read()
                
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
                    temp_video.write(video_data)
                    temp_path = temp_video.name
                
                # Verify the file was created successfully
                if Path(temp_path).exists() and Path(temp_path).stat().st_size > 0:
                    st.session_state.temp_video_path = temp_path
                    st.session_state.video_uploaded = True
                else:
                    st.error("Failed to save video file. Please try again.")
                    st.markdown('</div>', unsafe_allow_html=True)
                    return False
        
        # Verify the file still exists before displaying
        if check_temp_file_exists():
            # Display video preview with improved layout
            st.markdown('<div class="video-container animate-fade-in">', unsafe_allow_html=True)
            
            try:
                # Use the file data directly for the video component
                with open(st.session_state.temp_video_path, "rb") as video_file:
                    video_bytes = video_file.read()
                    st.video(video_bytes, format="video/mp4", start_time=0)
            except Exception as e:
                st.error(f"Error displaying video: {str(e)}")
                st.session_state.video_uploaded = False
                st.session_state.temp_video_path = None
                st.markdown('</div>', unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True)
                return False
                
            st.markdown('</div>', unsafe_allow_html=True)
            
            col1, col2 = st.columns([3, 1])
            with col2:
                if st.button("⟳ Change Video"):
                    st.session_state.video_uploaded = False
                    st.session_state.analysis_completed = False
                    st.session_state.analysis_result = None
                    st.session_state.audio_generated = False
                    if st.session_state.temp_video_path:
                        try:
                            Path(st.session_state.temp_video_path).unlink(missing_ok=True)
                        except:
                            pass
                    st.session_state.temp_video_path = None
                    st.rerun()
            
            st.markdown('</div>', unsafe_allow_html=True)
            return True
        else:
            # File doesn't exist anymore, reset state
            st.error("Video file not found. Please upload again.")
            st.session_state.video_uploaded = False
            st.session_state.temp_video_path = None
            st.markdown('</div>', unsafe_allow_html=True)
            return False
    
    st.markdown('</div>', unsafe_allow_html=True)
    return False

def get_user_query():
    """Get the wrestling technique analysis query from user"""
    st.markdown('<div class="card animate-slide-up">', unsafe_allow_html=True)
    st.markdown('<div class="card-header"><h3 class="card-title">Technique Analysis Request</h3></div>', unsafe_allow_html=True)
    
    user_query = st.text_area(
        "What wrestling technique would you like analyzed?",
        placeholder="e.g., 'Analyze my single leg takedown', 'How's my top control?', 'Check my stand-up escape'",
        height=80
    )
    
    st.markdown('</div>', unsafe_allow_html=True)
    return user_query

def analyze_wrestling_video(video_path: str, user_query: str):
    """Analyze wrestling video using Google's Gemini model with enhanced prompt"""
    # Initialize Gemini model
    model = genai.GenerativeModel(GEMINI_MODEL_ID)
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    try:
        # Set session state to track current processing step
        st.session_state.current_step = "uploading"
        
        # Upload video to Google AI
        status_text.text("Uploading video to Gemini...")
        progress_bar.progress(10)
        processed_video = upload_file(video_path)
        
        st.session_state.current_step = "processing"
        
        # Wait for processing
        status_text.text("Processing video frames...")
        progress_bar.progress(30)
        processing_start = time.time()
        while processed_video.state.name == "PROCESSING":
            elapsed = time.time() - processing_start
            if elapsed > MAX_VIDEO_PROCESSING_TIME:
                raise TimeoutError("Video processing timed out after 3 minutes")
            
            # Update progress based on elapsed time (max 50%)
            progress_percent = min(30 + int((elapsed / MAX_VIDEO_PROCESSING_TIME) * 20), 50)
            progress_bar.progress(progress_percent)
            
            time.sleep(1)
            processed_video = get_file(processed_video.name)
        
        st.session_state.current_step = "analyzing"
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
        
        # Run analysis through the Gemini model with the video
        contents = [
            {"role": "user", "parts": [
                {"text": analysis_prompt},
                {"file_data": {"mime_type": processed_video.mime_type, "file_uri": processed_video.uri}}
            ]}
        ]
        
        response = model.generate_content(contents=contents)
        
        st.session_state.current_step = "completed"
        
        # Complete analysis
        progress_bar.progress(100)
        status_text.text("Analysis complete! 💪")
        time.sleep(0.5)
        progress_bar.empty()
        status_text.empty()
        
        return response.text
    
    except TimeoutError as e:
        progress_bar.empty()
        status_text.empty()
        st.session_state.current_step = "error"
        raise TimeoutError(f"Analysis timeout: {str(e)}")
    except Exception as e:
        progress_bar.empty()
        status_text.empty()
        st.session_state.current_step = "error"
        raise Exception(f"Analysis error: {str(e)}")

def generate_audio_script(analysis_text: str):
    """Generate a coach-like script from analysis text"""
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
        
        response = model.generate_content(script_prompt)
        return response.text
    except Exception as e:
        st.error(f"Error generating script: {str(e)}")
        return analysis_text  # Fallback to original text

# ElevenLabs API wrapper functions
def generate_elevenlabs_audio(text: str, voice_id: str, api_key: str):
    """Generate audio using ElevenLabs API"""
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
        st.error(f"Error generating audio: {str(e)}")
        return None

def get_elevenlabs_voices(api_key: str):
    """Get available voices from ElevenLabs API"""
    if not ELEVENLABS_AVAILABLE:
        return None, None
    
    try:
        # Dynamically load the module to avoid linting errors
        elevenlabs_module = __import__('elevenlabs')
        
        if hasattr(elevenlabs_module, 'Client'):
            client = elevenlabs_module.Client(api_key=api_key)
            voices = client.voices.get_all()
            voices_list = [v.name for v in voices]
            voice_ids = {v.name: v.id for v in voices}
            return voices_list, voice_ids
        elif hasattr(elevenlabs_module, 'voices'):
            voices = elevenlabs_module.voices.get_all()
            voices_list = [v.name for v in voices]
            voice_ids = {v.name: v.voice_id for v in voices}
            return voices_list, voice_ids
        return None, None
    except:
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
        st.error(f"Error setting up voice options: {str(e)}")
        return DEFAULT_VOICE_ID

def generate_audio_analysis(audio_script: str, voice_id: str, elevenlabs_api_key: Optional[str] = None):
    """Generate audio version of the analysis using ElevenLabs"""
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
                return None, "Failed to generate audio with ElevenLabs"
    except Exception as e:
        error_msg = f"ElevenLabs API error: {str(e)}"
        traceback.print_exc()  # Debug information
        return None, error_msg

def display_analysis_results():
    """Display analysis results and audio options"""
    if st.session_state.analysis_result:
        st.markdown('<div class="analysis-section animate-fade-in">', unsafe_allow_html=True)
        st.subheader("Wrestling Technique Analysis")
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
            
            if st.button("Generate Coach Voice Analysis"):
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
                    audio_bytes, error_msg = generate_audio_analysis(
                        st.session_state.audio_script,
                        voice_id,
                        elevenlabs_api_key
                    )
                    
                    if audio_bytes:
                        st.session_state.audio = audio_bytes
                        st.session_state.audio_generated = True
                        st.rerun()
                    else:
                        st.error(f"Could not generate audio: {error_msg}")
                else:
                    st.error("No script available for audio generation")
            
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
        except:
            pass

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
            <ol>
                <li><strong>Upload Video:</strong> Share a clear video of your wrestling technique</li>
                <li><strong>Specify Focus:</strong> Tell us what aspect of your technique you want analyzed</li>
                <li><strong>Get Analysis:</strong> Receive detailed feedback with specific improvements</li>
                <li><strong>Hear Coach Feedback:</strong> Convert analysis to Coach Steele's voice (optional)</li>
            </ol>
            
            <div class="tips-section">
                <strong>Coach Tip:</strong> Videos under 60 seconds with good lighting and clear visibility produce the best analysis results.
            </div>
        </div>
    """, unsafe_allow_html=True)

def main():
    """Main application flow"""
    # Initialize session state
    init_session_state()
    
    # Load CSS
    load_css()
    
    # Initialize API keys and configurations
    api_key_google, api_key_elevenlabs = initialize_app()
    
    # Check if Google API is configured
    if not st.session_state.google_api_configured:
        st.error("Google AI API key is not configured. Please set the API key in .streamlit/secrets.toml")
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
        
        # Analyze button
        analyze_btn_col1, analyze_btn_col2 = st.columns([1, 3])
        with analyze_btn_col1:
            if st.button("🤼 Analyze Technique", use_container_width=True):
                if not user_query:
                    st.warning("Please enter a wrestling technique you want analyzed.")
                else:
                    try:
                        # Set processing flag
                        st.session_state.processing = True
                        
                        # Clear previous results
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
    else:
        display_welcome_message()
    
    # Display results if analysis is complete
    if st.session_state.analysis_completed:
        display_analysis_results()
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Display footer
    display_footer()
    
    # Clean up resources on page reload
    cleanup_resources()

if __name__ == "__main__":
    main()
