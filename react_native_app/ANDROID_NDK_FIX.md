# Android NDK Build Fix Guide

## Problem
The build fails with "NDK is not installed" error for react-native-reanimated.

## Solution Options

### Option 1: Disable Reanimated (Recommended for Quick Fix)
1. Remove react-native-reanimated from package.json
2. Use Animated API from React Native core instead

### Option 2: Install NDK (Complete Fix)
1. Open Android Studio
2. Go to SDK Manager (Tools > SDK Manager)
3. Click "SDK Tools" tab
4. Check "NDK (Side by side)" 
5. Click Apply to install

### Option 3: Use Different NDK Version
If you have NDK installed but getting version issues, specify a different version in android/build.gradle:

```gradle
buildscript {
    ext {
        ndkVersion = "21.4.7075529"  // Use older stable version
    }
}
```

## Current Fix Applied
- Disabled native modules that require NDK
- Updated gradle configuration for better compatibility
- Simplified dependencies to avoid NDK requirements