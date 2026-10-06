# Orderi Native Android fixes

- Android APK uses Capacitor Geolocation only; it no longer falls back to browser GPS inside the APK.
- Added ACCESS_COARSE_LOCATION and ACCESS_FINE_LOCATION to AndroidManifest.xml.
- Live vehicle tracking uses Capacitor native watchPosition on Android.
- A fresh install opens directly on the login screen.
- Removed the built-in demo user from getCurrentUser().
- Browser/PWA GPS remains available only when the app is actually running in a browser.

- On native Android launch, Orderi requests location permission through Android's runtime permission dialog. Android may show this as a system dialog rather than an install-time prompt.
