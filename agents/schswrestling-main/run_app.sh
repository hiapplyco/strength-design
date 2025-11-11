#!/bin/bash

echo "Starting Sage Creek Wrestling Analyzer..."
echo "----------------------------------------"

# Check if python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found on your system."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is required but not found on your system."
    echo "Please install pip3 and try again."
    exit 1
fi

# Check if virtual environment exists, if not create one
if [ ! -d "venv" ]; then
    echo "Setting up virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment."
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install or update requirements
echo "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    exit 1
fi

# Check if .streamlit/secrets.toml exists
if [ ! -f ".streamlit/secrets.toml" ]; then
    echo "Warning: .streamlit/secrets.toml not found."
    echo "Creating a template for you to fill in with your API keys."
    
    # Create directory if it doesn't exist
    mkdir -p .streamlit
    
    # Create template secrets file
    cat > .streamlit/secrets.toml << EOL
# Google API Key for Gemini
[google]
api_key = "YOUR_GOOGLE_API_KEY_HERE"

# Optional: ElevenLabs API Key for voice generation
[elevenlabs]
api_key = "YOUR_ELEVENLABS_API_KEY_HERE"
EOL

    echo "Please edit .streamlit/secrets.toml to add your API keys before running the app."
    exit 1
else
    # Check if keys are placeholders
    if grep -q "YOUR_GOOGLE_API_KEY_HERE" .streamlit/secrets.toml; then
        echo "Warning: Google API key not set in .streamlit/secrets.toml"
        echo "Please edit .streamlit/secrets.toml to add your API keys before running the app."
        exit 1
    fi
fi

echo "----------------------------------------"
echo "Starting Streamlit app..."
streamlit run optimized_app.py