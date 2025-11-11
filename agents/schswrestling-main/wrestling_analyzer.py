import streamlit as st
import google.generativeai as genai
from google.generativeai import upload_file, get_file, GenerationConfig
import time
import os
import tempfile
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import io

# Set page configuration
st.set_page_config(
    page_title="Sage Creek Wrestling Analyzer",
    page_icon="🤼",
    layout="wide"
)

# Retrieve API key from secrets
API_KEY_GOOGLE = st.secrets["google"]["api_key"]

# Configure Google Generative AI
if API_KEY_GOOGLE:
    os.environ["GOOGLE_API_KEY"] = API_KEY_GOOGLE
    genai.configure(api_key=API_KEY_GOOGLE)
else:
    st.error("Google API Key not found. Please set the GOOGLE_API_KEY in Streamlit secrets.")
    st.stop()

# Enhanced CSS styling - removed blocky sections
st.markdown("""
    <style>
    .stApp {
        max-width: 1200px;
        margin: 0 auto;
        font-family: 'Helvetica Neue', sans-serif;
    }
    /* Sage Creek Colors */
    :root {
        --sc-dark-green: #2B4736;
        --sc-light-green: #3D6A4D;
        --sc-gold: #BF9D4E;
        --sc-light-gray: #f5f5f5;
    }
    /* Header */
    .main-header {
        background-color: var(--sc-dark-green);
        padding: 20px;
        color: white;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
    }
    .main-header img {
        margin-right: 20px;
        width: 150px;
    }
    /* Analysis Content */
    .analysis-content h1, .analysis-content h2, .analysis-content h3 {
        color: var(--sc-dark-green);
        margin-top: 1.5em;
        margin-bottom: 0.5em;
    }
    .analysis-content blockquote {
        border-left: 4px solid var(--sc-gold);
        padding-left: 1em;
        margin-left: 0;
        color: #555;
    }
    /* Buttons */
    .stButton > button {
        background-color: var(--sc-dark-green);
        color: white;
        font-weight: bold;
        border: none;
        border-radius: 4px;
    }
    .stDownloadButton > button {
        background-color: var(--sc-light-green);
        color: white;
        font-weight: bold;
        border: none;
        border-radius: 4px;
    }
    /* Info messages */
    .info-message {
        padding: 10px;
        background-color: #f0f7ff;
        border-left: 4px solid #0066cc;
        margin: 10px 0;
    }
    /* Footer */
    .footer {
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        margin-top: 30px;
        font-size: 0.9rem;
        background-color: var(--sc-dark-green);
    }
    /* Metrics display */
    .metrics-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 20px 0;
    }
    .metric-card {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        flex: 1;
        min-width: 120px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
    }
    .metric-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--sc-dark-green);
    }
    .metric-label {
        font-size: 0.8rem;
        color: #555;
    }
    </style>
""", unsafe_allow_html=True)

# Initialize session state variables
if 'analysis_result' not in st.session_state:
    st.session_state.analysis_result = None
if 'metrics' not in st.session_state:
    st.session_state.metrics = {
        'process_started_at': None,
        'upload_time': None,
        'processing_time': None,
        'analysis_time': None,
        'total_time': None
    }
if 'processing_cancelled' not in st.session_state:
    st.session_state.processing_cancelled = False

# Initialize Gemini model
@st.cache_resource
def get_gemini_model():
    return genai.GenerativeModel('gemini-2.0-pro-vision')

# Function to create enhanced analysis prompt
def create_analysis_prompt(user_query):
    """Create a detailed analysis prompt using the enhanced template"""
    return f"""
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

# Function to analyze wrestling video
def analyze_wrestling_video(video_path: str, user_query: str):
    """Analyze wrestling video using Google's Gemini model with enhanced error handling and performance monitoring"""
    model = get_gemini_model()
    
    # Initialize processed_video to None to avoid unbound variable errors
    processed_video = None
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    cancel_btn = st.empty()
    
    # Record start time
    st.session_state.metrics['process_started_at'] = time.time()
    
    # Allow cancellation
    show_cancel_button = cancel_btn.button("❌ Cancel Analysis", key="cancel_analysis", type="primary", help="Cancel the current analysis")
    
    try:
        # Upload video
        status_text.text("Uploading video...")
        progress_bar.progress(10)
        
        if show_cancel_button:
            st.session_state.processing_cancelled = True
            raise InterruptedError("Analysis cancelled by user")
        
        upload_start = time.time()
        processed_video = upload_file(video_path)
        upload_end = time.time()
        st.session_state.metrics['upload_time'] = upload_end - upload_start
        
        # Process video
        status_text.text("Processing video...")
        progress_bar.progress(30)
        
        if show_cancel_button:
            st.session_state.processing_cancelled = True
            raise InterruptedError("Analysis cancelled by user")
        
        processing_start = time.time()
        while processed_video.state.name == "PROCESSING":
            if time.time() - processing_start > 120:  # Increased timeout for large videos
                st.warning("Video processing is taking longer than expected. Please be patient.")
            
            if show_cancel_button:
                st.session_state.processing_cancelled = True
                raise InterruptedError("Analysis cancelled by user")
                
            time.sleep(1)
            processed_video = get_file(processed_video.name)
        
        processing_end = time.time()
        st.session_state.metrics['processing_time'] = processing_end - processing_start
        
        # Check for cancellation again
        if show_cancel_button:
            st.session_state.processing_cancelled = True
            raise InterruptedError("Analysis cancelled by user")
        
        # Verify we have a processed video
        if not processed_video:
            raise Exception("Failed to process video properly")
            
        status_text.text("Analyzing wrestling technique...")
        progress_bar.progress(60)
        
        # Create enhanced analysis prompt
        analysis_prompt = create_analysis_prompt(user_query)
        
        # Run analysis with Gemini directly
        analysis_start = time.time()
        gen_config = GenerationConfig(
            temperature=0.2,
            top_p=0.95,
            top_k=64,
            max_output_tokens=8192,
        )
        response = model.generate_content([analysis_prompt, processed_video], generation_config=gen_config)
        
        analysis_text = response.text
        analysis_end = time.time()
        st.session_state.metrics['analysis_time'] = analysis_end - analysis_start
        
        # Complete
        status_text.text("Analysis complete!")
        progress_bar.progress(100)
        time.sleep(0.5)
        
        # Calculate total time
        st.session_state.metrics['total_time'] = time.time() - st.session_state.metrics['process_started_at']
        
        # Clear progress elements
        status_text.empty()
        progress_bar.empty()
        cancel_btn.empty()
        
        return analysis_text
        
    except InterruptedError as e:
        status_text.warning(f"Process cancelled: {str(e)}")
        progress_bar.empty()
        cancel_btn.empty()
        return None
        
    except Exception as e:
        status_text.error(f"Error: {str(e)}")
        progress_bar.empty()
        cancel_btn.empty()
        return None
        
    finally:
        # Record final metrics if not already set
        if st.session_state.metrics['total_time'] is None and st.session_state.metrics['process_started_at'] is not None:
            st.session_state.metrics['total_time'] = time.time() - st.session_state.metrics['process_started_at']
            
        # Clean up temporary files
        if video_path:
            try:
                Path(video_path).unlink(missing_ok=True)
            except:
                pass

# Function to display performance metrics
def display_metrics():
    """Display performance metrics in a clean UI"""
    if st.session_state.metrics['total_time'] is not None:
        st.markdown("### Performance Metrics")
        
        # Create metrics container
        st.markdown('<div class="metrics-container">', unsafe_allow_html=True)
        
        # Video upload time
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{st.session_state.metrics['upload_time']:.1f}s</div>
                <div class="metric-label">Upload Time</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{st.session_state.metrics['processing_time']:.1f}s</div>
                <div class="metric-label">Processing Time</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{st.session_state.metrics['analysis_time']:.1f}s</div>
                <div class="metric-label">Analysis Time</div>
            </div>
            """, unsafe_allow_html=True)
            
        with col4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{st.session_state.metrics['total_time']:.1f}s</div>
                <div class="metric-label">Total Time</div>
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Optional: Show a performance chart
        if st.checkbox("Show Performance Breakdown"):
            fig, ax = plt.subplots(figsize=(10, 5))
            
            # Extract relevant metrics
            phases = ['Upload', 'Processing', 'Analysis', 'Other']
            times = [
                st.session_state.metrics['upload_time'],
                st.session_state.metrics['processing_time'],
                st.session_state.metrics['analysis_time'],
                max(0, st.session_state.metrics['total_time'] - (
                    st.session_state.metrics['upload_time'] + 
                    st.session_state.metrics['processing_time'] + 
                    st.session_state.metrics['analysis_time']
                ))
            ]
            
            # Create chart
            ax.bar(phases, times, color=['#2B4736', '#3D6A4D', '#BF9D4E', '#888888'])
            ax.set_ylabel('Time (seconds)')
            ax.set_title('Performance Breakdown')
            
            # Save to buffer and display
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            st.image(buf)

# Main application UI
def main():
    # Header
    st.markdown("""
        <div class="main-header">
            <img src="https://files.smartsites.parentsquare.com/3483/design_img__ljsgi1.png" alt="Sage Creek Logo">
            <div>
                <h1 style="margin: 0;">Sage Creek High School</h1>
                <h3 style="margin: 0; font-weight: normal;">Wrestling Analyzer</h3>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Sidebar content
    with st.sidebar:
        st.image("https://files.smartsites.parentsquare.com/3483/design_img__ljsgi1.png", width=150)
        st.header("Wrestling Form Analysis")
        st.write("Level up your wrestling with AI-powered technique analysis. Upload a video and get detailed feedback in Coach Steele's style.")
        st.info("Go Bobcats!")
        
        # Add tips in sidebar
        with st.expander("💡 Tips for Best Results"):
            st.markdown("""
            - Upload clear, well-lit video footage
            - Ensure the entire technique is visible
            - Shorter clips (15-60 seconds) process faster
            - Be specific in your technique question
            - Try different angles for comprehensive feedback
            """)

    # Main UI content
    st.subheader("Upload a video of your wrestling technique for analysis")
    
    # Video upload and preview
    uploaded_video = st.file_uploader("Upload Wrestling Video", type=['mp4', 'mov', 'avi'])
    
    if uploaded_video:
        # Save uploaded video to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
            temp_video.write(uploaded_video.read())
            video_path = temp_video.name
            
        # Display video
        with st.expander("Video Preview", expanded=True):
            st.video(video_path)
            
        # User query and analysis button
        user_query = st.text_area(
            "What wrestling technique would you like analyzed?",
            placeholder="e.g., 'Analyze my single leg takedown', 'How's my top control?', 'Check my stand-up escape'",
            height=80
        )
        
        col1, col2 = st.columns([1, 3])
        with col1:
            analyze_button = st.button("🔍 Analyze Technique", type="primary", use_container_width=True)
            
        if analyze_button:
            if not user_query:
                st.warning("Please enter a wrestling technique you want analyzed.")
            else:
                # Reset any previous cancellation state
                st.session_state.processing_cancelled = False
                
                # Perform analysis
                result = analyze_wrestling_video(video_path, user_query)
                
                if result and not st.session_state.processing_cancelled:
                    st.session_state.analysis_result = result
                    
        # Display analysis results
        if st.session_state.analysis_result and not st.session_state.processing_cancelled:
            st.markdown("## Coach Steele's Analysis")
            st.markdown('<div class="analysis-content">', unsafe_allow_html=True)
            st.markdown(st.session_state.analysis_result)
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Download button
            st.download_button(
                label="📥 Download Analysis",
                data=st.session_state.analysis_result,
                file_name="wrestling_technique_analysis.md",
                mime="text/markdown"
            )
            
            # Display performance metrics
            display_metrics()
            
    else:
        # When no video is uploaded
        st.info("Upload a wrestling video to receive Coach Steele-style technique analysis.")
        st.markdown("""
        <div class="info-message">
        🤼 <b>How it works:</b> The AI analyzes your wrestling technique and provides specific feedback on your form, 
        highlighting areas for improvement and prescribing specific drills to enhance your performance.
        </div>
        """, unsafe_allow_html=True)

    # Footer
    st.markdown("""
        <div class="footer">
            <p>Sage Creek High School | 3900 Bobcat Blvd. | Carlsbad, CA 92010</p>
            <p>Phone: 760-331-6600 • Email: office.schs@carlsbadusd.net</p>
            <p>Contents © 2025 Sage Creek High School</p>
        </div>
    """, unsafe_allow_html=True)

# Run the app
if __name__ == "__main__":
    main()