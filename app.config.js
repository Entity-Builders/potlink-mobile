const { createAppConfig } = require('@eb-packages/expo-config');

module.exports = createAppConfig({
  name: 'potlink',
  slug: 'potlink-mobile',
  version: '1.0.10',
  projectId: '537ea184-1aa0-4198-9873-80eb9b3f6bb5',

  // Legacy bundle IDs — kept to avoid App Store Connect mismatch
  bundleIdentifier: {
    ios: 'com.jobrach.potlinkmobile',
    android: 'com.jobrach.potlinkmobile',
  },

  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  ios: {
    buildNumber: '3',
    infoPlist: {
      NSSpeechRecognitionUsageDescription:
        'Allow PotLink to use speech recognition to transcribe your voice input.',
      NSMicrophoneUsageDescription:
        'Allow PotLink to access your microphone for voice input functionality.',
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  },

  web: {
    favicon: './assets/favicon.png',
  },

  plugins: [
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Allow PotLink to access your microphone for voice input functionality.',
        speechRecognitionPermission:
          'Allow PotLink to use speech recognition to transcribe your voice input.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow PotLink to access your photos to add images to your pots.',
        cameraPermission:
          'Allow PotLink to access your camera to take photos of your pots.',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow PotLink to use your location to record where your pots are located and fetch local weather data.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow PotLink to access your camera to scan your plants.',
      },
    ],
  ],
});
