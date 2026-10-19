# Emrul Invoice / ইমরুল ইলেকট্রনিক্স

মূল ফর্ম, দোকানের নাম, ফোন নম্বর, ইনভয়েস তথ্য এবং হিসাব রেখে Bluetooth থার্মাল প্রিন্টিং।

## বেশি আইটেমে প্রিন্ট বন্ধ হওয়ার সংশোধন

আগের পেজ পুরো রসিদকে একটি লম্বা `GS v 0` raster image করে পাঠাত। ছোট প্রিন্টারের একক raster height / receive buffer সীমার কারণে এটি মাঝপথে বন্ধ হতে পারে। এখন:

- 384-dot প্রস্থ রেখে সর্বোচ্চ **64-row raster bands** পাঠানো হয়; শেষে একবার feed/cut।
- BLE-তে 20-byte লেখা, সম্ভব হলে acknowledged writes, এবং প্রতিটি band-এর পরে বিরতি। Android Classic Bluetooth-তে 256-byte লেখা।
- সম্পূর্ণ রসিদের সমান লম্বা canvas লাগে না; সর্বোচ্চ 64-row rendering canvas এবং 1600-row preview লাগে। প্রিভিউ ছোট হলেও সব আইটেম পাঠানো হয়।
- সংযোগে ত্রুটি হলে প্রিন্ট থামে ও বার্তা দেখায়; অনিশ্চিত লেখা আবার পাঠিয়ে রসিদ নষ্ট করা হয় না। একই সময়ে দ্বিতীয় প্রিন্ট শুরু হয় না।
- লম্বা পণ্যের নাম ও ঠিকানা পরের লাইনে যায়; শূন্য মূল্যের পণ্যও বাদ যায় না।

কোনো নির্দিষ্ট আইটেম-সংখ্যার সীমা বসানো হয়নি। ফোনের মেমোরি, প্রিন্টারের ব্যাটারি, কাগজ ও সংযোগের বাস্তব সীমা থাকবে। সরাসরি প্রিন্টার থেকে completion acknowledgement পাওয়া যায় না; “ডেটা পাঠানো শেষ” মানে ফোন ডেটা পাঠিয়েছে।

## Android মোবাইল সফটওয়্যার — Wi-Fi লাগে না

APK-তে পেজ, বাংলা ফন্ট ও সব প্রয়োজনীয় ফাইল অন্তর্ভুক্ত। অ্যাপের Internet permission-ও নেই।

প্রস্তুত signed release APK **v1.1**: [সরাসরি ডাউনলোড](https://github.com/heymonir/emrul/raw/refs/heads/main/downloads/Emrul-Invoice-v1.1.apk)। এই লিংক শেয়ার করুন; `/blob/` লিংক কেবল GitHub-এর file-view পেজ। WhatsApp-এর ভেতরের ব্রাউজারের বদলে Chrome-এ খুলে Downloads / Files থেকে APK খুলুন।

Pages চালু থাকলে মোবাইল ইনস্টল নির্দেশিকা: `https://heymonir.github.io/emrul/install.html`।

1. APK ইনস্টল করুন; Android প্রয়োজন হলে এই ফাইলের উৎস থেকে install করার অনুমতি চাইবে।
2. Settings → Bluetooth থেকে HOIN প্রিন্টার পেয়ার করুন।
3. Emrul Invoice খুলুন → কানেক্ট করুন → Bluetooth অনুমতি দিন → নিজের প্রিন্টার বেছে নিন।
4. পণ্য যোগ করুন → প্রিন্ট করুন → প্রিভিউ দেখে প্রিন্ট চালু করুন। প্রিন্ট শেষ না হওয়া পর্যন্ত অ্যাপ সামনে রাখুন।

Native Android app **Classic Bluetooth SPP / ESC-POS** প্রিন্টারের জন্য। Android 6+ এবং আধুনিক Android System WebView প্রয়োজন। BLE-only প্রিন্টারের জন্য নিচের Chrome পদ্ধতি ব্যবহার করুন। বাস্তব HOIN হার্ডওয়্যারে এই build এখনও পরীক্ষা করা হয়নি।

**Play Protect ব্লক / App not installed:** স্ক্রিনশটে “hasn't seen an app from this developer” থাকলে সেটি অপরিচিত publisher সম্পর্কে Play Protect-এর সিদ্ধান্ত; শুধু download link-এর সমস্যা নয়। আগের বিতরণ করা APK ছিল debug build। বর্তমানটি debuggable=false release build ও ব্যক্তিগত স্থায়ী release key দিয়ে সই করা। এটি Google Play approval বা Play Protect reputation তৈরি করে না; একই সতর্কতা এখনও আসতে পারে। স্ক্যানের অপশন থাকলে Google-কে স্ক্যান করতে দিন। অনুমোদন ছাড়া চালানোর নিশ্চয়তা দেওয়া যায় না। নিয়মিত সহজ বিতরণের জন্য verified developer account দিয়ে Google Play distribution এবং প্রয়োজন হলে [Google Play Protect review](https://developers.google.com/android/play-protect) দরকার।

**আগের ইনস্টল ও তথ্য:** নতুন release signing certificate আগের debug certificate থেকে আলাদা। পুরোনো debug APK ইনস্টল থাকলে সরাসরি আপডেট Android প্রত্যাখ্যান করতে পারে। আগের অ্যাপে ইতিহাস থাকলে backup ছাড়া uninstall / data clear করবেন না; এতে ইতিহাস হারাবে। এখানে নতুন ফাইলে data migration দাবি করা হচ্ছে না। আগে কোনো version ইনস্টল না থাকলে এই certificate-conflict প্রযোজ্য নয়।

**Signing ও ভবিষ্যৎ build:** বর্তমান private release keystore এবং password Git checkout-এর বাইরে `/workspace/emrul-signing/`-এ রাখা আছে; repository/APK-তে private key বা password নেই। এই key নিরাপদে backup করুন এবং ভবিষ্যতের সব release-এ একই key রাখুন। এই workspace হারিয়ে গেলে এবং backup না থাকলে একই signature-এ update তৈরি করা যাবে না। GitHub Actions-এ repository secrets `EMRUL_KEYSTORE_BASE64` (এই PKCS12-এর base64) ও `EMRUL_KEYSTORE_PASSWORD` প্রয়োজন; alias `emrul-release`। গোপন মান chat, commit বা log-এ দেবেন না।

**Build Android app** workflow key configured থাকলে **Emrul-Invoice-Signed-Release** artifact তৈরি করবে। key না থাকলে কেবল **UNSIGNED-build-check-NOT-INSTALLABLE** তৈরি করে স্পষ্ট সতর্কতা দেবে; নতুন random debug key দিয়ে বিতরণ করবে না। বর্তমান signed APK উপরের সরাসরি লিংক থেকেই পাওয়া যায়।

## ওয়েব লিংক ও অফলাইন অ্যাপ

GitHub repository Settings → Pages → Source: **GitHub Actions** একবার নির্বাচন করুন। তারপর Actions → **Publish invoice app** workflow চালান। Deployment সফল হলে সম্ভাব্য ঠিকানা:

`https://heymonir.github.io/emrul/`

এই ঠিকানাটি deployment সফল হওয়ার আগে live ধরে নেবেন না। Android Chrome-এ প্রথমবার ইন্টারনেট দিয়ে খুলুন, ফাইল cache হতে দিন, তারপর **Install app / Add to Home screen** করুন। পরে Wi-Fi / mobile data ছাড়াই খুলে Bluetooth-এ প্রিন্ট করা যাবে। ওয়েবের Bluetooth পদ্ধতি আগের মতো Web Bluetooth BLE; HTTPS, Android Chrome এবং উপযুক্ত writable GATT printer প্রয়োজন।

**iPhone:** হোম স্ক্রিনে ওয়েব অ্যাপ রাখা ও ইনভয়েস লেখা যায়, কিন্তু Safari-তে Web Bluetooth নেই। Android APK iPhone-এ চলে না। এই HOIN-এর মতো সাধারণ Classic Bluetooth SPP প্রিন্টারে সব iPhone থেকে সরাসরি প্রিন্টের নিশ্চয়তা দেওয়া যায় না; printer-supported iOS SDK / MFi / অন্য সমর্থিত ব্যবস্থা ছাড়া সম্ভব নয়।

ইতিহাস আগের `emrul5` localStorage key-তেই থাকে। একই website origin-এ আপডেট করলে পুরোনো ইতিহাস পাওয়া যায়। অন্য domain, browser, অথবা native APK-তে ইতিহাস স্বয়ংক্রিয়ভাবে স্থানান্তর হয় না। ফোনের app/browser data পরিষ্কার বা অ্যাপ uninstall করলে ইতিহাস হারাতে পারে।

## Development ও পরীক্ষা

কোনো npm runtime dependency নেই।

```sh
python3 -m http.server 8000
node --test tests/receipt.test.cjs
```

Browser regression tests (আলাদা টার্মিনালে server চালু রাখুন):

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser.cjs
```

Android build: JDK 21, Android SDK platform/build-tools 35, Gradle 8.11.1:

```sh
# Set EMRUL_KEYSTORE_PATH, EMRUL_KEYSTORE_PASSWORD, EMRUL_KEY_ALIAS securely first.
ANDROID_HOME=/path/to/android-sdk gradle -p android --no-daemon :app:assembleRelease
```

ফলাফল: `android/app/build/outputs/apk/release/app-release.apk` (signing env configured হলে; না হলে unsigned APK)। Build-এ root-এর web files স্বয়ংক্রিয়ভাবে APK assets-এ কপি হয়।

যাচাই করা: byte packing / সম্পূর্ণ 100-band BLE transfer / ত্রুটিতে duplicate retry না হওয়া; Chromium-এ 1, 12, 50, 70, 200 ও 1,000-item raster layout, অফলাইন reload, বাংলা ফন্ট ও ইতিহাস, native bridge-এর simulated connect/print/error flow। বাস্তব প্রিন্টার ও ফোনের পরীক্ষা আলাদা করে প্রয়োজন।

প্রিন্টার বন্ধ / কাগজ শেষ / সংযোগ বিচ্ছিন্ন হলে আংশিক রসিদ বের হতে পারে। সমস্যাটি ঠিক করে সচেতনভাবে আবার প্রিন্ট দিন।

বর্তমান APK: Android build সফল; APK signature যাচাই এবং bundled HTML/JavaScript/বাংলা ফন্টের মিল পরীক্ষা করা হয়েছে। ফোনে ইনস্টল ও বাস্তব Bluetooth প্রিন্ট পরীক্ষা এখানে চালানো হয়নি।

Release v1.1 validation: signed release build, APK signature verification, non-debuggable manifest, version/min SDK, এবং bundled web assets যাচাই করা হয়েছে। Play Protect অনুমোদন বা বাস্তব ফোনে ইনস্টল হওয়ার পরীক্ষা এখানে করা হয়নি।
