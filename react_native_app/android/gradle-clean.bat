@echo off
echo Cleaning Gradle cache and fixing Java compatibility...

REM Stop Gradle daemon
gradlew --stop

REM Clean project
gradlew clean

REM Remove Gradle cache for this project
if exist "%USERPROFILE%\.gradle\caches\8.5\scripts" (
    echo Removing problematic Gradle cache...
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.5\scripts"
)

echo Gradle clean complete. You can now run: npx react-native run-android