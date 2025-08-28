@echo off
echo Performing complete Gradle cache cleanup for Java 22 compatibility...

REM Stop all Java and Node processes
echo Stopping Java and Node processes...
taskkill /f /im java.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

REM Remove all Gradle caches
echo Removing Gradle caches...
if exist "C:\Users\%USERNAME%\.gradle\caches" (
    rmdir /s /q "C:\Users\%USERNAME%\.gradle\caches"
    echo Gradle caches removed.
)

if exist "C:\Users\%USERNAME%\.gradle\wrapper" (
    rmdir /s /q "C:\Users\%USERNAME%\.gradle\wrapper"
    echo Gradle wrapper cache removed.
)

REM Remove project-specific caches
echo Removing project caches...
if exist "android\.gradle" (
    rmdir /s /q "android\.gradle"
    echo Project .gradle folder removed.
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo Node modules cache removed.
)

REM Remove React Native Metro cache
if exist "%TEMP%\metro-*" (
    for /d %%i in ("%TEMP%\metro-*") do rmdir /s /q "%%i"
    echo Metro cache removed.
)

echo.
echo Cache cleanup complete!
echo.
echo Next steps:
echo 1. Run: npx react-native start --reset-cache
echo 2. In another terminal, run: npx react-native run-android
echo.
pause