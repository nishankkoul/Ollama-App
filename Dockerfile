# Use the Ollama image as the base
FROM ollama/ollama:latest

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Expose port 5000 for the Flask app
EXPOSE 5000

# Copy the start script into the container
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Use the shell directly to run the start script
ENTRYPOINT ["/bin/sh", "/app/start.sh"]
