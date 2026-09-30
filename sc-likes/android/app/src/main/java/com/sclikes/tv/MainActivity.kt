package com.sclikes.tv

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

/** Full-screen WebView that shows the hosted "My Likes" site and maps remote media keys onto it. */
class MainActivity : Activity() {
    private lateinit var web: WebView
    private val appUrl = BuildConfig.APP_URL
    private val appHost: String? = android.net.Uri.parse(appUrl).host

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) // no screensaver mid-song
        web = WebView(this)
        web.setBackgroundColor(0xFF101012.toInt())
        setContentView(web)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true                 // theme choice is saved in localStorage
            mediaPlaybackRequiresUserGesture = false // let SoundCloud's player start without a tap
            javaScriptCanOpenWindowsAutomatically = false
            userAgentString = userAgentString + " SCLikesTV" // tells the web app to switch to TV mode
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true) // SoundCloud player iframe
        web.webChromeClient = WebChromeClient()
        web.webViewClient = object : WebViewClient() {
            // Stay inside the app for our own site and SoundCloud's player; ignore everything else.
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val host = req.url.host ?: return true
                return !(host == appHost || host.endsWith("soundcloud.com"))
            }
            override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) showMessage(
                    "Can't reach the server",
                    if (appUrl.isEmpty()) "This APK was built without a site URL." else "Check the TV's internet connection, then retry."
                )
            }
        }
        if (appUrl.isEmpty()) showMessage("No site URL", "This APK was built without a site URL. Rebuild it and enter your https:// address.")
        else web.loadUrl(appUrl)
    }

    private fun showMessage(title: String, body: String) {
        val retry = if (appUrl.isNotEmpty()) "<button autofocus onclick=\"location.href='$appUrl'\">Retry</button>" else ""
        web.loadDataWithBaseURL(null,
            "<body style='background:#101012;color:#f4f4f5;font:28px sans-serif;text-align:center;padding-top:20vh'>" +
            "<h1>$title</h1><p style='color:#a1a1aa'>$body</p>$retry" +
            "<style>button{font-size:28px;padding:14px 40px;border-radius:99px;border:0;background:#ff5500;color:#fff}button:focus{outline:4px solid #fff}</style></body>",
            "text/html", "utf-8", null)
    }

    // Remote media keys don't reach web pages as key events, so forward them explicitly.
    override fun dispatchKeyEvent(e: KeyEvent): Boolean {
        if (e.action == KeyEvent.ACTION_DOWN) {
            val action = when (e.keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE -> "toggle"
                KeyEvent.KEYCODE_MEDIA_NEXT, KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> "next"
                KeyEvent.KEYCODE_MEDIA_PREVIOUS, KeyEvent.KEYCODE_MEDIA_REWIND -> "previous"
                else -> null
            }
            if (action != null) {
                web.evaluateJavascript("window.__tv&&window.__tv('$action')", null)
                return true
            }
        }
        return super.dispatchKeyEvent(e)
    }

    // Back first closes the Appearance panel if it's open; otherwise it leaves the app.
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript("window.__tv?window.__tv('back'):false") { handled ->
            if (handled != "true") finish()
        }
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }
}
