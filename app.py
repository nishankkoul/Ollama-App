from flask import Flask, request, jsonify
import ollama
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the Olama API! Use /generate to post prompts.'}), 200

@app.route('/generate', methods=['POST'])
def generate():
    # Log the incoming request
    logging.debug(f"Incoming request: {request.method} {request.url}")
    
    data = request.json
    prompt = data.get('prompt')
    
    if not prompt:
        logging.error("Prompt is required.")
        return jsonify({'error': 'Prompt is required'}), 400
    
    try:
        # Prepare the message structure for chat
        messages = [{'role': 'user', 'content': prompt}]
        response = ollama.chat(model='moondream', messages=messages)
        logging.debug("Response generated successfully.")
        return jsonify({'response': response['message']['content']}), 200
    except Exception as e:
        logging.error(f"Error generating response: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)


