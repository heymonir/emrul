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

1. APK ইনস্টল করুন; Android প্রয়োজন হলে এই ফাইলের উৎস থেকে install করার অনুমতি চাইবে।
2. Settings → Bluetooth থেকে HOIN প্রিন্টার পেয়ার করুন।
3. Emrul Invoice খুলুন → কানেক্ট করুন → Bluetooth অনুমতি দিন → নিজের প্রিন্টার বেছে নিন।
4. পণ্য যোগ করুন → প্রিন্ট করুন → প্রিভিউ দেখে প্রিন্ট চালু করুন। প্রিন্ট শেষ না হওয়া পর্যন্ত অ্যাপ সামনে রাখুন।

Native Android app **Classic Bluetooth SPP / ESC-POS** প্রিন্টারের জন্য। Android 6+ এবং আধুনিক Android System WebView প্রয়োজন। BLE-only প্রিন্টারের জন্য নিচের Chrome পদ্ধতি ব্যবহার করুন। বাস্তব HOIN হার্ডওয়্যারে এই build এখনও পরীক্ষা করা হয়নি।

GitHub → Actions → **Build Android app** → সফল run → **Emrul-Invoice-Android** artifact থেকে APK নেওয়া যায়। এটি সরাসরি ইনস্টলের **debug APK**, Play Store release নয়। প্রতিটি CI run-এর debug signing key বদলাতে পারে: নিয়মিত আপডেট/বিতরণের আগে স্থায়ী নিজস্ব signing key দিয়ে release build করুন। ভিন্ন key-এর APK পুরোনোটির ওপর ইনস্টল হয় না; uninstall করলে স্থানীয় ইতিহাস মুছে যায়।

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
ANDROID_HOME=/path/to/android-sdk gradle -p android --no-daemon :app:assembleDebug
```

ফলাফল: `android/app/build/outputs/apk/debug/app-debug.apk`। Build-এ root-এর web files স্বয়ংক্রিয়ভাবে APK assets-এ কপি হয়।

যাচাই করা: byte packing / সম্পূর্ণ 100-band BLE transfer / ত্রুটিতে duplicate retry না হওয়া; Chromium-এ 1, 12, 50, 70, 200 ও 1,000-item raster layout, অফলাইন reload, বাংলা ফন্ট ও ইতিহাস, native bridge-এর simulated connect/print/error flow। বাস্তব প্রিন্টার ও ফোনের পরীক্ষা আলাদা করে প্রয়োজন।

প্রিন্টার বন্ধ / কাগজ শেষ / সংযোগ বিচ্ছিন্ন হলে আংশিক রসিদ বের হতে পারে। সমস্যাটি ঠিক করে সচেতনভাবে আবার প্রিন্ট দিন।
