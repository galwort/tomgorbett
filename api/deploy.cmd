@echo off
echo Installing dependencies...
cd api
pip install --upgrade pip
pip install -r requirements.txt
cd ..
echo Deployment completed successfully.