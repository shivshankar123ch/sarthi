# Android app setup

The Android app uses Capacitor to package the Vite frontend.

## Requirements

- Node.js 22 or newer
- Android Studio with Android SDK installed
- JDK 21

## Build a debug APK

Set `VITE_BASE_URL` in the frontend `.env` to the backend URL reachable from
your phone. For a local backend, use the computer's LAN IP and backend port
(for example, `http://192.168.1.10:4000`), and keep the phone and computer on
the same Wi-Fi network. `localhost` refers to the phone itself, not the
computer.

From this directory, run:

```sh
npm run android:apk
```

The debug APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

The first build downloads the Gradle distribution and Android dependencies.
To open the native Android project in Android Studio, run `npm run android:open`.
A signed release APK requires a release signing key configured in Android Studio.

For an Android emulator, use `http://10.0.2.2:4000` instead of the computer's
LAN IP when the backend runs on the same computer.
