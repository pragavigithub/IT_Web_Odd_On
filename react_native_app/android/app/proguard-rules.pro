# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# SQLite
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }

# Vision Camera
-keep class com.mrousavy.camera.** { *; }

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }

# Paper
-keep class com.callstack.react.paper.** { *; }