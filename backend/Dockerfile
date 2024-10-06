# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory in the container to the root
WORKDIR /

# Copy the requirements file into the container
COPY requirements.txt .

# Install the required packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY ./app /app

# Set the Python path to include the root directory
ENV PYTHONPATH=/

# Expose the port the app runs on
EXPOSE ${BACKEND_PORT}

# Command to run the application
CMD uvicorn app.main:app --host ${BACKEND_HOST} --port ${BACKEND_PORT}
