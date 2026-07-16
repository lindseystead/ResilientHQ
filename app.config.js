/**
 * Expo App Configuration
 *
 * Environment variables are injected via EAS build secrets or the local .env file.
 *
 * Note: the `slug`, native `bundleIdentifier`, and Android `package` predate the
 * product rename to "ResilientHQ". Native identifiers are immutable once a build
 * is registered, so they are retained deliberately for continuity.
 */

module.exports = {
  expo: {
    name: 'ResilientHQ',
    slug: 'resilient_portfolio', // legacy EAS project slug — kept stable (see note above)
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'resilienthq',

    ios: {
      bundleIdentifier: 'com.lindsea89.resilientportfolio', // legacy identifier — kept stable

      supportsTablet: true,
      buildNumber: '1',
      infoPlist: {
        NSUserTrackingUsageDescription: 'This app uses analytics to improve your experience.',
        NSFaceIDUsageDescription: 'Use Face ID to securely access your wellness data.',
      },
    },

    android: {
      package: 'com.lindsea89.resilientportfolio',
      versionCode: 1,
      // Sensitive wellness data must not be captured by Android auto-backup.
      allowBackup: false,
      // Only the permissions the app actually uses.
      permissions: [
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
      ],
      // Strip permissions merged from dependency manifests that the app never uses
      // (no camera capture, audio recording, or system overlays).
      blockedPermissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
    },

    web: {
      output: 'single',
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
    },

    plugins: [],

    splash: {
      image: './src/assets/images/app_logo.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },

    experiments: {
      reactCompiler: true,
    },

    extra: {
      eas: {
        projectId: '2f820ba7-c1cc-4787-b255-8bc49a06e948',
      },
      // Firebase configuration (injected from environment variables)
      firebaseapikey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseauthdomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseprojectid: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebasestoragebucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebasemessagingsenderid: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseappid: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      // First-party application API (AI proxy and other backend routes)
      apiurl: process.env.EXPO_PUBLIC_API_URL,
      // Sentry configuration (optional)
      sentrydsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      // Environment
      env: process.env.EXPO_PUBLIC_ENV || 'development',
    },
  },
};
