start powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/k cd backend && venv\Scripts\activate && python app.py' -NoNewWindow"
start powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/k cd frontend && npm start' -NoNewWindow"
exit
