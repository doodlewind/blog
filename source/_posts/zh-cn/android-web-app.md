categories: Note

tags:

- Web
- Android

date:  2016-06-09

toc: true

title: 安卓 Web App 打包实践
---

基于 WebView 的方式，可以在 Android 原生应用中显示网页，并可以利用 JavaScript 与用户交互，利用 XHR 和服务器端通信。WebView 所支持显示的网页可以不仅仅是一个远程的 URL，更可以是打包入 APK 文件的本地 HTML 文件。<!--more-->下面是一个打包 Web App 到 Android 上的基础示例，其实就是为一个 Web 应用加了一层「壳」而已。

Web 应用可以简单地分为前端和后端，这里先将前端部分的 HTML / JS / CSS 文件打包进一个原生 App 里。

## 前端部分
在 Android Studio 中新建一个项目，选择 Blank Activity 作为项目类型。项目初始化完成后，直接将 MainActivity.java 的代码替换如下即可。注意更改首行的 Package Name 和 `mWebView.loadUrl()` 方法传入的 URL 地址。打包所需要的本地网页文件可以这样添加：在左侧导航栏上右击 app 目录，依次选择 New -> Folder -> Assests Folder 并确认，添加应用的 Assests 目录后将网页文件复制进去即可。该目录中的 `index.html` 对应 `file:///android_asset/index.html` 这一 URL 地址。

``` java
package us.ewind.ustctennis;
import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.WebView;
import android.webkit.WebViewClient;
public class MainActivity extends Activity {
    private WebView mWebView;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().requestFeature(Window.FEATURE_NO_TITLE);
        mWebView = new WebView(this);
        mWebView.getSettings().setJavaScriptEnabled(true);
        mWebView.getSettings().setAllowFileAccess(true);
        mWebView.getSettings().setAllowContentAccess(true);
        mWebView.getSettings().setAllowFileAccessFromFileURLs(true);
        mWebView.getSettings().setAllowUniversalAccessFromFileURLs(true);
        mWebView.loadUrl("file:///android_asset/index.html");
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        this.setContentView(mWebView);
    }
    @Override
    public boolean onKeyDown(final int keyCode, final KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
```

Web App 的其它部分大体上不需要改动，只需将向后端发送查询的 GET 和 POST 等请求部分的 URL 地址从相对链接改写为绝对链接即可。对 Angular 一类的框架，这些包装好的数据接口可以通过直接修改 Service 一类的服务来变更，并没有太大的问题。如果需要较为频繁地更新迭代新版本，不妨将主要的业务逻辑脚本放置在服务端，仅将 JS 框架脚本打包在本地 APK 文件中。

完成 Java 代码和 JS 代码的变动后，直接进行 Build 和 Run 即可。但这时数据服务多半还无法正常使用，需要对后端服务器进行一些小改动。


## 后端部分
由于打包后的 Web App 进行 AJAX 请求时，所在的域已经不同于服务端，因此即便修改了请求地址，也会被浏览器的安全策略所阻止。传统的解决方式是通过嵌入服务端的 `<script>` 标签，通过嵌入的脚本来获取数据。这种被称为 JSONP 的做法虽然可行，但需要修改客户端的 JS 代码。实际上，根据 CORS 跨域资源共享协议，可以通过简单地在服务端响应的 HTTP 报头添加 `"Access-Control-Allow-Origin: *` 字段的方式，解决跨域请求问题。

打包 Web App 对 Web 前后端原有代码的修改都不大，但可以大大提速 Web App 的加载，并节约网络流量。除了直接修改 MainActivity 以外，还可以视需求将 App 的其它 Activity 替换为 WebView，相当灵活。
