# Android WMS Mobile App - Development Guide

## 🚀 How to Run, Install & Debug the Android Application

### Prerequisites
- **Android Studio**: Latest version (Hedgehog 2023.1.1 or newer)
- **Android SDK**: API Level 34 (Android 14)
- **Java Development Kit**: JDK 8 or higher
- **Android Device**: Physical device with USB debugging enabled OR Android emulator

### 1. Setup Development Environment

#### Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install with default settings including Android SDK
3. Open Android Studio and complete the setup wizard

#### Configure Android SDK
1. Open Android Studio → SDK Manager
2. Install these components:
   - **Android 14 (API 34)** - Target SDK
   - **Android SDK Build-Tools 34.0.0**
   - **Google Play Services**
   - **Android SDK Platform-Tools**

### 2. Import and Setup Project

#### Open Project in Android Studio
```bash
# Clone or copy the android_app folder to your development machine
# Open Android Studio → File → Open → Select android_app folder
```

#### Project Structure Overview
```
android_app/
├── app/                                    # Main application module
│   ├── src/main/java/com/wmsmobileapp/    # Java source code
│   │   ├── MainActivity.java              # Main navigation activity
│   │   ├── adapters/                      # RecyclerView adapters
│   │   └── models/                        # Data models
│   ├── src/main/res/                      # Resources (layouts, strings, etc.)
│   └── build.gradle                       # App-level dependencies
├── build.gradle                           # Project-level build configuration
├── settings.gradle                        # Project settings
└── gradle.properties                      # Gradle configuration
```

### 3. Build and Run the Application

#### Method 1: Using Physical Android Device (Recommended)

**Enable Developer Options:**
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings → Developer Options**
4. Enable **USB Debugging**
5. Connect device via USB cable

**Build and Install:**
```bash
# In Android Studio:
# 1. Click the green "Run" button (▶️) or press Shift+F10
# 2. Select your connected device
# 3. App will build and install automatically
```

#### Method 2: Using Android Emulator

**Create Virtual Device:**
1. Android Studio → AVD Manager
2. Create Virtual Device → Phone → Pixel 6
3. Select **API 34** system image
4. Configure AVD and click Finish

**Run on Emulator:**
```bash
# In Android Studio:
# 1. Start the emulator from AVD Manager
# 2. Click "Run" button and select the emulator
# 3. App will build and install automatically
```

### 4. Development and Debugging

#### Debug Features in Android Studio

**Logcat (Real-time Logging):**
```java
// Add logging to your Java code:
import android.util.Log;

Log.d("WMS_TAG", "Debug message");
Log.i("WMS_TAG", "Info message");
Log.e("WMS_TAG", "Error message");
```

**Breakpoint Debugging:**
1. Click left margin next to line numbers to set breakpoints
2. Run app in debug mode (🐛 button)
3. App will pause at breakpoints for inspection

**Layout Inspector:**
- View → Tool Windows → Layout Inspector
- Inspect UI elements in real-time

**Network Inspector:**
- Monitor API calls to Flask backend
- View → Tool Windows → App Inspection → Network Inspector

#### Common Development Tasks

**Sync Project with Gradle Files:**
```bash
# When you modify build.gradle files:
# File → Sync Project with Gradle Files
```

**Clean and Rebuild:**
```bash
# If build issues occur:
# Build → Clean Project
# Build → Rebuild Project
```

**Generate Signed APK:**
```bash
# For production deployment:
# Build → Generate Signed Bundle / APK
# Select APK → Create new keystore → Build release APK
```

### 5. Backend Integration Setup

#### Configure API Endpoints
```java
// In app/src/main/java/com/wmsmobileapp/api/ApiClient.java
public class ApiClient {
    private static final String BASE_URL = "https://your-replit-app.replit.app/";
    // Replace with your actual Flask backend URL
}
```

#### Test Backend Connection
```java
// Add network security config for development
// In app/src/main/res/xml/network_security_config.xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">your-replit-app.replit.app</domain>
    </domain-config>
</network-security-config>
```

### 6. Key Dependencies & Features

#### Barcode Scanning (ZXing)
```java
// Implement barcode scanning functionality
implementation 'com.journeyapps:zxing-android-embedded:4.3.0'
```

#### Network Requests (Retrofit)
```java
// API communication with Flask backend
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
```

#### Local Database (Room)
```java
// Offline data storage
implementation 'androidx.room:room-runtime:2.5.0'
annotationProcessor 'androidx.room:room-compiler:2.5.0'
```

### 7. Testing and Quality Assurance

#### Unit Testing
```bash
# Run unit tests:
# Right-click on test folder → Run Tests
# Or use: ./gradlew test
```

#### UI Testing (Espresso)
```bash
# Run instrumented tests:
# Right-click on androidTest folder → Run Tests
# Or use: ./gradlew connectedAndroidTest
```

#### Code Analysis
```bash
# Static code analysis:
# Analyze → Inspect Code
# Analyze → Run Inspection by Name
```

### 8. Performance Optimization

#### Memory Profiling
- View → Tool Windows → Profiler
- Monitor memory usage, CPU performance
- Identify memory leaks and performance bottlenecks

#### Battery Optimization
- Monitor background processes
- Optimize API call frequency
- Use efficient image loading with Glide

### 9. Distribution and Deployment

#### Generate Production APK
```bash
# 1. Build → Generate Signed Bundle / APK
# 2. Create keystore for app signing
# 3. Configure ProGuard for code obfuscation
# 4. Generate release APK for distribution
```

#### Google Play Store Deployment
1. Create Google Play Console account
2. Upload signed APK or App Bundle
3. Configure store listing and metadata
4. Submit for review and publication

### 10. Troubleshooting Common Issues

#### Build Errors
```bash
# Gradle sync issues:
File → Invalidate Caches and Restart

# Dependency conflicts:
./gradlew app:dependencies

# Clean and rebuild:
Build → Clean Project → Rebuild Project
```

#### Device Connection Issues
```bash
# ADB debugging:
adb devices                    # List connected devices
adb kill-server               # Restart ADB
adb start-server
```

#### Runtime Errors
```bash
# Check Logcat for error messages
# Use Try-Catch blocks for error handling
# Implement proper null checks
```

## 🏆 Benefits of Native Android Development

### Performance Advantages
- **Direct Hardware Access**: Camera, sensors, storage
- **Memory Efficiency**: Native memory management
- **Smooth UI**: 60fps animations and scrolling
- **Background Processing**: Android services and WorkManager

### Development Benefits
- **Full IDE Support**: Complete debugging and profiling tools
- **Standard Build System**: Gradle with dependency management
- **Rich Testing Framework**: Unit, integration, and UI testing
- **Google Play Integration**: Direct app store deployment

### User Experience
- **Material Design**: Consistent Android look and feel
- **Platform Integration**: Notifications, intents, sharing
- **Offline Capability**: Room database for data persistence
- **Professional Performance**: Enterprise-grade reliability

Your native Android WMS application is now ready for professional warehouse management operations!