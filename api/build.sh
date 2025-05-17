#!/bin/bash
echo "Starting custom build process..."

# Install PyTorch explicitly first
pip install torch==2.0.1 --extra-index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

echo "Build process completed."