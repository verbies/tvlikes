# My Likes on Google TV / Android TV

The TV app is a thin full-screen shell (`android/`) that shows your hosted site. Your SoundCloud
Client secret stays on the server (Vercel) and is **never** put inside the APK.

## 1. Deploy the site (once)
1. Push this folder to a new GitHub repo (`credentials.txt` is git-ignored, so your keys are not uploaded).
2. Import the repo on vercel.com. In Settings → Environment Variables add `SOUNDCLOUD_CLIENT_ID`,
   `SOUNDCLOUD_CLIENT_SECRET` and (optional) `SOUNDCLOUD_PROFILE_URL`, then redeploy.
3. Open `https://<your-project>.vercel.app` in a browser and confirm your likes load.
   If you get a Vercel login page, turn off Deployment Protection for the project.

## 2. Build the APK (no Android Studio needed)
GitHub repo → **Actions** → **Build Android TV APK** → **Run workflow** → enter your `https://…vercel.app` URL.
When it finishes (~3 min) download the `my-likes-tv-apk` artifact and unzip it to get `app-debug.apk`.

(Android Studio also works: open the `android/` folder, set `appUrl` in `~/.gradle/gradle.properties`
or run `gradle assembleDebug -PappUrl=https://…`.)

## 3. Install on the TV
On the TV: Settings → System → About → tap "Android TV OS build" 7 times, then
Settings → System → Developer options → enable **USB debugging / Wireless debugging**.
Then from a computer on the same network:

    adb connect <TV-IP>:5555
    adb install app-debug.apk

No computer? Put the APK on a USB stick or your cloud drive, install "Downloads by TCL" or "File Commander",
open the APK on the TV and allow "Install unknown apps". "My Likes" appears in your app row.

## Remote controls
- D-pad: move between buttons and tracks; OK: select. Back: close Appearance, then exit.
- Play/Pause, Next, Previous (or Fast-forward/Rewind) keys control the music.
- Music keeps playing while the app is open; the screen saver is held off while it is.
