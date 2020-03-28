categories: Note

tags:

- Android

date:  2016-04-03

toc: false

title: 快速导出安卓手机应用
---

安卓用户经常有分享某个应用给别人的需求。我们都知道安卓上要安装应用，只要直接在手机上打开应用的 APK 文件就行。而主要问题是，怎样把自己的手机应用 APK 文件导出呢？不需要在手机上安装第三方应用，直接在 PC 上通过 USB 调试模式的几条命令就能做到。

<!--more-->

把手机连到启用了 USB 调试模式的 PC 后，首先获得手机上所有应用名的列表。

``` text
adb shell pm list packages
```

然后找到你想要导出的应用名，根据这个名字找到手机上应用 APK 的路径。

``` text
adb shell pm path com.example.appname
```

最后直接根据这个路径把应用导出到 PC 终端的工作目录下。

``` text
adb pull /data/app/path/to/com.example.appname-1.apk
```

这样就获得了应用的 APK 文件。