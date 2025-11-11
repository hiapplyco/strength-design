# Sage Creek Wrestling Analyzer

An AI-powered wrestling technique analyzer application built with Streamlit and Google's Gemini 2.0 Flash model. The app allows wrestlers to upload videos of their techniques and receive detailed, expert-level feedback and coaching with an enhanced modern UI.

![Sage Creek Wrestling](https://files.smartsites.parentsquare.com/3483/design_img__ljsgi1.png)

## Features

- **Video Analysis**: Upload wrestling technique videos for AI-powered analysis
- **Expert Feedback**: Receive feedback in the style of Coach David Steele
- **Structured Analysis**:
  - Initial technique assessment
  - Key technical issues with timestamps
  - Specific drill recommendations
  - Strategic/mental approach insights
- **Enhanced Modern UI**:
  - Consistent design system with CSS variables
  - Responsive card-based layout
  - Smooth animations and transitions
  - Status indicators and progress tracking
  - Mobile-friendly design
- **Voice Synthesis**: Optional conversion of feedback to spoken audio (requires ElevenLabs API)

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/sage-creek-wrestling-analyzer.git
   cd sage-creek-wrestling-analyzer
   ```

2. Use the provided shell script to set up and run the application:
   ```bash
   chmod +x run_app.sh
   ./run_app.sh
   ```

   This script will:
   - Create a virtual environment
   - Install required dependencies
   - Check for API keys
   - Start the Streamlit application

### Manual Installation

If you prefer manual installation:

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows, use: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up API keys (see API Keys section)

4. Run the application:
   ```bash
   streamlit run optimized_app.py
   ```

## API Keys

This application requires:
1. **Google Generative AI API Key** (required)
2. **ElevenLabs API Key** (optional, for voice output)

### Setting up API Keys

1. Create a `.streamlit` directory in the project root:
   ```bash
   mkdir -p .streamlit
   ```

2. Create a `secrets.toml` file inside that directory:
   ```bash
   touch .streamlit/secrets.toml
   ```

3. Add your API keys to this file:
   ```toml
   [google]
   api_key = "YOUR_GOOGLE_API_KEY"

   [elevenlabs]
   api_key = "YOUR_ELEVENLABS_API_KEY"
   ```

### How to Get API Keys

- **Google Generative AI**: Visit [Google AI Studio](https://ai.google.dev/) to create an account and generate an API key.
- **ElevenLabs**: Create an account at [ElevenLabs](https://elevenlabs.io/) and get your API key from your account settings.

## Usage

1. Launch the application using the method described in the Installation section
2. Upload a wrestling technique video (MP4, MOV, or AVI format)
3. Enter a description of what technique you want analyzed
4. Click "Analyze Technique"
5. Review your detailed feedback with technical breakdown
6. Optional: Generate Coach Steele's voice analysis with ElevenLabs
7. Download your analysis as a markdown file or audio file if desired

## Development

### Project Structure

- `optimized_app.py`: Optimized main application with enhanced UI
- `app.py`: Original application file (for reference)
- `requirements.txt`: Python dependencies
- `run_app.sh`: Setup and run script
- `.streamlit/secrets.toml`: API key configuration

### Adding Features

To extend this application:

1. **Additional Analysis Types**: Modify the `analyze_wrestling_video()` function's analysis prompt
2. **UI Improvements**: Extend the CSS design system in the `load_css()` function
3. **New Models**: Support additional AI models by implementing new analysis functions
4. **Voice Customization**: Add new voice options in the `DEFAULT_VOICES` dictionary

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure your API keys are correctly entered in `.streamlit/secrets.toml`
2. **Video Processing Errors**: Try uploading a shorter video clip (15-60 seconds is optimal)
3. **Long Processing Times**: Large videos might take longer to process; the optimized app has a 3-minute timeout
4. **Installation Problems**: Ensure you have Python 3.8+ and pip installed
5. **Voice Generation Errors**: If ElevenLabs audio generation fails, check your API key and quota
6. **UI Rendering Issues**: Clear your browser cache if animations or styles don't display correctly

### Getting Help

If you encounter problems, try:
- Check the Streamlit error messages (the app now provides more specific error messages)
- Ensure your API keys are valid and have sufficient quota
- Verify your internet connection
- Try with a different, shorter video
- Check console logs for JavaScript errors if UI elements aren't working

## Optimizations from Original Version

The optimized version of the application includes significant improvements across multiple areas:

1. **Modern Design System**:
   - Implemented a comprehensive CSS variables system for colors, spacing, typography, and animations
   - Created a cohesive visual language with consistent brand colors (primary: #2B4736, secondary: #BF9D4E)
   - Added card-based UI components with consistent shadows, borders, and hover effects
   - Improved text hierarchy with 8 font size variables and proper heading styles
   - Designed custom status indicators and tags for system feedback
   - Added responsive breakpoints for better mobile viewing experience

2. **Enhanced User Experience**:
   - Implemented smooth fade and slide animations for UI components
   - Added progress tracking with detailed step indicators during video processing
   - Created clearer status messages with visual differentiation (success, error, info)
   - Improved form elements with better placeholders and visual feedback
   - Added interactive elements like expandable tips sections and status tags
   - Designed a more intuitive layout with logical information grouping

3. **AI Analysis Improvements**:
   - Upgraded to Gemini 2.0 Flash model for faster, more accurate analysis
   - Designed a structured analysis prompt with clear coaching sections:
     * Initial assessment for quick overview
     * Core technical breakdown with specific video timestamps
     * Corrective drill prescriptions with detailed execution instructions
     * Mental approach and strategic insights section
   - Added wrestling-specific terminology and coaching context to prompts
   - Improved voice synthesis script generation for more natural coach speech patterns
   - Implemented timeout protection for video processing (3-minute limit)

4. **Technical Architecture**:
   - Implemented proper typing with Python's typing module for better code reliability
   - Added comprehensive error handling with specific error messages and fallbacks
   - Improved memory management for video file handling with proper cleanup
   - Enhanced session state management with initialization patterns
   - Created modular function architecture with clear single responsibilities
   - Added thorough documentation with docstrings for all functions
   - Implemented resource cleanup to prevent memory leaks
   - Added file verification steps to prevent crashes from missing files

5. **Performance Optimizations**:
   - Optimized video loading process to reduce memory usage
   - Implemented more efficient state tracking to minimize unnecessary reruns
   - Added progress feedback during long-running processes
   - Improved error recovery to maintain application state after failures
   - Created background cleanup processes to manage temporary files

## License

[Specify your license here]

## Acknowledgments

- Sage Creek High School Wrestling Program
- Coach David Steele
- Google's Generative AI Team
- Streamlit Team
- ElevenLabs for voice synthesis technology