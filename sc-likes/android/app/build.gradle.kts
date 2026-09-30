plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.sclikes.tv"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.sclikes.tv"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        // The site the TV app displays. Pass with: gradle assembleDebug -PappUrl=https://your-site.vercel.app
        val url = (project.findProperty("appUrl") as String?)?.trim() ?: ""
        buildConfigField("String", "APP_URL", "\"$url\"")
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
