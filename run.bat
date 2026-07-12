@echo off
setlocal enabledelayedexpansion

echo Installing dependencies (if any are missing)...
call npm install

echo.
echo Installing Python dependencies for the email service (if any are missing)...
pip install -r email-service\requirements.txt

echo.
if not exist email-service\.env (
	echo [WARNING] email-service\.env not found. Copy email-service\.env.example to
	echo           email-service\.env and fill in GOOGLE_SCRIPT_URL, WEBAPP_SECRET,
	echo           and SENDER_APP_PASSWORD before announcement emails will work.
	echo.
)

echo Starting the email service (http://127.0.0.1:5001)...
start "FabLab Email Service" cmd /k "cd email-service && python app.py"

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
