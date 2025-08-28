@echo off
echo Fixing JAR creation issue and cleaning build cache...

REM Stop all processes
echo Stopping processes...
taskkill /f /im java.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

REM Clean specific problematic cache
echo Cleaning problematic JAR cache...
if exist "C:\Users\%USERNAME%\.gradle\caches\jars-9" (
    rmdir /s /q "C:\Users\%USERNAME%\.gradle\caches\jars-9"
    echo JAR cache cleaned.
)

REM Clean modules cache
echo Cleaning modules cache...
if exist "C:\Users\%USERNAME%\.gradle\caches\modules-2" (
    rmdir /s /q "C:\Users\%USERNAME%\.gradle\caches\modules-2"
    echo Modules cache cleaned.
)

REM Clean build cache
echo Cleaning build cache...
if exist "android\build" (
    rmdir /s /q "android\build"
    echo Android build cache cleaned.
)

if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo App build cache cleaned.
)

echo.
echo JAR creation fix applied!
echo.
echo Next steps:
echo 1. Run: npx react-native start --reset-cache
echo 2. In another terminal: npx react-native run-android
echo.
pause