"""Verify the distributable APK, not just a successful Gradle exit.
Usage: ANDROID_HOME=/path/to/sdk python3 tests/verify-android.py
"""
import os
from pathlib import Path
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
sdk = Path(os.environ['ANDROID_HOME']) / 'build-tools' / '35.0.0'
apk = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'downloads/Emrul-Invoice.apk'
subprocess.run([str(sdk / 'apksigner'), 'verify', '--verbose', str(apk)], check=True)
manifest = subprocess.check_output([str(sdk / 'aapt2'), 'dump', 'badging', str(apk)], text=True)
assert 'application-debuggable' not in manifest, 'Do not distribute a debug APK'
assert "name='com.emrul.invoice'" in manifest
assert "versionCode='2'" in manifest
assert "minSdkVersion:'23'" in manifest
assert 'android.permission.INTERNET' not in manifest
cert = subprocess.check_output([str(sdk / 'apksigner'), 'verify', '--print-certs', str(apk)], text=True)
assert 'CN=Emrul Invoice' in cert and 'Android Debug' not in cert
with zipfile.ZipFile(apk) as archive:
    for name in ('index.html', 'receipt.js', 'sw.js', 'manifest.json', 'fonts/fonts.css'):
        assert archive.read('assets/' + name) == (root / name).read_bytes(), f'Stale APK asset: {name}'
print('Release identity, signature, version, permissions and bundled assets verified')
