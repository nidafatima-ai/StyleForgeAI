$root = "$HOME\Desktop\StyleForgeAI"
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\backend'; & '$root\backend\.venv\Scripts\python.exe' -m uvicorn app.main:app --port 8000"
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\frontend'; & '$root\backend\.venv\Scripts\python.exe' -m http.server 5500"
Start-Sleep -Seconds 10
Start-Process "http://localhost:5500"
