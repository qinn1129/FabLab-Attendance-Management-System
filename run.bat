@echo off
setlocal enabledelayedexpansion

echo Installing frontend dependencies (if any are missing)...
call npm install

echo.
echo Installing mongo-service backend dependencies (if any are missing)...
call npm install --prefix mongo-service

echo.
echo Installing Python dependencies for the email service (if any are missing)...
pip install -r python-services/email-service/requirements.txt

echo.
if not exist mongo-service\.env (
	echo [WARNING] mongo-service\.env not found. Copy mongo-service\.env.example to
	echo           mongo-service\.env and fill in MONGODB_URI and WEBAPP_SECRET before
	echo           the backend will start.
	echo.
)

if not exist python-services/email-service\.env (
	echo [WARNING] python-services/email-service\.env not found. Copy python-services/email-service\.env.example to
	echo           python-services/email-service\.env and fill in GOOGLE_SCRIPT_URL, WEBAPP_SECRET,
	echo           and SENDER_APP_PASSWORD before announcement emails will work.
	echo.
)

echo Starting the MongoDB backend (http://127.0.0.1:4000)...
start "FabLab Mongo Service" cmd /k "cd mongo-service && npm start"

echo Waiting for the backend to come online...
set BACKEND_UP=0
for /L %%i in (1,1,10) do (
	curl -s -o "%TEMP%\fablab_backend_health.txt" -w "%%{http_code}" http://127.0.0.1:4000/api/health > "%TEMP%\fablab_backend_health_code.txt" 2>nul
	set /p BACKEND_CODE=<"%TEMP%\fablab_backend_health_code.txt"
	if "!BACKEND_CODE!"=="200" (
		set BACKEND_UP=1
		goto :backend_health_check_done
	)
	timeout /t 1 /nobreak > nul
)
:backend_health_check_done

if "!BACKEND_UP!"=="1" (
	echo Backend is up and responding.
) else (
	echo [WARNING] Could not confirm the backend is running. Check the
	echo           "FabLab Mongo Service" window for errors ^(often a MongoDB
	echo           connection issue — is MongoDB running / is MONGODB_URI correct?^).
)

echo.
echo Starting the email service (http://127.0.0.1:5001)...
start "FabLab Email Service" cmd /k "cd python-services/email-service && python app.py"

echo Waiting for the email service to come online...
set EMAIL_SERVICE_UP=0
for /L %%i in (1,1,10) do (
	curl -s -o "%TEMP%\fablab_health.txt" -w "%%{http_code}" http://127.0.0.1:5001/api/health > "%TEMP%\fablab_health_code.txt" 2>nul
	set /p HEALTH_CODE=<"%TEMP%\fablab_health_code.txt"
	if "!HEALTH_CODE!"=="200" (
		set EMAIL_SERVICE_UP=1
		goto :health_check_done
	)
	timeout /t 1 /nobreak > nul
)
:health_check_done

if "!EMAIL_SERVICE_UP!"=="1" (
	echo Email service is up and responding.
) else (
	echo [WARNING] Could not confirm the email service is running. Check the
	echo           "FabLab Email Service" window for errors.
)

echo.
echo Starting the development server...
call npm run dev
