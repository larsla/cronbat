FROM mcr.microsoft.com/devcontainers/python:3.11

# Install Node.js
ARG NODE_VERSION="18"
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    vim \
    nano \
    jq \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

# Set up Node.js environment
WORKDIR /workspace
