categories: Note

tags:

- Android

date:  2016-06-30

toc: false

title: 免 Root 禁用安卓预装 App
---

国货安卓机虽然物美价廉，但是某些预装的 App 不光没用，还默认放在 `/system` 分区里不能删除。好在强大的 ADB 提供了一条命令，可以在无需 Root 的条件下将它们隐藏起来。

<!--more-->

打开 USB 调试模式后，首先在 PC 端执行下面这条命令。

``` text
adb shell pm list packages
```

然后就可以看到这台手机上所有 App 的包名了，比如下面这些：

``` text
package:com.mediatek.gba
package:com.mediatek.ppl
package:com.github.shadowsocks
package:com.gd.mobicore.pa
package:org.simalliance.openmobileapi.uicc2terminal
package:com.android.providers.telephony
package:com.meizu.documentsui
......
```

如果 App 太多，也可以 `grep` 一下精简结果。找到要禁用的 App 包名后，执行下面这条命令即可。

```
adb shell pm hide "xxx.xxx"
```

执行后，被禁用的 App 不会出现在已安装列表中，也不能启动或推送消息，但其存储空间不会被移除。这样实际上已经达到了清理的目的了。
