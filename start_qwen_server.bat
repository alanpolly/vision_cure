@echo off
echo ==============================================
echo Installing requirements for Qwen Python server
echo ==============================================
cd server\engine
pip install -r requirements.txt

echo.
echo ==============================================
echo Starting Qwen Python model server...
echo It will load the model into memory.
echo ==============================================
python qwen_server.py
pause
