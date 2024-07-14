#!/bin/sh

# Start the Ollama service
echo "Starting Ollama service..."
ollama serve &

# Wait for a few seconds to ensure the service is up
sleep 5

# Pull the Moondream model
echo "Pulling moondream model..."
ollama pull moondream
if [ $? -ne 0 ]; then
    echo "Failed to pull moondream model."
    exit 1
fi

# Start Flask app
echo "Starting Flask app..."
python3 app.py

# Keep the script running
wait
