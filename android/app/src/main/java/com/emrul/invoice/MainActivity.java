package com.emrul.invoice;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;
import java.io.IOException;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Offline-only WebView. The bridge is never exposed to network pages. */
public class MainActivity extends Activity {
    private WebView web;
    private final ExecutorService printer = Executors.newSingleThreadExecutor();
    private volatile BluetoothSocket socket;
    private String pendingConnect;
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb");

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(true);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setAllowFileAccessFromFileURLs(false);
        web.getSettings().setAllowUniversalAccessFromFileURLs(false);
        web.getSettings().setBlockNetworkLoads(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return true; }
        });
        web.addJavascriptInterface(new PrinterBridge(), "AndroidPrinter");
        web.setOnApplyWindowInsetsListener((view,insets)->{
            view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    private void reply(String id, String error, String value) {
        runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;
            web.evaluateJavascript("window.nativePrinterResult(" + JSONObject.quote(id) + "," +
                (error == null ? "null" : JSONObject.quote(error)) + "," + JSONObject.quote(value == null ? "" : value) + ")", null);
        });
    }
    private void choosePrinter(String id) {
        BluetoothManager manager = (BluetoothManager)getSystemService(BLUETOOTH_SERVICE);
        BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
        if (adapter == null) { reply(id,"এই ফোনে Bluetooth নেই।",null); return; }
        if (Build.VERSION.SDK_INT >= 31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            pendingConnect=id;
            requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT},1); return;
        }
        if (!adapter.isEnabled()) { reply(id,"ফোনের Settings থেকে Bluetooth চালু করুন।",null); return; }
        ArrayList<BluetoothDevice> devices=new ArrayList<>(adapter.getBondedDevices());
        if (devices.isEmpty()) { reply(id,"প্রথমে ফোনের Settings > Bluetooth থেকে প্রিন্টার পেয়ার করুন।",null); return; }
        String[] names=new String[devices.size()];
        for(int i=0;i<names.length;i++) names[i]=devices.get(i).getName()+"\n"+devices.get(i).getAddress();
        new AlertDialog.Builder(this).setTitle("Bluetooth প্রিন্টার বেছে নিন")
            .setItems(names,(dialog,index)->printer.execute(()->{
                BluetoothSocket next=null;
                try {
                    closeSocket();
                    next=devices.get(index).createRfcommSocketToServiceRecord(SPP);
                    socket=next;
                    final BluetoothSocket connecting=next;
                    // Socket.connect has no public timeout; closing it unblocks a stalled connection.
                    web.postDelayed(()->{if(socket==connecting && !connecting.isConnected())try{connecting.close();}catch(IOException ignored){}},20000);
                    next.connect();
                    reply(id,null,devices.get(index).getName());
                } catch(Exception e) { closeSocket(); reply(id,"সংযোগ হয়নি: "+e.getMessage(),null); }
            }))
            .setNegativeButton("বাতিল",(dialog,which)->reply(id,"বাতিল করা হয়েছে।",null))
            .setOnCancelListener(dialog->reply(id,"বাতিল করা হয়েছে।",null)).show();
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(requestCode,permissions,results);
        String id=pendingConnect; pendingConnect=null;
        if(id==null)return;
        if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED)choosePrinter(id);
        else reply(id,"Bluetooth অনুমতি প্রয়োজন। Settings থেকে অনুমতি দিন।",null);
    }
    private void closeSocket() {
        BluetoothSocket old=socket;socket=null;
        if(old!=null)try{old.close();}catch(IOException ignored){}
    }
    public class PrinterBridge {
        @JavascriptInterface public void connect(String id) { runOnUiThread(()->choosePrinter(id)); }
        @JavascriptInterface public void disconnect(String id) { printer.execute(()->{closeSocket();reply(id,null,"");}); }
        @JavascriptInterface public void write(String id,String encoded) {
            printer.execute(()->{
                try {
                    if(encoded.length()>4096)throw new IOException("ডেটা প্যাকেট অতিরিক্ত বড়");
                    BluetoothSocket current=socket;
                    if(current==null || !current.isConnected())throw new IOException("Bluetooth বিচ্ছিন্ন হয়েছে");
                    byte[] bytes=Base64.decode(encoded,Base64.NO_WRAP);
                    current.getOutputStream().write(bytes);
                    current.getOutputStream().flush();
                    reply(id,null,"");
                }catch(Exception e){closeSocket();reply(id,e.getMessage(),null);}
            });
        }
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("document.getElementById('sHist').classList.contains('off')",value->{
            if("false".equals(value))web.evaluateJavascript("goInv()",null);
            else new AlertDialog.Builder(this).setMessage("অ্যাপ বন্ধ করবেন?").setPositiveButton("হ্যাঁ",(d,w)->finish()).setNegativeButton("না",null).show();
        });
    }
    @Override public void onDestroy() { closeSocket();printer.shutdownNow();web.destroy();super.onDestroy(); }
}
