#!/bin/bash

# Navigate to the api directory
cd api

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Return to the original directory
cd ..