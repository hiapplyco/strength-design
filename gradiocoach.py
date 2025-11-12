#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Gradio Application for Baseball Pitching Biomechanics Analysis using Google Gemini.

Allows users to upload videos/images, provide Google Drive links, or a YouTube link
for analysis. Performs a two-stage analysis using Gemini:
1.  Complex biomechanical analysis based on video/image content.
2.  Extraction of structured JSON data from the Stage 1 report.
Generates a visual report (spider charts, text summaries) based on the extracted data.

Prerequisites:
- Python 3.8+
- Install required libraries:
    pip install gradio google-generativeai ffmpeg-python python-dotenv matplotlib numpy google-api-python-client google-auth-httplib2 google-auth-oauthlib Pillow
- Set the GOOGLE_API_KEY environment variable (e.g., in a .env file).
- For Google Drive functionality:
    - Enable the Google Drive API in your Google Cloud Console project.
    - Create OAuth 2.0 Client ID credentials (Desktop app type) and download the
      JSON file. Rename it or update CLIENT_SECRETS_FILE below.
    - The first run will trigger a browser-based authentication flow.
- Ensure ffmpeg is installed and accessible in your system's PATH.
- Place a logo file named 'rsplogotransparent.png' in the same directory (optional).
"""

import gradio as gr
import google.generativeai as genai
import google.generativeai.types as types # For YouTube/File API parts
import ffmpeg
import os
import io
import re
import logging
import tempfile
import mimetypes
import json
import datetime
import time
import traceback
import shutil
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from dotenv import load_dotenv
import pickle
import subprocess # Added for ffmpeg check
# Make sure Any is imported if used in type hints, though we try to be more specific
from typing import cast, List, Dict, Any, Tuple, Optional, Union, cast

# --- Google Drive Specific Imports (Optional) ---
try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError # Added for specific error handling
    from googleapiclient.http import MediaIoBaseDownload
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False
    build = None
    # Define HttpError as None if import fails, for safer checking later
    HttpError = None
    MediaIoBaseDownload = None
    InstalledAppFlow = None
    Request = None
    logging.warning("Google Drive libraries not found. Google Drive functionality disabled.")
    logging.warning("Install with: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")

# --- Google API Core Exceptions (Required for Gemini error handling) ---
try:
    from google.api_core import exceptions as google_exceptions
except ImportError:
    google_exceptions = None
    logging.error("Failed to import google.api_core.exceptions. Specific Gemini API error handling might be limited.")
    logging.error("Ensure 'google-api-core' library is installed.")

# --- Configuration ---
GEMINI_MODEL_NAME = "gemini-2.5-flash"
REQUEST_TIMEOUT = 900

RESULTS_DIR = "analysis_results"
CACHE_DIR = "input_cache"
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(SCRIPT_DIR, "rsplogotransparent.png")
if not os.path.exists(LOGO_PATH):
    logging.warning(f"Logo file not found at {LOGO_PATH}. Header will show text only.")

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(funcName)s] - %(message)s',
    handlers=[
        logging.FileHandler("analysis_app.log"),
        logging.StreamHandler()
    ]
)

RSP_COLORS = {
    "primary": "#1a237e", "secondary": "#ffffff", "accent": "#42a5f5",
    "background": "#f8f8f8", "text": "#333333", "success": "#4caf50",
    "warning": "#ffb300", "danger": "#f44336",
    "chart_colors": {
        "skills": "royalblue", "power": "forestgreen",
        "mocap": "purple", "mobility": "darkorange"
    }
}

# --- Google Drive Functions ---
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CLIENT_SECRETS_FILE = 'client_secret_1049016281061-s33g5a9ksptknnubnisvhnu9dvp25sa1.apps.googleusercontent.com.json'
TOKEN_JSON_FILE = 'token.json'

def get_drive_service() -> Optional[Any]:
    """Authenticates and returns a Google Drive API service object."""
    if not GOOGLE_LIBS_AVAILABLE: # Removed detailed checks, main flag is enough
        logging.error("Google Drive libraries are not available. Cannot create service.")
        raise ImportError("Google Drive libraries are not available or failed to import.")

    creds = None
    if os.path.exists(TOKEN_JSON_FILE):
        try:
            with open(TOKEN_JSON_FILE, 'rb') as token:
                creds = pickle.load(token)
            logging.info("Loaded Google Drive token from file.")
        except (pickle.UnpicklingError, EOFError, FileNotFoundError, Exception) as e:
            logging.warning(f"Error loading token file ({TOKEN_JSON_FILE}): {e}. Re-authentication required.")
            if os.path.exists(TOKEN_JSON_FILE): os.remove(TOKEN_JSON_FILE)
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                logging.info("Attempting to refresh Google Drive token...")
                # Ensure Request is imported/available
                if Request:
                    creds.refresh(Request())
                    logging.info("Refreshed Google Drive token successfully.")
                else:
                    raise ImportError("google.auth.transport.requests.Request not available for token refresh.")
            except Exception as e:
                logging.error(f"Error refreshing token: {e}. Re-authentication required.")
                if os.path.exists(TOKEN_JSON_FILE): os.remove(TOKEN_JSON_FILE)
                creds = None
        else:
            if not os.path.exists(CLIENT_SECRETS_FILE):
                 secrets_guidance = (
                     f"Please download your OAuth 2.0 Client ID credentials (JSON format) "
                     f"from Google Cloud Console (type: Desktop app) and save it as "
                     f"'{CLIENT_SECRETS_FILE}' in the script directory."
                 )
                 logging.error(f"Client secrets file not found: {CLIENT_SECRETS_FILE}. Cannot authenticate. {secrets_guidance}")
                 raise FileNotFoundError(f"Client secrets file not found: {CLIENT_SECRETS_FILE}. {secrets_guidance}")
            try:
                logging.info("Starting Google Drive authentication flow (check browser/console)...")
                # Ensure InstalledAppFlow is imported/available
                if InstalledAppFlow:
                    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
                    creds = flow.run_local_server(port=0)
                    logging.info("Google Drive authentication successful.")
                else:
                     raise ImportError("google_auth_oauthlib.flow.InstalledAppFlow not available for authentication.")
            except Exception as e:
                 logging.error(f"Error during Google Drive authentication flow: {e}", exc_info=True)
                 raise ConnectionError(f"Failed to authenticate with Google Drive: {e}") from e

        try:
            with open(TOKEN_JSON_FILE, 'wb') as token:
                pickle.dump(creds, token)
            logging.info(f"Saved new/refreshed Google Drive token to {TOKEN_JSON_FILE}.")
        except Exception as e:
            logging.error(f"Error saving Google Drive token: {e}")

    try:
        # Ensure build is imported/available
        if build:
            service = build('drive', 'v3', credentials=creds)
            logging.info("Google Drive service built successfully.")
            return service
        else:
             raise ImportError("googleapiclient.discovery.build not available.")
    except Exception as e:
        logging.error(f"Failed to build Google Drive service: {e}", exc_info=True)
        raise ConnectionError(f"Could not build Google Drive service: {e}") from e

def extract_drive_file_id(url: str) -> Optional[str]:
    """Extracts the Google Drive file ID from various URL formats."""
    patterns = [
        r'/file/d/([a-zA-Z0-9_-]{25,})',  # Standard /file/d/ URL
        r'id=([a-zA-Z0-9_-]{25,})',       # URL with ?id= parameter
        r'/folders/([a-zA-Z0-9_-]{25,})', # Handle folder links (might need specific handling later)
        r'uc\?id=([a-zA-Z0-9_-]{25,})'    # URL with uc?id= parameter (download link)
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            file_id = match.group(1)
            logging.info(f"Extracted Google Drive ID: {file_id} from URL: {url}")
            return file_id
    logging.warning(f"Could not extract valid Google Drive file ID from URL: {url}")
    return None

def download_drive_file(service: Any, file_id: str, destination_folder: str, timestamp_str: str) -> Optional[str]:
    """Downloads a file from Google Drive given its ID."""
    if not GOOGLE_LIBS_AVAILABLE or not MediaIoBaseDownload:
         logging.error("Google Drive libraries not available for download.")
         raise ImportError("Google Drive libraries not available or failed import.")
    if not service: raise ValueError("Google Drive service object is required.")
    if not file_id: raise ValueError("Invalid Google Drive file ID provided.")

    try:
        logging.info(f"Requesting metadata for GDrive file ID: {file_id}")
        file_metadata = service.files().get(fileId=file_id, fields='name, mimeType, id, size').execute()
        original_filename = file_metadata.get('name', f'drive_file_{file_id}')
        mime_type = file_metadata.get('mimeType', '')
        file_size = file_metadata.get('size')
        logging.info(f"GDrive metadata: Name='{original_filename}', MimeType='{mime_type}', Size={file_size}")

        sanitized_filename = re.sub(r'[\\/*?:"<>|]', "_", original_filename)
        guessed_extension = mimetypes.guess_extension(mime_type)
        if guessed_extension:
            name_part, _ = os.path.splitext(sanitized_filename)
            destination_filename = f"drive_{timestamp_str}_{name_part}{guessed_extension}"
        else:
            destination_filename = f"drive_{timestamp_str}_{sanitized_filename}"

        destination_path = os.path.join(destination_folder, destination_filename)
        logging.info(f"Attempting GDrive download ID: {file_id} to {destination_path}")

        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            if status:
                logging.info(f"GDrive Download Progress ID {file_id}: {int(status.progress() * 100)}%")

        fh.seek(0)
        with open(destination_path, 'wb') as f:
            f.write(fh.read())

        logging.info(f"Successfully downloaded GDrive file ID {file_id} to: {destination_path}")
        return destination_path

    except Exception as e:
        error_message = str(e)
        # Check if it's an HttpError *after* catching the general Exception
        is_http_error = GOOGLE_LIBS_AVAILABLE and HttpError and isinstance(e, HttpError)

        if is_http_error:
            # Log the specific HttpError message
            logging.error(f"Google Drive HTTP Error downloading ID {file_id}: {error_message}", exc_info=True)
            # Try to infer status code from the error message string for specific exceptions
            if '404' in error_message and ('not found' in error_message.lower() or 'permission denied' in error_message.lower()):
                 raise FileNotFoundError(f"GDrive file not found or permission denied (ID: {file_id}). Check URL and sharing settings. Detail: {error_message}") from e
            elif '403' in error_message and 'permission denied' in error_message.lower():
                 raise PermissionError(f"Permission denied for GDrive file (ID: {file_id}). Ensure link sharing is enabled. Detail: {error_message}") from e
            else:
                 # Raise a generic IO error for other HttpErrors
                 raise IOError(f"Failed to download file from Google Drive (ID: {file_id}) due to HTTP error: {error_message}") from e
        else:
             # Handle non-HttpError exceptions
             logging.error(f"Unexpected error downloading GDrive ID {file_id}: {error_message}", exc_info=True)
             raise IOError(f"Failed to download file from Google Drive (ID: {file_id}): {error_message}") from e

# --- Video/Image Conversion & Processing ---

def convert_video_to_mp4(input_path: str, output_dir: str, timestamp_str: str) -> Optional[str]:
    """Converts a video file to MP4 format using ffmpeg-python."""
    if not os.path.exists(input_path):
        logging.error(f"Input file not found for conversion: {input_path}")
        return None

    base_name = os.path.basename(input_path)
    name_part = os.path.splitext(base_name)[0]
    safe_name_part = re.sub(r'[^\w\-]+', '_', name_part)
    output_filename = f"converted_{timestamp_str}_{safe_name_part}.mp4"
    output_path = os.path.join(output_dir, output_filename)

    logging.info(f"Converting '{base_name}' to MP4: {output_path}")

    try:
        stream = ffmpeg.input(input_path)
        output_options = {
            'vcodec': 'libx264',
            'acodec': 'aac',
            'pix_fmt': 'yuv420p',
            'strict': 'experimental',
            'metadata:s:v': 'rotate=0' # Attempt to reset rotation
        }
        process = (
            ffmpeg
            .output(stream, output_path, **output_options)
            .overwrite_output()
            .run_async(pipe_stdout=True, pipe_stderr=True)
        )
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            stderr_msg = stderr.decode(errors='ignore')
            logging.error(f"FFmpeg conversion failed for {base_name} (code {process.returncode}):\n{stderr_msg}")
            if os.path.exists(output_path):
                try: os.remove(output_path); logging.info(f"Removed partial file: {output_path}")
                except OSError as rm_err: logging.warning(f"Could not remove partial file {output_path}: {rm_err}")
            return None
        else:
            logging.info(f"Successfully converted video '{base_name}' to {output_path}")
            return output_path

    except ffmpeg.Error as e:
        stderr_msg = e.stderr.decode(errors='ignore')
        logging.error(f"ffmpeg.Error during conversion of {base_name}: {stderr_msg}", exc_info=False)
        if os.path.exists(output_path):
            try: os.remove(output_path); logging.info(f"Removed partial file: {output_path}")
            except OSError as rm_err: logging.warning(f"Could not remove partial file {output_path}: {rm_err}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error during video conversion for {base_name}: {e}", exc_info=True)
        if os.path.exists(output_path):
            try: os.remove(output_path); logging.info(f"Removed partial file: {output_path}")
            except OSError as rm_err: logging.warning(f"Could not remove partial file {output_path}: {rm_err}")
        return None

def cache_uploaded_file(
    uploaded_file_or_path: Union[str, Any], # Use Gradio File type hint if possible, else Any
    cache_dir: str,
    timestamp_str: str,
    index: int
) -> Optional[str]:
    """Copies an uploaded file (from Gradio or a path) to a persistent cache directory."""
    source_path: Optional[str] = None
    original_filename_for_log: str = "N/A"

    try:
        if isinstance(uploaded_file_or_path, str):
            source_path = uploaded_file_or_path
            original_filename = os.path.basename(source_path)
            original_filename_for_log = original_filename
        elif hasattr(uploaded_file_or_path, 'name') and uploaded_file_or_path.name and \
             hasattr(uploaded_file_or_path, 'orig_name') and uploaded_file_or_path.orig_name:
             source_path = uploaded_file_or_path.name
             original_filename = uploaded_file_or_path.orig_name
             original_filename_for_log = original_filename
        elif hasattr(uploaded_file_or_path, 'name') and uploaded_file_or_path.name:
             source_path = uploaded_file_or_path.name
             # Ensure source_path is not None before calling basename
             original_filename = os.path.basename(source_path) if source_path else "unknown_temp_file"
             original_filename_for_log = f"{original_filename} (temp)"
             logging.warning(f"Caching file using temporary name: {original_filename}")
        else:
            logging.error(f"Cache error: Unexpected input type or structure '{type(uploaded_file_or_path)}'.")
            return None

        if not source_path or not os.path.exists(source_path):
            logging.error(f"Cache error: Source path '{source_path}' is invalid or file does not exist.")
            return None

        safe_filename_base = re.sub(r'\s+', '_', original_filename)
        safe_filename_base = re.sub(r'[^\w.\-_]', '', safe_filename_base)
        max_len = 100
        if len(safe_filename_base) > max_len:
             name_part, ext = os.path.splitext(safe_filename_base)
             safe_filename_base = name_part[:max_len - len(ext)] + ext
             logging.warning(f"Original filename truncated for cache: {original_filename}")

        cached_filename = f"upload_{timestamp_str}_{index}_{safe_filename_base}"
        cached_path = os.path.join(cache_dir, cached_filename)

        shutil.copy2(source_path, cached_path)
        logging.info(f"Copied '{original_filename_for_log}' to cache: {cached_path}")
        return cached_path

    except Exception as e:
        logging.error(f"Error caching file '{original_filename_for_log}': {e}", exc_info=True)
        return None


# --- Gemini Configuration ---
def configure_gemini() -> Tuple[genai.GenerativeModel, genai.GenerativeModel]:
    """
    Configures and returns the Google Gemini GenerativeModel clients.
    Raises RuntimeError if configuration fails.
    REMOVED safety settings for testing. Add them back for production.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logging.critical("FATAL: GOOGLE_API_KEY environment variable not found.")
        raise ValueError("GOOGLE_API_KEY not set.") # Changed to ValueError for clarity

    try:
        genai.configure(api_key=api_key)
        logging.info("Gemini library configured with API key.")

        # --- REMOVED Safety Settings ---
        # safety_settings = [
        #     {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        #     # ... other categories ...
        # ]
        # logging.info(f"Using safety settings: {safety_settings}")
        logging.warning("Safety settings have been REMOVED for this session.")

        # Create Model Client (for standard generation)
        # REMOVED safety_settings=safety_settings argument
        model_client_default = genai.GenerativeModel(GEMINI_MODEL_NAME)
        logging.info(f"Gemini default model client configured for: {GEMINI_MODEL_NAME}")

        # Create Model Client (configured for JSON output)
        json_generation_config = genai.GenerationConfig(response_mime_type="application/json")
        # REMOVED safety_settings=safety_settings argument
        model_client_json = genai.GenerativeModel(
            GEMINI_MODEL_NAME,
            generation_config=json_generation_config
        )
        logging.info(f"Gemini JSON model client configured for: {GEMINI_MODEL_NAME}")

        logging.info("Gemini model clients configured successfully.")
        return model_client_default, model_client_json

    except Exception as e:
        logging.critical(f"CRITICAL ERROR during Gemini configuration: {e}", exc_info=True)
        # Raise a more specific error to halt execution if config fails
        raise RuntimeError(f"Failed to configure Gemini clients: {e}") from e

# --- Initialize Gemini Clients (Non-Optional) ---
try:
    # Now directly unpack the two required clients
    gemini_client, gemini_client_json = configure_gemini()
except (ValueError, RuntimeError) as config_err:
    # Handle configuration errors gracefully before launch
    logging.critical(f"Halting execution due to Gemini configuration failure: {config_err}")
    print("\n" + "="*60)
    print(f" FATAL ERROR: {config_err}")
    print(" Please check your GOOGLE_API_KEY and library setup.")
    print(f" Log file: {os.path.abspath('analysis_app.log')}")
    print("="*60 + "\n")
    exit(1) # Exit if configuration fails


# --- Stage 1: Complex Analysis Prompt ---
COMPLEX_BIOMECHANICS_PROMPT = """
You are an expert AI assistant specializing in the biomechanical analysis of baseball pitching, reporting to Dr. Kristen Nicholson. Your primary function is to analyze the provided pitching media.
**Context:** {{user_request_context}}
Your analysis must adhere to rigorous scientific standards, leveraging principles and methodologies relevant to sports biomechanics. Acknowledge the limitations of video-based analysis compared to lab settings.

**Input:** You will receive one or more video/image files and potentially a YouTube link. Treat each distinct video/pitch as a separate instance for initial analysis before summarizing. If multiple files are provided, assume they may represent different pitches or angles of the same pitcher unless context suggests otherwise.

**Analysis Requirements (Apply per distinct pitch/video, then summarize):**

1.  **Video/Image Identification & Quality Assessment:**
    *   **Identifier:** Reference the source (e.g., "Video 1: filename.mp4", "Image 1: side_view.jpg", "YouTube Video").
    *   **Detailed Scene Description:** Provide a comprehensive overview of the setting, pitcher's appearance (e.g., right/left-handed), camera angle (e.g., side view, front view), and the overall action sequence captured in the media.
    *   **(Video Only) Estimated Frame Rate:** Report if discernible (e.g., ~30 fps, ~60 fps, High Frame Rate).
    *   **Pose Estimation Confidence:** Qualitatively assess the likely reliability of internal pose tracking for key body parts (Lower Body, Trunk, Throwing Arm, Glove Arm). Note potential issues like blur, occlusion, poor lighting, or unusual angles. Mention limitations based on 2D view.

2.  **(Video Only) Pitch Phase Segmentation (Approximate Timestamps):**
    *   Identify and provide approximate timestamps (MM:SS or S.ms if possible) for key pitching phases visible in the video:
        *   Initiation/Windup Start
        *   Max Knee Height (Lead Leg)
        *   Hand Separation
        *   Lead Foot Contact (Stride Foot Landing)
        *   Max External Rotation (MER) of Shoulder
        *   Ball Release
        *   Max Internal Rotation Velocity (MIRV) Point / Peak Arm Deceleration
        *   Follow-Through Completion (Balanced Finish)
    *   *If phases are unclear or video is too short, state that.*

3.  **Kinematic Observations (Qualitative & Estimated Quantitative):**
    *   **Arm Action:** Describe the arm path (e.g., "Short circle," "Longer takeaway"), arm slot (e.g., "High 3/4," "Sidearm"), and presence of scapular load (retraction).
    *   **Stride & Lower Body:** Describe stride length (qualitatively - short, average, long), stride direction (towards plate, open, closed), lead leg action at foot contact (firm block, knee flexion/collapse), back leg action (drive, stabilization).
    *   **Trunk Action:** Describe timing and extent of trunk rotation and forward flexion. Note observed hip-shoulder separation timing (e.g., "Good separation achieved," "Early trunk rotation").
    *   **Head Position:** Note head movement/stability during delivery.
    *   **Glove Arm Action:** Describe the role of the glove arm (e.g., "Firm tuck," "Flying open").
    *   **(Attempt Estimation - State Caveats Clearly):** If view allows, *estimate* key angles at critical points (e.g., "Estimated lead knee flexion at foot contact ~X degrees," "Estimated shoulder abduction near MER ~Y degrees," "Estimated elbow flexion at release ~Z degrees"). *Crucially, state these are 2D estimates and subject to angle/perspective error.*

4.  **Kinetic Chain & Efficiency Observations:**
    *   Comment on the *apparent* sequencing of body segments (legs -> hips -> trunk -> arm).
    *   Identify potential breaks or inefficiencies in energy transfer based on visual timing (e.g., "Apparent early arm drag," "Possible late trunk rotation losing energy from lower half"). *Emphasize these are visual interpretations.*

5.  **Consistency (If Multiple Pitches/Videos Provided):**
    *   Compare the key kinematic observations (arm slot, stride, timing) across the different inputs. Note visible consistencies or inconsistencies. (e.g., "Consistent arm slot across videos," "Variable lead leg action observed").

6.  **Potential Injury Risk Factors (Based on Visual Patterns - Cautious Assessment):**
    *   Analyze for visual patterns sometimes associated with increased injury risk in literature (be cautious, do not diagnose):
        *   **Inverted W / High Elbow:** Arm position where elbow is significantly above shoulder line during arm cocking.
        *   **Excessive Elbow Valgus:** Observe arm layback and timing – is there excessive stress apparent? (Hard to quantify from 2D).
        *   **Forearm Flyout / Arm Cast:** Early elbow extension away from the body.
        *   **Poor Lead Leg Bracing:** Significant knee collapse after foot strike, failing to stabilize.
        *   **Hyperabduction/Hyperangulation:** Extreme shoulder abduction or trunk lean.
        *   **Timing Issues:** Significant disruptions in the kinetic chain sequence.
    *   *Highlight observations cautiously, e.g., "Visual pattern resembling 'Inverted W' noted," "Lead leg shows considerable flexion post-contact, potentially reducing stability." Avoid definitive risk statements.*

7.  **Pitch Tipping Hypothesis (Low Confidence - If Obvious Patterns Emerge):**
    *   *Only if* consistent, distinct pre-pitch cues (e.g., glove position change ONLY before curveballs, different arm path for fastballs) are *clearly visible across multiple examples*, formulate a *tentative* hypothesis. *State low confidence and the need for verification.* If no clear cues, state "No obvious pitch tipping cues detected in the provided media."

8.  **Overall Summary & Recommendations:**
    *   **Strengths:** List 1-3 key positive biomechanical aspects observed.
    *   **Areas for Development:** List 1-3 primary areas where mechanics could potentially be improved based on the visual analysis.
    *   **Actionable Advice:** Suggest 1-2 drills or focus points for the pitcher/coach based *directly* on the 'Areas for Development' (e.g., "Focus on lead leg stabilization drills," "Work on timing of trunk rotation").
    *   **Limitations Disclaimer:** Explicitly restate the limitations: 2D analysis, no force data, potential inaccuracies due to camera angle/quality, cannot replace in-person coaching or formal biomechanical assessment.

**User's Specific Request (Already incorporated in Context above, review if needed):**
{{user_request_details_for_review}}

---

**Output Format:** Generate a consolidated Markdown report addressing all the points above for the provided media collection. Structure clearly with headings for each section (e.g., ## Video 1 Analysis, ## Kinematic Observations, ## Overall Summary). Be clear, concise, and use language understandable by a coach or knowledgeable parent. Avoid overly academic jargon where possible, but use correct biomechanical terms.
"""

# --- Stage 2: JSON Extraction Prompt ---
JSON_EXTRACTION_PROMPT = """
Analyze the following Markdown biomechanics report. Your task is to extract specific data points and format them *only* as a valid JSON object. Do not include any explanatory text, code fences (like ```json), or comments before or after the JSON object. The output MUST start with `{` and end with `}`.

The JSON object should have the following structure:
{
  "video_summary": "string", // A brief, objective summary combining the 'Content Description' sections from the report. Max 2-3 sentences.
  "skills": { // Data for 'Skills Assessment' chart. Look for explicit mentions or infer from context (e.g., high velo mention -> higher velo value). Use 50 if not found.
    "title": "Skills Assessment",
    "values": [number, number, number, number, number, number], // Order: Control, Strike %, Movement, Velo, Command, Skill. Values 0-100.
    "labels": ["Control", "Strike %", "Movement", "Velo", "Command", "Skill"],
    "num_axes": 6
  },
  "power": { // Data for 'Power' chart. Look for mentions of explosiveness, leg drive, force. Use 50 if not found.
    "title": "Power Generation", // Updated title
    "values": [number, number, number, number, number], // Order: Lower Body Drive, Core Strength, Ground Force Use, Rotational Power, Overall Power. Values 0-100.
    "labels": ["Lower Body", "Core", "Ground Force", "Rotation", "Overall Power"], // Updated labels
    "num_axes": 5
  },
  "mocap": { // Data for 'Mo Cap' (Biomechanics) chart. Extract *estimated* quantitative values if present (degrees, deg/s), otherwise infer qualitative assessment (e.g., good separation -> higher value). Use 50 if not found.
    "title": "Key Biomechanics", // Updated title
    "values": [number, number, number, number, number, number], // Order: Hip/Shoulder Sep, Peak Torso Velo, Lead Leg Block, Peak Shoulder IR Velo, Arm Speed, Sequencing Efficiency. Values 0-100.
    "labels": ["Hip/Shldr Sep", "Torso Velo", "Lead Leg Block", "Shoulder IR Velo", "Arm Speed", "Sequencing"], // Updated labels
    "num_axes": 6
  },
  "mobility": { // Data for 'Mobility' chart. Look for mentions of range of motion, flexibility. Use 50 if not found.
    "title": "Mobility/Flexibility", // Updated title
    "values": [number, number, number, number, number], // Order: Shoulder ER, Thoracic Rotation, Hip IR/ER, Ankle Dorsiflexion, Overall Mobility. Values 0-100.
    "labels": ["Shoulder ER", "T-Spine Rot", "Hip Mob", "Ankle Mob", "Overall Mob"], // Updated labels
    "num_axes": 5
  },
  "predictions": [ // Extract key sentences/phrases from the 'Areas for Development' or 'Potential Injury Risk Factors' sections. Limit to 3-5 concise points.
    "string - Area for improvement or potential risk 1",
    "string - Area for improvement or potential risk 2",
    ...
  ],
  "roadmap": [ // Extract key sentences/phrases from the 'Actionable Advice' or 'Recommendations' sections. Limit to 3-5 concise points.
    "string - Recommendation/Drill 1",
    "string - Recommendation/Drill 2",
    ...
  ]
}

**Extraction Guidelines:**
-   For spider chart `values`, search the report for relevant keywords (e.g., "velocity", "separation", "rotation", "lead leg block", "mobility"). If a quantitative estimate (like degrees) is given, try to map it to a 0-100 scale (e.g., good separation might be 70-90, poor blocking 20-40). If only qualitative terms (e.g., "good", "poor", "average") are used, assign values like 75, 25, 50 respectively. If a category is not mentioned at all, use the default value of 50.
-   Ensure `values` and `labels` arrays always have the correct length specified by `num_axes` for each chart.
-   For `predictions` and `roadmap`, extract the most important, distinct points as strings. Do not just copy entire paragraphs.
-   The final output must be *only* the JSON object. Verify it's valid JSON before outputting.

Markdown Report to Analyze:
--- Start Report ---
{markdown_report}
--- End Report ---
"""


# --- Analysis Functions ---

def run_stage2_extraction(markdown_report: str) -> Optional[Dict[str, Any]]:
    """
    Runs Stage 2 Gemini analysis to extract structured JSON from the Markdown report.
    Uses the Gemini client configured specifically for JSON output.
    """
    # Client check is less critical here as it's done at startup, but keep for safety
    if not gemini_client_json:
        logging.error("Stage 2 Error: Gemini JSON client is not available. Cannot run extraction.")
        return None
    if not markdown_report or not isinstance(markdown_report, str) or not markdown_report.strip():
        logging.error("Stage 2 Error: Invalid or empty Markdown report provided from Stage 1.")
        return None

    logging.info("--- Starting Stage 2: JSON Extraction ---")
    raw_json_text = ""
    cleaned_json_text = "" # Initialize here

    try:
        extraction_prompt_formatted = JSON_EXTRACTION_PROMPT.replace("{markdown_report}", markdown_report)

        logging.info(f"Stage 2: Sending request to Gemini ({GEMINI_MODEL_NAME}) for JSON extraction. Timeout: {REQUEST_TIMEOUT}s")
        response = gemini_client_json.generate_content(
            extraction_prompt_formatted,
            request_options={'timeout': REQUEST_TIMEOUT}
        )

        if not response or not hasattr(response, 'text') or not response.text:
            logging.error("Stage 2 Error: Gemini API call returned an empty or invalid response object.")
            if response and hasattr(response, 'candidates') and response.candidates:
                 logging.error(f"Stage 2 Error Details: Finish Reason: {response.candidates[0].finish_reason}") # Safety ratings removed
            return None

        raw_json_text = response.text
        logging.debug(f"Stage 2 Raw Response Text:\n{raw_json_text[:500]}...")

        cleaned_json_text = re.sub(r'^```json\s*|\s*```$', '', raw_json_text, flags=re.MULTILINE | re.DOTALL).strip()

        structured_data = json.loads(cleaned_json_text)
        logging.info("Stage 2: Successfully parsed JSON response from Gemini.")

        # Basic Validation
        required_top_keys = ["video_summary", "skills", "power", "mocap", "mobility", "predictions", "roadmap"]
        missing_keys = [key for key in required_top_keys if key not in structured_data]
        if missing_keys:
             logging.warning(f"Stage 2: Parsed JSON is missing top-level keys: {missing_keys}. Report may be incomplete.")

        for chart_key in ["skills", "power", "mocap", "mobility"]:
            chart = structured_data.get(chart_key)
            if isinstance(chart, dict):
                expected_axes = chart.get("num_axes")
                values = chart.get("values")
                labels = chart.get("labels")
                if not (isinstance(expected_axes, int) and
                        isinstance(values, list) and len(values) == expected_axes and
                        isinstance(labels, list) and len(labels) == expected_axes):
                    logging.warning(f"Stage 2: Invalid structure or mismatched lengths in chart data for '{chart_key}'. Check Gemini output. Data: {chart}")
            elif chart_key in required_top_keys:
                 logging.warning(f"Stage 2: Expected chart data for '{chart_key}' to be a dictionary, but got {type(chart)}.")

        return structured_data

    except json.JSONDecodeError as json_err:
        logging.error(f"Stage 2 Error: Failed to decode JSON response: {json_err}", exc_info=False)
        logging.error(f"Stage 2 Raw Text that failed JSON parsing (first 1000 chars):\n{raw_json_text[:1000]}")
        match = re.search(r'\{.*\}', cleaned_json_text, re.DOTALL)
        if match:
             logging.warning("Attempting to parse JSON found within the raw text...")
             try:
                 potential_json = match.group(0)
                 structured_data = json.loads(potential_json)
                 logging.warning("Successfully parsed JSON found within raw text. Result might be partial.")
                 return structured_data
             except json.JSONDecodeError:
                 logging.error("Attempt to parse extracted JSON also failed.")
        return None
    except Exception as e:
         logging.error(f"Stage 2: Unexpected error during Gemini API call or JSON processing: {e}", exc_info=True)
         return None

# --- Report Generation Function ---

def create_pitcher_report(analysis_data: Optional[Dict[str, Any]], pitcher_age: Optional[int] = None, pitcher_level: Optional[str] = None) -> Figure:
    """Creates a matplotlib Figure based on the structured data, including age/level context."""
    logging.info("Creating pitcher report figure...")

    if not analysis_data:
        logging.error("Cannot create report: No analysis data.")
        fig = Figure(figsize=(10, 5), dpi=100)
        fig.set_facecolor(RSP_COLORS["background"])
        fig.text(0.5, 0.5, "Error: Analysis data unavailable.", ha='center', va='center', color=RSP_COLORS["danger"])
        return fig

    chart_keys = ["skills", "power", "mocap", "mobility"]
    valid_chart_data = []
    default_value = 50.0

    for key in chart_keys:
        data = analysis_data.get(key)
        if isinstance(data, dict) and \
           isinstance(data.get("values"), list) and \
           isinstance(data.get("labels"), list) and \
           isinstance(data.get("num_axes"), int) and \
           data["num_axes"] > 0 and \
           len(data["values"]) == data["num_axes"] and \
           len(data["labels"]) == data["num_axes"]:
            valid_values = []
            for v in data["values"]:
                try: valid_values.append(float(v))
                except (ValueError, TypeError): valid_values.append(default_value)
            valid_labels = [str(lbl) for lbl in data["labels"]]
            valid_chart_data.append({
                "key": key, "title": str(data.get("title", key.capitalize())),
                "values": valid_values, "labels": valid_labels, "num_axes": data["num_axes"]
            })
        else:
            logging.warning(f"Data for chart '{key}' invalid or missing. Skipping. Data: {data}")

    def get_list_or_default(key: str, default_text: str) -> List[str]:
        raw_value = analysis_data.get(key, [default_text])
        if isinstance(raw_value, list): return [str(item) for item in raw_value if item is not None]
        elif isinstance(raw_value, str): return [raw_value]
        else: return [default_text]

    predictions = get_list_or_default("predictions", "No prediction data extracted.")
    roadmap = get_list_or_default("roadmap", "No roadmap data extracted.")
    video_summary = analysis_data.get("video_summary", "No video summary extracted.")
    if not isinstance(video_summary, str): video_summary = "Invalid summary format."
    num_charts = len(valid_chart_data)
    chart_cols = 2
    chart_rows_needed = (num_charts + chart_cols - 1) // chart_cols
    base_height_per_chart_row = 4.5
    height_per_text_section = 2.0
    height_for_summary = 1.5 # Added height for the summary section
    top_margin, bottom_margin = 1.5, 0.5
    fig_height = (chart_rows_needed * base_height_per_chart_row + 2 * height_per_text_section + height_for_summary + top_margin + bottom_margin)
    fig_width = 11

    fig = Figure(figsize=(fig_width, fig_height), dpi=120)
    fig.set_facecolor(RSP_COLORS["background"])
    # Add age/level to title if available
    title_text = "Pitcher Performance Analysis"
    if pitcher_age is not None and pitcher_level:
        title_text += f" (Age: {pitcher_age}, Level: {pitcher_level})"
    fig.suptitle(title_text, fontsize=18, y=1.0 - (top_margin / fig_height / 2), color=RSP_COLORS["text"], weight='bold')

    # Adjust grid rows for summary section
    total_grid_rows = chart_rows_needed * 5 + 2 * 2 + 2 # +2 rows for summary
    gs = fig.add_gridspec(total_grid_rows, chart_cols, hspace=0.9, wspace=0.4) # Increased hspace slightly

    max_val = 100
    polar_levels = [20, 40, 60, 80, max_val]

    for i, chart_info in enumerate(valid_chart_data):
        row, col = i // chart_cols, i % chart_cols
        # Add type hint for PolarAxes
        ax: plt.PolarAxes = fig.add_subplot(gs[row * 5:(row + 1) * 5, col], projection='polar') # type: ignore
        ax.set_facecolor(RSP_COLORS["background"])

        # Use the validated list 'valid_values' from the data processing step
        valid_values: List[float] = chart_info["values"] # This now holds the validated floats
        labels: List[str] = chart_info["labels"]
        num_axes: int = chart_info["num_axes"]
        angles: List[float] = cast(List[float], np.linspace(0, 2 * np.pi, num_axes, endpoint=False).tolist())
        # Ensure plot_values uses the validated list and handle potential empty list
        # Explicitly create the list to potentially help Pylance
        plot_values: List[float] = []
        if valid_values:
            plot_values = valid_values + [valid_values[0]] # type: ignore
        plot_angles: List[float] = angles + [angles[0]] if angles else []
        color = RSP_COLORS["chart_colors"].get(chart_info["key"], "gray")

        # These methods exist on PolarAxes, Pylance might be confused
        ax.set_theta_direction(-1); ax.set_theta_offset(np.pi / 2)
        if plot_values and plot_angles: # Only plot if data exists
            ax.plot(plot_angles, plot_values, 'o-', linewidth=2, color=color, markersize=5, zorder=3)
            ax.fill(plot_angles, plot_values, alpha=0.3, color=color, zorder=2)
        ax.set_xticks(angles); ax.set_xticklabels([])
        ax.set_yticks(polar_levels); ax.set_yticklabels([])
        ax.set_ylim(0, max_val + 15)
        # Removed all styling kwargs to avoid internal conflicts with Text.set()
        ax.set_rgrids(polar_levels, labels=None)

        label_radius = max_val + 10
        # Type hint for angle_val in loop
        for label, angle_val in zip(labels, angles):
             angle_val: float # Hint type
             ha, va = 'center', 'center'
             if np.isclose(angle_val, 0): va = 'bottom'
             elif np.isclose(angle_val, np.pi / 2): ha = 'left'
             elif np.isclose(angle_val, np.pi): va = 'top'
             elif np.isclose(angle_val, 3 * np.pi / 2): ha = 'right'
             elif 0 < angle_val < np.pi: va = 'bottom'
             else: va = 'top'
             ax.text(angle_val, label_radius, label, fontsize=9, color=RSP_COLORS["text"], ha=ha, va=va, wrap=True)

        ax.spines['polar'].set_visible(False)
        ax.set_title(chart_info["title"], size=14, pad=30, color=RSP_COLORS["text"], weight='bold')

    # Add Video Summary Section
    summary_start_row = chart_rows_needed * 5
    ax_summary = fig.add_subplot(gs[summary_start_row:summary_start_row + 2, :])
    ax_summary.axis('off'); ax_summary.set_facecolor(RSP_COLORS["background"])
    ax_summary.set_title("Video Summary", fontsize=14, fontweight='bold', color=RSP_COLORS["text"], pad=15)
    # Wrap text for summary
    summary_lines = video_summary.split('\n') # Basic split, consider textwrap library for complex cases
    summary_y_start, summary_line_height = 0.85, 0.18
    for i, line in enumerate(summary_lines):
        ax_summary.text(0.05, summary_y_start - i * summary_line_height, line, fontsize=10, color=RSP_COLORS["text"], va='top', wrap=True)


    # Adjust start row for subsequent text sections
    text_start_row = summary_start_row + 2
    ax_predictions = fig.add_subplot(gs[text_start_row:text_start_row + 2, :])
    ax_predictions.axis('off'); ax_predictions.set_facecolor(RSP_COLORS["background"])
    ax_predictions.set_title("Areas for Development / Potential Risks", fontsize=14, fontweight='bold', color=RSP_COLORS["text"], pad=15)
    pred_y_start, pred_line_height = 0.85, 0.15
    for i, line in enumerate(predictions): ax_predictions.text(0.05, pred_y_start - i * pred_line_height, f"• {line}", fontsize=10, color=RSP_COLORS["text"], va='top', wrap=True)

    ax_roadmap = fig.add_subplot(gs[text_start_row + 2:text_start_row + 4, :])
    ax_roadmap.axis('off'); ax_roadmap.set_facecolor(RSP_COLORS["background"])
    ax_roadmap.set_title("Recommendations / Roadmap", fontsize=14, fontweight='bold', color=RSP_COLORS["text"], pad=15)
    road_y_start, road_line_height = 0.85, 0.15
    for i, line in enumerate(roadmap): ax_roadmap.text(0.05, road_y_start - i * road_line_height, f"• {line}", fontsize=10, color=RSP_COLORS["text"], va='top', wrap=True)

    fig.subplots_adjust(top=1.0 - (top_margin / fig_height), bottom=bottom_margin / fig_height)
    logging.info("Pitcher report figure created.")
    return fig

def save_figure_to_file(fig: Figure, filename: str) -> Optional[str]:
    """Save a matplotlib figure to a file."""
    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        fig.savefig(filename, bbox_inches='tight', dpi=150, facecolor=fig.get_facecolor())
        logging.info(f"Saved figure to {filename}")
        return filename
    except Exception as e:
        logging.error(f"Error saving figure to {filename}: {e}", exc_info=True)
        return None

# --- Gradio App Creation ---
def create_app():
    """Create the main Gradio app interface"""
    logging.info("Creating Gradio app interface...")
    custom_css = f"""
    .logo-container {{ text-align: center; margin-bottom: 10px; }}
    .gradio-container {{ max-width: 95% !important; }}
    .status-msg {{ font-weight: bold; padding: 10px; border-radius: 5px; margin-top: 10px; }}
    .status-processing {{ background-color: #e3f2fd; border: 1px solid {RSP_COLORS['accent']}; }}
    .status-success {{ background-color: #e8f5e9; border: 1px solid {RSP_COLORS['success']}; color: #1b5e20; }}
    .status-warning {{ background-color: #fff8e1; border: 1px solid {RSP_COLORS['warning']}; color: #e65100; }}
    .status-error {{ background-color: #ffebee; border: 1px solid {RSP_COLORS['danger']}; color: #b71c1c; }}
    #report-image img {{ max-width: 100%; height: auto; border: 1px solid #ddd; }}
    .download-button-row {{ justify-content: center; margin-top: 15px; }}
    footer {{ display: none !important; }}
    """

    with gr.Blocks(theme=gr.themes.Base(primary_hue="indigo", secondary_hue="blue"), css=custom_css, title="RSP Pitching Analysis") as app:
        if os.path.exists(LOGO_PATH):
            gr.HTML(f'<div class="logo-container"><img src="file={os.path.abspath(LOGO_PATH)}" alt="RSP Logo" style="max-height: 80px;"></div>')
        else:
            gr.HTML('<h1 style="text-align: center; color: #1a237e;">Revolution Sports Performance</h1>')

        gr.Markdown("<h2 style='text-align: center;'>Pitching Biomechanics Analysis (Powered by Gemini)</h2>")
        gr.Markdown("Upload pitching media using one or more options below. Video is highly recommended for comprehensive analysis.", elem_id="app-description")

        with gr.Row():
             with gr.Column(scale=3):
                 gr.Markdown("### Media Input Options")
                 with gr.Accordion("⬆️ Upload Local Video(s)", open=False):
                     video_input = gr.File(label="Select Video Files", file_count="multiple", file_types=["video"])
                     gr.Markdown("<p style='font-size:0.9em; color:grey;'><i>Max individual file size: 2GB.</i></p>")
                 with gr.Accordion("🖼️ Upload Local Image(s)", open=False):
                     image_input = gr.File(label="Select Image Files", file_count="multiple", file_types=["image"])
                     gr.Markdown("<p style='font-size:0.9em; color:grey;'><i>Useful for specific positions.</i></p>")
                 with gr.Accordion("☁️ Add Google Drive Link(s)", open=False):
                     drive_url_input = gr.Textbox(label="Google Drive Sharable URLs (one per line)", placeholder="Ensure 'Anyone with the link' can view.", lines=3)
                     gr.Markdown("<p style='font-size:0.9em; color:grey;'><i>Requires one-time Google auth.</i></p>")
                 with gr.Accordion("▶️ Add YouTube Video Link", open=False):
                     youtube_url_input = gr.Textbox(label="YouTube Video URL (Public Videos Only)", placeholder="Enter a single public URL.", lines=1)
                     gr.Markdown(f"<p style='font-size:0.9em; color:grey;'><i>Note: Only first valid URL processed. Max length ~1hr (Flash) / ~2hr (Pro).</i></p>")
             with gr.Column(scale=1):
                gr.Markdown("### Analysis Configuration")
                focus_options = gr.Radio(label="Primary Analysis Focus", choices=["General Analysis", "Velocity Improvement", "Injury Prevention", "Pitch Consistency"], value="General Analysis")
                with gr.Row():
                    pitcher_age = gr.Slider(label="Pitcher Age", minimum=10, maximum=40, step=1, value=16, scale=2)
                    pitcher_level = gr.Dropdown(label="Level", choices=["Youth", "High School", "College", "Professional"], value="High School", scale=1)
                user_analysis_request = gr.Textbox(label="Specific Request / Context (Optional)", placeholder="e.g., Focus on lead leg block...", lines=3)

        with gr.Row():
            analyze_button = gr.Button("✨ Generate Analysis Report", variant="primary", scale=3)
        status_output = gr.Markdown("Status: Ready", elem_classes=["status-msg"])

        with gr.Column(visible=False) as results_area:
            gr.Markdown("---")
            gr.Markdown("## 📝 Analysis Summary")
            video_summary_output = gr.Markdown("Summary will appear here...")
            gr.Markdown("---")
            gr.Markdown("## 📊 Visual Report")
            report_plot_output = gr.Plot(label="Pitcher Performance Report")
            with gr.Row(elem_classes="download-button-row"):
                 download_button = gr.Button("⬇️ Download Full Report (PNG)")
                 report_download_file = gr.File(visible=False, label="Download Trigger")

        # --- Main Interface Function ---
        def run_analysis_interface(
            video_files: Optional[List[Any]], image_files: Optional[List[Any]],
            drive_urls_text: str, youtube_urls_text: str,
            focus: str, age: int, level: str, user_request: str,
            progress=gr.Progress() # Removed track_progress=True
        ):
            progress(0, desc="Starting Analysis...")
            start_time_analysis = time.time()
            input_files_to_cache: List[Dict[str, Any]] = []
            processed_for_file_api: List[str] = []
            youtube_link_to_process: Optional[str] = None
            active_file_refs: List[Any] = [] # Stores File objects from genai.upload_file
            timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            drive_service = None
            final_report_path: Optional[str] = None
            markdown_report: Optional[str] = None
            structured_analysis_data: Optional[Dict[str, Any]] = None
            report_figure: Optional[Figure] = None

            yield { # Initial UI state
                status_output: gr.update(value="⏳ Status: Initializing...", elem_classes=["status-msg", "status-processing"]),
                results_area: gr.update(visible=False), video_summary_output: gr.update(value=""),
                report_plot_output: gr.update(value=None), report_download_file: gr.update(value=None, visible=False)
            }

            try:
                # 1. Cache Local Uploads
                progress(0.05, desc="Processing uploaded files...")
                input_index = 0
                if video_files:
                    logging.info(f"Processing {len(video_files)} uploaded video(s).")
                    for vid_file in video_files:
                        cached_path = cache_uploaded_file(vid_file, CACHE_DIR, timestamp_str, input_index)
                        if cached_path:
                            input_files_to_cache.append({"path": cached_path, "type": "video", "origin": "upload", "original_name": getattr(vid_file, 'orig_name', os.path.basename(cached_path))})
                            input_index += 1
                        else: yield {status_output: gr.update(value=f"⚠️ Warn: Failed to cache video '{getattr(vid_file, 'orig_name', 'N/A')}'. Skip.", elem_classes=["status-msg", "status-warning"])}
                if image_files:
                    logging.info(f"Processing {len(image_files)} uploaded image(s).")
                    for img_file in image_files:
                         cached_path = cache_uploaded_file(img_file, CACHE_DIR, timestamp_str, input_index)
                         if cached_path:
                             input_files_to_cache.append({"path": cached_path, "type": "image", "origin": "upload", "original_name": getattr(img_file, 'orig_name', os.path.basename(cached_path))})
                             input_index += 1
                         else: yield {status_output: gr.update(value=f"⚠️ Warn: Failed cache image '{getattr(img_file, 'orig_name', 'N/A')}'. Skip.", elem_classes=["status-msg", "status-warning"])}

                # 2. Handle Google Drive
                drive_urls = [url.strip() for url in drive_urls_text.splitlines() if url.strip()]
                if drive_urls:
                    progress(0.1, desc="Processing Google Drive links...")
                    if GOOGLE_LIBS_AVAILABLE:
                        logging.info(f"Processing {len(drive_urls)} GDrive URL(s).")
                        yield {status_output: gr.update(value="⏳ Status: Accessing GDrive...", elem_classes=["status-msg", "status-processing"])}
                        try:
                             progress(0.12, desc="Authenticating GDrive...")
                             drive_service = get_drive_service()
                        except Exception as auth_err:
                            yield {status_output: gr.update(value=f"❌ Error GDrive Auth: {auth_err}.", elem_classes=["status-msg", "status-error"])}; drive_service = None
                        if drive_service:
                            for i, url in enumerate(drive_urls):
                                progress(0.15 + 0.1 * (i / len(drive_urls)), desc=f"Downloading GDrive {i+1}/{len(drive_urls)}...")
                                yield {status_output: gr.update(value=f"⏳ Status: Downloading GDrive {i+1}/{len(drive_urls)}...", elem_classes=["status-msg", "status-processing"])}
                                file_id = extract_drive_file_id(url)
                                if file_id:
                                    try:
                                        downloaded_path = download_drive_file(drive_service, file_id, CACHE_DIR, f"{timestamp_str}_{input_index}")
                                        if downloaded_path and os.path.exists(downloaded_path):
                                            mtype, _ = mimetypes.guess_type(downloaded_path)
                                            file_type = "video" if mtype and mtype.startswith("video") else "image" if mtype and mtype.startswith("image") else "unknown"
                                            input_files_to_cache.append({"path": downloaded_path, "type": file_type, "origin": "drive", "original_name": os.path.basename(downloaded_path)})
                                            input_index += 1
                                        else: yield {status_output: gr.update(value=f"⚠️ Warn: Failed secure GDrive file {url}. Skip.", elem_classes=["status-msg", "status-warning"])}
                                    except Exception as dl_err: yield {status_output: gr.update(value=f"⚠️ Warn: Failed GDrive dl {url}: {dl_err}. Skip.", elem_classes=["status-msg", "status-warning"])}
                                else: yield {status_output: gr.update(value=f"⚠️ Warn: Invalid GDrive URL: {url}. Skip.", elem_classes=["status-msg", "status-warning"])}
                    else: yield {status_output: gr.update(value="⚠️ Warn: GDrive libs missing. Skip URLs.", elem_classes=["status-msg", "status-warning"])}

                # 3. Process YouTube URL
                progress(0.25, desc="Processing YouTube link...")
                youtube_urls = [url.strip() for url in youtube_urls_text.splitlines() if url.strip() and ("youtube.com" in url or "youtu.be" in url)]
                if len(youtube_urls) >= 1:
                    youtube_link_to_process = youtube_urls[0]
                    if len(youtube_urls) > 1: yield {status_output: gr.update(value=f"⚠️ Warn: Using first YouTube URL: {youtube_urls[0]}", elem_classes=["status-msg", "status-warning"])}
                    logging.info(f"Using YouTube URL: {youtube_link_to_process}")
                else: logging.info("No valid YouTube URL provided.")

                # 4. Validation
                if not input_files_to_cache and not youtube_link_to_process:
                     yield {status_output: gr.update(value="❌ Error: No valid media provided.", elem_classes=["status-msg", "status-error"])}; return
                logging.info(f"Inputs: {len(input_files_to_cache)} files, YouTube: {'Yes' if youtube_link_to_process else 'No'}")

                # 5. Prepare Files for File API (Convert non-MP4 videos)
                progress(0.3, desc="Preparing files (conversion)...")
                yield {status_output: gr.update(value="⏳ Status: Preparing files...", elem_classes=["status-msg", "status-processing"])}
                for i, file_info in enumerate(input_files_to_cache):
                    if file_info["type"] == "video":
                        _, ext = os.path.splitext(file_info['path'])
                        if ext.lower() != '.mp4':
                            progress(0.3 + 0.1 * (i / len(input_files_to_cache)), desc=f"Converting video {i+1}...")
                            converted_path = convert_video_to_mp4(file_info["path"], CACHE_DIR, f"{timestamp_str}_{i}_conv")
                            if converted_path and os.path.exists(converted_path): processed_for_file_api.append(converted_path)
                            else:
                                yield {status_output: gr.update(value=f"⚠️ Warn: Convert failed '{file_info['original_name']}'. Using original?", elem_classes=["status-msg", "status-warning"])}
                                if os.path.exists(file_info['path']): processed_for_file_api.append(file_info["path"])
                                else: yield {status_output: gr.update(value=f"❌ Error: Failed convert/original missing '{file_info['original_name']}'. Skip.", elem_classes=["status-msg", "status-error"])}
                        else: processed_for_file_api.append(file_info["path"])
                    elif file_info["type"] == "image":
                        if os.path.exists(file_info['path']): processed_for_file_api.append(file_info["path"])
                    else: logging.warning(f"Skipping unknown file type: {file_info['path']}")
                if not processed_for_file_api and not youtube_link_to_process:
                    yield {status_output: gr.update(value="❌ Error: File prep failed.", elem_classes=["status-msg", "status-error"])}; return
                logging.info(f"Files ready for File API: {len(processed_for_file_api)}")

                # --- Stage 1: Gemini Analysis ---
                progress(0.4, desc="Stage 1: Uploading files...")
                yield {status_output: gr.update(value="⏳ Stage 1: Uploading files...", elem_classes=["status-msg", "status-processing"])}

                # A. Upload files via File API using top-level functions
                FILE_PROCESSING_TIMEOUT = 300; FILE_CHECK_INTERVAL = 15
                if processed_for_file_api:
                    logging.info(f"--- Uploading {len(processed_for_file_api)} files via File API ---")
                    total_files_to_upload = len(processed_for_file_api)
                    for idx, file_path in enumerate(processed_for_file_api):
                        file_ref = None
                        file_basename = os.path.basename(file_path)
                        progress(0.4 + 0.2 * (idx / total_files_to_upload), desc=f"Stage 1: Uploading {idx+1}/{total_files_to_upload} ({file_basename})...")
                        yield {status_output: gr.update(value=f"⏳ Stage 1: Uploading {idx+1}/{total_files_to_upload} ({file_basename})...", elem_classes=["status-msg", "status-processing"])}
                        try:
                            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
                            if file_size_mb > 1990:
                                 yield {status_output: gr.update(value=f"❌ Error: '{file_basename}' > 2GB. Skip.", elem_classes=["status-msg", "status-error"])}; continue
                            logging.info(f"Stage 1: Uploading {file_path} ({file_size_mb:.2f} MB)...")
                            start_upload_time = time.time()
                            # Use top-level upload_file
                            file_ref = genai.upload_file(path=file_path, display_name=file_basename)
                            upload_duration = time.time() - start_upload_time
                            logging.info(f"Stage 1: Upload for {file_basename} (Name: {file_ref.name}) in {upload_duration:.2f}s. Processing...")
                            yield {status_output: gr.update(value=f"⏳ Stage 1: Processing {idx+1}/{total_files_to_upload} ({file_basename})...", elem_classes=["status-msg", "status-processing"])}

                            start_wait_time = time.time()
                            while file_ref.state.name == "PROCESSING": # State check remains the same
                                elapsed_wait = time.time() - start_wait_time
                                if elapsed_wait > FILE_PROCESSING_TIMEOUT:
                                    logging.error(f"Stage 1: Timeout waiting for {file_ref.name}.")
                                    yield {status_output: gr.update(value=f"⚠️ Stage 1: Timeout processing {file_basename}. Skip.", elem_classes=["status-msg", "status-warning"])}
                                    try: genai.delete_file(name=file_ref.name) # Use top-level delete
                                    except Exception as del_err: logging.warning(f"Could not delete timed-out file {file_ref.name}: {del_err}")
                                    file_ref = None; break
                                time.sleep(FILE_CHECK_INTERVAL)
                                try:
                                    file_ref = genai.get_file(name=file_ref.name) # Use top-level get
                                except Exception as get_err:
                                     logging.error(f"Error re-fetching status for {file_ref.name}: {get_err}. Assuming failure.")
                                     try: genai.delete_file(name=file_ref.name) # Use top-level delete
                                     except Exception: pass
                                     file_ref = None; break

                            if file_ref is None: continue

                            processing_duration = time.time() - start_wait_time
                            if file_ref.state.name == "ACTIVE":
                                logging.info(f"Stage 1: File {file_ref.name} ({file_basename}) ACTIVE after {processing_duration:.2f}s.")
                                active_file_refs.append(file_ref) # Add the File object
                            elif file_ref.state.name == "FAILED":
                                logging.error(f"Stage 1: File {file_ref.name} processing FAILED.")
                                yield {status_output: gr.update(value=f"❌ Stage 1: Failed processing {file_basename}. Skip.", elem_classes=["status-msg", "status-error"])}
                                try: genai.delete_file(name=file_ref.name)
                                except Exception as del_err: logging.warning(f"Could not delete failed file {file_ref.name}: {del_err}")
                            else:
                                 logging.warning(f"Stage 1: File {file_ref.name} unexpected state: {file_ref.state.name}. Skip.")
                                 yield {status_output: gr.update(value=f"⚠️ Stage 1: File {file_basename} unexpected state ({file_ref.state.name}). Skip.", elem_classes=["status-msg", "status-warning"])}
                                 try: genai.delete_file(name=file_ref.name)
                                 except Exception as del_err: logging.warning(f"Could not delete file {file_ref.name}: {del_err}")
                        except Exception as e:
                            logging.error(f"Stage 1: Error during File API for {file_path}: {e}", exc_info=True)
                            yield {status_output: gr.update(value=f"⚠️ Stage 1: Error with file {file_basename}: {e}. Skip.", elem_classes=["status-msg", "status-warning"])}
                            if file_ref and hasattr(file_ref, 'name'):
                                 try: genai.delete_file(name=file_ref.name)
                                 except Exception as del_e: logging.warning(f"Could not delete file {file_ref.name} after error: {del_e}")
                    logging.info(f"File API finished. {len(active_file_refs)}/{total_files_to_upload} files ACTIVE.")
                    if total_files_to_upload > 0 and not active_file_refs and not youtube_link_to_process:
                         yield {status_output: gr.update(value="❌ Error: All file uploads failed.", elem_classes=["status-msg", "status-error"])}; return

                # B. Construct `contents` list
                content_parts = []
                context_text = f"Pitcher Profile: Age {age}, Level: {level}. Focus: {focus}."
                user_req_text = f"User Request: {user_request}" if user_request else "User Request: None."
                full_user_request_context = f"{context_text}\n{user_req_text}"
                try:
                    # Replace both placeholders now
                    prompt_text_intermediate = COMPLEX_BIOMECHANICS_PROMPT.replace("{{user_request_context}}", full_user_request_context)
                    prompt_text = prompt_text_intermediate.replace("{{user_request_details_for_review}}", user_request if user_request else "None")
                    content_parts.append(prompt_text)
                except Exception as fmt_err:
                    logging.error(f"Error formatting prompt: {fmt_err}. Using raw.", exc_info=True)
                    content_parts.append(COMPLEX_BIOMECHANICS_PROMPT)
                    content_parts.append(full_user_request_context)

                content_parts.extend(active_file_refs) # Add File objects directly

                youtube_part = None # Define youtube_part outside the if
                if youtube_link_to_process:
                    try:
                        # Use types.Part and types.FileData and ignore Pylance error if it persists
                        youtube_part = types.Part(file_data=types.FileData(mime_type="video/youtube", file_uri=youtube_link_to_process)) # type: ignore
                        content_parts.append(youtube_part)
                        logging.info(f"Added YouTube URL part: {youtube_link_to_process}")
                    except Exception as yt_part_err:
                        logging.error(f"Failed create YouTube part {youtube_link_to_process}: {yt_part_err}", exc_info=True)
                        yield {status_output: gr.update(value=f"⚠️ Error adding YouTube link. Skip.", elem_classes=["status-msg", "status-warning"])}

                # C. Check if anything to send
                if len(content_parts) <= 1:
                    yield {status_output: gr.update(value="❌ Error: No media available for analysis.", elem_classes=["status-msg", "status-error"])}; return

                # D. Make Stage 1 API Call
                num_media_items = len(active_file_refs) + (1 if youtube_link_to_process and youtube_part in content_parts else 0)
                progress(0.6, desc=f"Stage 1: Sending {num_media_items} media items...")
                logging.info(f"Sending Stage 1 request ({GEMINI_MODEL_NAME}) with {num_media_items} media.")
                yield {status_output: gr.update(value=f"⏳ Stage 1: Sending {num_media_items} media to Gemini...", elem_classes=["status-msg", "status-processing"])}
                try:
                    start_api_call_time = time.time()
                    response = gemini_client.generate_content(contents=content_parts, request_options={'timeout': REQUEST_TIMEOUT})
                    api_call_duration = time.time() - start_api_call_time
                    logging.info(f"Stage 1: Gemini API call completed in {api_call_duration:.2f}s.")

                    if not response or not hasattr(response, 'text') or not response.text:
                         logging.error("Stage 1: Gemini API returned invalid/empty text.")
                         finish_reason = "Unknown"; safety_info = ""
                         if response and hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                             if response.prompt_feedback.block_reason: finish_reason = f"Blocked - {response.prompt_feedback.block_reason}"
                         if response and hasattr(response, 'candidates') and response.candidates: finish_reason = response.candidates[0].finish_reason # Safety ratings removed
                         yield {status_output: gr.update(value=f"❌ Error: Gemini Stage 1 empty response. Reason: {finish_reason}.", elem_classes=["status-msg", "status-error"])}; return

                    markdown_report = response.text
                    logging.info("Stage 1: Received Markdown response.")
                    logging.debug(f"Stage 1 Markdown Snippet:\n{markdown_report[:500]}...")

                # Check if google_exceptions was imported before using specific exceptions
                except google_exceptions.GoogleAPIError if google_exceptions else Exception as api_error:
                     logging.error(f"Stage 1: Gemini API Error: {type(api_error).__name__} - {api_error}", exc_info=False)
                     error_message = f"❌ Error: Gemini API Error - {api_error}"
                     # Check specific types only if google_exceptions is available
                     if google_exceptions:
                         if isinstance(api_error, google_exceptions.ResourceExhausted): error_message = "❌ Error: Gemini Quota Exceeded?"
                         elif isinstance(api_error, google_exceptions.DeadlineExceeded): error_message = f"❌ Error: Gemini Timed Out (>{REQUEST_TIMEOUT}s)."
                     yield {status_output: gr.update(value=error_message, elem_classes=["status-msg", "status-error"])}; return
                except Exception as e:
                    # Catch other potential errors during the API call
                    logging.error(f"Stage 1: Unexpected error during Gemini call: {e}", exc_info=True)
                    yield {status_output: gr.update(value=f"❌ Error: Unexpected failure Stage 1: {e}", elem_classes=["status-msg", "status-error"])}; return

                # --- Stage 2: JSON Extraction ---
                progress(0.8, desc="Stage 2: Extracting data...")
                yield {status_output: gr.update(value="⏳ Stage 2: Extracting data...", elem_classes=["status-msg", "status-processing"])}
                if not markdown_report:
                     yield {status_output: gr.update(value="❌ Error: Stage 1 report missing for Stage 2.", elem_classes=["status-msg", "status-error"])}; return
                structured_analysis_data = run_stage2_extraction(markdown_report)
                if not structured_analysis_data:
                    yield { # Show raw report if extraction fails
                        status_output: gr.update(value="⚠️ Warn: Stage 2 extraction failed. Show raw report.", elem_classes=["status-msg", "status-warning"]),
                        results_area: gr.update(visible=True),
                        video_summary_output: gr.update(value=f"**Stage 1 Raw Report (Stage 2 Failed):**\n\n---\n{markdown_report}\n---"),
                        report_plot_output: gr.update(value=None), report_download_file: gr.update(value=None, visible=False)
                    }; return
                logging.info("Stage 2: Successfully received structured data.")

                # --- Report Generation ---
                progress(0.9, desc="Generating visual report...")
                yield {status_output: gr.update(value="⏳ Status: Generating report...", elem_classes=["status-msg", "status-processing"])}
                report_figure = create_pitcher_report(structured_analysis_data, pitcher_age=age, pitcher_level=level)
                report_filename = f"pitcher_analysis_report_{timestamp_str}.png"
                output_filepath = os.path.join(RESULTS_DIR, report_filename)
                saved_report_path = save_figure_to_file(report_figure, output_filepath)
                if not saved_report_path:
                    logging.error("Failed to save report figure.")
                    yield { # Show plot even if save fails
                        status_output: gr.update(value="⚠️ Warn: Analysis complete, save failed.", elem_classes=["status-msg", "status-warning"]),
                        results_area: gr.update(visible=True), video_summary_output: gr.update(value=structured_analysis_data.get("video_summary", "N/A")),
                        report_plot_output: gr.update(value=report_figure), report_download_file: gr.update(value=None, visible=False)
                    }
                else:
                    final_report_path = saved_report_path
                    logging.info(f"Report generated and saved: {final_report_path}")

                # --- Final UI Update ---
                progress(1.0, desc="Analysis Complete!")
                analysis_duration = time.time() - start_time_analysis
                logging.info(f"Analysis complete ({analysis_duration:.2f}s). Updating UI.")
                yield {
                    status_output: gr.update(value=f"✅ Analysis complete! ({analysis_duration:.1f}s)", elem_classes=["status-msg", "status-success"]),
                    results_area: gr.update(visible=True), video_summary_output: gr.update(value=structured_analysis_data.get("video_summary", "Summary not extracted.")),
                    report_plot_output: gr.update(value=report_figure), report_download_file: gr.update(value=final_report_path, visible=bool(final_report_path))
                }

            except Exception as e:
                logging.error(f"Unhandled error in pipeline: {e}", exc_info=True)
                yield { status_output: gr.update(value=f"❌ Unhandled Error: {e}. Check logs.", elem_classes=["status-msg", "status-error"]),
                        results_area: gr.update(visible=False), report_plot_output: gr.update(value=None), report_download_file: gr.update(value=None, visible=False) }
            finally:
                 logging.info("Analysis run finished.")
                 if report_figure: plt.close(report_figure); logging.info("Closed report figure.")
                 # Cleanup File API files
                 if active_file_refs:
                     logging.info(f"Cleaning up {len(active_file_refs)} File API files.")
                     deleted_count = 0
                     for ref in active_file_refs:
                         try:
                              logging.debug(f"Deleting file: {ref.name}")
                              genai.delete_file(name=ref.name) # Use top-level delete
                              deleted_count += 1
                         except Exception as del_e: logging.warning(f"Could not delete file {ref.name}: {del_e}")
                     logging.info(f"Cleanup attempt: {deleted_count}/{len(active_file_refs)} files deleted.")

        # --- Event Handlers ---
        analyze_button.click(
            fn=run_analysis_interface,
            inputs=[ video_input, image_input, drive_url_input, youtube_url_input, focus_options, pitcher_age, pitcher_level, user_analysis_request ],
            outputs=[ status_output, results_area, video_summary_output, report_plot_output, report_download_file ]
        )

        def trigger_download(filepath_to_download: Optional[str]) -> Optional[str]:
            if filepath_to_download and os.path.exists(filepath_to_download):
                logging.info(f"Triggering download for: {filepath_to_download}")
                return filepath_to_download
            else:
                logging.warning(f"Download trigger failed: File invalid/missing '{filepath_to_download}'.")
                return None
        download_button.click( fn=trigger_download, inputs=[report_download_file], outputs=[report_download_file] )

    logging.info("Gradio app interface defined.")
    return app

# --- Main Execution ---
if __name__ == "__main__":
    logging.info("--- Starting RSP Pitching Analysis Application ---")
    os.makedirs(RESULTS_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)
    logging.info(f"Directories ensured: {os.path.abspath(RESULTS_DIR)}, {os.path.abspath(CACHE_DIR)}")

    try: # Determine allowed paths
        allowed_paths = list(set(os.path.abspath(p) for p in [RESULTS_DIR, CACHE_DIR, SCRIPT_DIR] if os.path.isdir(p) or os.path.isfile(p)))
        logging.info(f"Gradio Allowed Paths: {allowed_paths}")
    except Exception as e:
        logging.error(f"Error determining allowed paths: {e}. Using defaults.")
        allowed_paths = [os.path.abspath(RESULTS_DIR), os.path.abspath(CACHE_DIR), os.path.abspath(".")]

    # Pre-launch checks already handle Gemini config failure by exiting

    # Check FFMPEG using subprocess
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, check=False) # Use subprocess
        if result.returncode == 0 and 'ffmpeg version' in result.stdout.lower():
            logging.info("ffmpeg command seems accessible via 'ffmpeg -version'.")
        else:
            stderr_msg = result.stderr or result.stdout # Get output/error
            logging.warning(f"ffmpeg command issue? Return code: {result.returncode}. Output/Stderr hint: {stderr_msg[:200]}...")
    except FileNotFoundError:
        logging.error("FATAL: ffmpeg command not found in PATH. Video conversion will likely fail.")
    except Exception as ff_check_err:
        logging.warning(f"Could not verify ffmpeg presence via 'subprocess': {ff_check_err}")


    app = create_app()
    logging.info("Launching Gradio app...")
    print("\n" + "="*60)
    print(" Starting Gradio Server...")
    print(" Access via the URL below.")
    print(f" Logs: {os.path.abspath('analysis_app.log')}")
    print(" Press CTRL+C to stop.")
    print("="*60 + "\n")

    app.launch(
        server_name="0.0.0.0", server_port=7860, share=True,
        allowed_paths=allowed_paths, max_threads=10 # Removed enable_queue=True
    )
    logging.info("Gradio app shut down.")
