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

# Comment of Heroku deployment
EXPOSE $PORT

# Command to run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT