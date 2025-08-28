# React Native CLI Installation Guide for Windows

## Method 1: Install React Native CLI Globally (Recommended)

### Step 1: Open PowerShell as Administrator
- Press `Windows + X`
- Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

### Step 2: Install React Native CLI
```powershell
npm install -g @react-native-community/cli
```

### Step 3: Verify Installation
```powershell
npx react-native --version
```

## Method 2: Alternative Global Installation
If Method 1 doesn't work, try:
```powershell
npm install -g react-native-cli
```

## Method 3: Use without Global Installation (Current Method)
You're already using this method with `npx react-native run-android`
This automatically downloads and uses the CLI when needed.

## Troubleshooting Windows Installation

### Fix npm Permissions (if needed)
```powershell
# Set npm prefix to avoid permission issues
npm config set prefix %APPDATA%\npm
```

### Update npm (if old version)
```powershell
npm install -g npm@latest
```

### Clear npm Cache (if installation fails)
```powershell
npm cache clean --force
```

## Android Development Requirements

### Required Tools:
1. **Node.js** (v16 or higher) ✅ You have this
2. **Java JDK** (17 or 11) ✅ You have Java 17
3. **Android Studio** with SDK
4. **Android SDK Platform-Tools**
5. **Android Build-Tools**

### Environment Variables to Set:
```cmd
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
Path=%Path%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

## Quick Command Reference

### Start Metro bundler:
```bash
npx react-native start
```

### Build and run on Android:
```bash
npx react-native run-android
```

### Clean build cache:
```bash
npx react-native start --reset-cache
```

### Check React Native environment:
```bash
npx react-native doctor
```

## Current Build Fix Applied

I've also fixed the JAR creation issue by adding these settings to gradle.properties:
- Increased memory allocation (-Xmx2048m)
- Disabled parallel builds to prevent conflicts
- Enabled G1 garbage collector for better performance

Try running the build again now!