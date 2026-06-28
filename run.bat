@echo off

echo Installing dependencies (if any are missing)...
call npm install

echo.
echo Starting the development server...
call npm run dev
