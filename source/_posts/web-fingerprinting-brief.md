categories: Note

tags:

- Web
- JS

date: 2018-06-05

toc: true

title: WWDC 中提到的浏览器 Fingerprinting 有多可怕？
---

苹果在 WWDC 2018 发布 macOS Mojave 的时候，介绍了 Safari 现在具备了防御 fingerprinting 技术的能力。这个技术和指纹有什么关系，是用来做什么的，又有多值得普通用户担心呢？让我们从它的来龙去脉说起吧 :-)

<!--more-->


## 何谓 Fingerprinting
Fingerprinting 的本意是指纹采集，那么它在 Web 浏览器的语境下指代的是什么呢？来看看它所要解决的问题吧。

在人类社会里，要想唯一标识一个人，姓名和身份证号足够吗？一般情况下，使用这些基于社会制度的约定并没有问题，但很多时候这是不够的：

* 姓名可以随意更换，还有大量重名。
* 身份证可能被伪造或冒用。
* 极端情况（如一具无名尸体）既没有姓名也没有身份证。

在 Web 中，如果把浏览器类比为人，那么我们就有了非常对应的类比：**User Agent 相当于姓名，而 cookie 就好比身份证**。比如，Chrome 浏览器的 User Agent 里会用形如 `Chrome/66.0.3359.181` 的字段标明自己的名称和版本，而对于重名（很多用户使用同个版本的 Chrome）的情况，我们还可以通过 cookie 来唯一标识用户。是不是很直观呢？但上面的三个问题在 Web 里我们照样逃不掉：

* User Agent 就像姓名，在现代浏览器里基本可以随意更换。
* Cookie 就像身份证。只要知道别人的身份证号（cookie 值），就可以把身份伪装成别人。
* 对于匿名或恶意的访问，往往上面两者获得的信息都是无效的。

这就暴露出了这样假设「每个人都是好人」的约定，其固有的脆弱性。故而我们需要发展技术，来在生物学上唯一标识一个人，以及，**在技术层面上唯一标识一个浏览器**。对于前者，我们有指纹、虹膜、DNA 等识别技术可供使用。类似地，对于后者，我们所用到的技术就是下面所要介绍的 fingerprinting 了。


## Web Fingerprinting 技术速览
某种程度上，fingerprinting 属于特别的奇技淫巧——完全不按照一个东西原本的用途来使用它，而是开发出了新用途：

* 指纹原本是用来防滑的，我们拿来鉴定一个人。
* 虹膜原本是用来调节瞳孔大小的，我们拿来鉴定一个人。
* DNA 原本是用来送给妹子制造后代的，我们拿来鉴定一个人。

在程序员的世界，这样的奇技淫巧就更多了。要想**唯一标识出一个运行在某个 OS 平台上的浏览器**，你能想到多少种方式呢？在这个方面，只要看看开源的 [fingerprintjs2](https://github.com/Valve/fingerprintjs2) 库，你就能感受到程序员们为了追踪用户能想出多么骚的操作。这些操作所涉及的维度主要包括但不限于：

* IP 地址
* JavaScript 行为
* Flash 与 Java 插件
* 字体
* Canvas
* WebGL

下面我们逐一对这些维度做一些简要的介绍。

### IP 地址
最简单的 IP 地址收集并不需要客户端的配合，而主要是服务端的工作。比如，Web 站点服务端可以记录请求的 IP 地址，并据此获得用户的地理位置。如果用户添加了代理服务器，我们可以通过检测 HTTP 头中的 `X-Forwarded-For` 字段来发现这种情形。在 HTTP 应用层和 IP 网络层之间，我们也不难通过在服务端收集 TCP 包头的方式，获取一些传输层的信息。

获取上面这些信息，都只需要后端服务就足够了。那么这类数据的收集，是否就没有前端施展的空间了呢？并不是这样的，让我们看看两种特殊的 fingerprinting 方式：**DNS Leak** 和 **WebRTC Leak**。

只需要在前端做一点微小的工作，我们就能够定位用户所用的 DNS 服务器。具体地说，当你访问 `example.com` 的时候，只要在前端页面中随机生成一系列地址为形如 `abcdefg.example.com` 的图片，就可以让浏览器发起对这些子域名的 DNS 查询。只要 `example.com` 控制了最后形如 `ns1.example.com` 的次级域名服务器，那么查询这些地址时逐级发起的 DNS 查询就能够被服务端记录下来，进而获得用户的 DNS 服务器。这样一来，如果仅仅对 HTTP 请求配置了代理，用户所用的 DNS 地址就可能泄露。**这时如果用户使用了运营商默认就近分配的 DNS 服务器，那么就可能对服务端暴露出其真实所在的位置**。

相比上面只需要插入动态链接的方式，WebRTC 泄露所需要前端的参与就更多了一点。我们知道 WebRTC 可以用于支持视频推流一类的实时应用，而 Firefox 和 Chrome 对 WebRTC 的实现中，需要 STUN 协议来用于让两个处于 NAT 后的主机之间创建 UDP 通信。而 STUN 服务器可以向用户返回本地和公网 IP。这样一来，我们就可以用这种方式，**在 JavaScript 中获取到用户 NAT 后所在内网的 IP 地址**了。

如果想要体验上面所介绍的这几种 fingerprinting 方式所能收集到的数据，请戳[这里](https://browserleaks.com/ip)。

### JavaScript 行为
上面的描述看起来主要是网络层面上的工作，但其实在浏览里的 JavaScript 范畴内，同样有大量的信息可供采集。

要想编程控制 Web 页面的 UI 与行为，我们必须使用 JavaScript 来操作 DOM。而稍有经验的前端同学们都知道，DOM 是挂载了非常多属性而非常沉重的。这也就意味着，DOM 中存储了大量关于浏览器的敏感信息：User-Agent、系统架构、系统语言、本地时间、时区、屏幕分辨率……而对于 HTML5 中新加入的形如电量、加速度计、信息、Timing 等特性的 API，不要说检测它们的具体值是多少，光是检测这些 API 的存在性，信息量就非常大了。而对这些属性的检测难度有多低呢？我们只需要在 JavaScript 中访问 `navigator.xxx` 属性，就可以轻易地获得一个浏览器的「身高、体重、血型、星座……」了。

当然了，现代浏览器为了避免一些敏感的 DOM 属性泄露，会使用一些安全策略来限制一些属性的访问。但对于 fingerprinting 的场景来说，有些安全策略和掩耳盗铃差不多。让我们看看 fingerprintjs2 中的一段源码：

``` js
// https://bugzilla.mozilla.org/show_bug.cgi?id=781447
hasLocalStorage: function () {
  try {
    return !!window.localStorage
  } catch (e) {
    return true // SecurityError when referencing it means it exists
  }
},
```

这个套路在整个库中出现的次数还真不少。藏着掖着不让我访问？这不是此地无银三百两嘛 :-)

对 JavaScript 的 fingerprinting demo，请移步[这里](https://browserleaks.com/javascript)。

### Flash 与 Java 插件
Flash 和 Java 会在不同程度上泄露用户设备的信息。

在浏览器的层面，它们对应的 `navigator.plugins` 字段本身就是一个大坑：列举出所有用户安装的插件及其详细的版本号信息，这本身就大大增加了浏览器的唯一性。例如下面的代码，在老版本的 Firefox 中就能轻易地获取用户浏览器的插件信息：

``` js
for (plugin of navigator.plugins) { console.log(plugin.name); }

"Shockwave Flash"
"QuickTime Plug-in 7.7.3"
"Default Browser Helper"
"Unity Player"
"Google Earth Plug-in"
"Silverlight Plug-In"
"Java Applet Plug-in"
"Adobe Acrobat NPAPI Plug-in, Version 11.0.02"
"WacomTabletPlugin"
```

亡羊补牢地，浏览器厂商增加了对这个属性的 "cloaking" 保护，屏蔽了常见插件以外的插件名称。在现在的 Firefox 里，上面的代码结果应当是这样的：

``` js
for (plugin of navigator.plugins) { console.log(plugin.name); }

"Shockwave Flash"
"QuickTime Plug-in 7.7.3"
"Java Applet Plug-in"
```

但是，这个能力并不能阻止追踪者通过形如 `navigator.plugins["Shockwave Flash"]` 的方式来主动探测插件的安装。因此，这是浏览器插件 API 的第一个信息泄露隐患。

在浏览器层面之外的插件 Runtime 层面，Flash 和 Java Applet 又存在着什么可能被 fingerprinting 的地方呢？

Flash 可以提供 AS3 语言读取系统信息的能力：除了 Flash 版本外，这还包括 OS 版本、硬件厂商、Web 浏览器架构、分辨率等信息，以及许多用于描述硬件和系统多媒体兼容性的属性。至于 Java Applet，它除了可以提供 JVM 的描述、系统版本、用户 locale 信息之外，甚至还有部分文件系统、内存占用、网络状态等信息。这些信息结合在一起，无疑会大大降低追踪的难度。

在这些安全问题的阴影下，Flash 和 Java Applet 都已经淡出现代 Web 了。而上面的 `navigatior.plugins` API，也已经被[废弃](https://developer.mozilla.org/en-US/docs/Archive/Plugins)了。

到目前为止介绍的几种 fingerprinting 方式，所获得的数据多半没有特别高的唯一性（如 UA），或者可能存在较多的抖动（如 IP 地址）。接下来，我们会提到一些真正和「指纹」相近的特性，它们更接近 fingerprinting 技术的精华。

[这里](https://browserleaks.com/flash)是 Flash fingerprinting 的示例。还好，你的浏览器可能已经不支持 Flash 了 :-)

### 字体
看似平凡的字体，其实能引出一个非常庞大的话题。在 fingerprinting 技术中，字体的角色不可或缺。

在我司 [@小米](http://www.laoshu133.com/) 老板的分享里提到了，字体排版的计算牵扯到非常多的参数：baseline / ligatures / kerning……它的复杂程度很高，以至于浏览器需要依赖操作系统的绘图库（如 Linux 上的 Pango、macOS 上的 CoreText 和 Windows 上的 DirectWrite）。不仅是这些库的行为会有自己微妙的区别，浏览器还会通过 CSS 属性继续控制字体渲染的过程。这样一来，我们就可以通过字体的排版结果，获知计算过程了。这个流程看似精妙，但其实非常简单：

1. 在用户不可见的地方，用各种特殊字体渲染 `<span>` 标签。
2. 测量所获得的标签 Bounding Box。

只要这样简单的步骤，我们就能获知两个关键的信息：

* 用户是否安装了某个字体（未安装的字体会 Fallback 到默认字体）。
* 字体渲染方式不同导致的像素级 Bounding Box 排版差异。

要查看基于字体排版所计算出的 fingerprint 差异，请参见[这里](https://browserleaks.com/fonts)。

### Canvas
HTML 中的 Canvas API 为 JavaScript 提供了对渲染内容的像素级控制。我们知道，在 Canvas 中除了对基本的形状、文本、绘制模式的支持外，还能够**将 Canvas 内容导出为图片**（如果你使用过各种朋友圈链接里的「保存到相册」功能，你就用过这个 API）。在图片格式的层面，浏览器使用不同的图片处理引擎、导出参数、压缩级别，这使得最终图片即便每个像素都完全一致，导出文件的哈希值很容易存在细微的区别。而在操作系统的层面，不同的字体渲染方式、抗锯齿配置、子像素渲染方式也会带来微妙的区别。综合下来，我们就能够用 Canvas 得到「指纹」了。

在 fingerprintjs2 里，这个特性的源码实现非常简洁：

``` js
getCanvasFp: function () {
  var result = []
  var canvas = document.createElement('canvas')
  // ...
  // 调用了一大堆 canvas API 之后
  if (canvas.toDataURL) { result.push('canvas fp:' + canvas.toDataURL()) }
},
```

你可能找不到其它「核心实现」里连一个 if-else 都不带的代码段了……但这个手段的效果非常的好。在这个[示例页面](https://browserleaks.com/canvas)中，你可以查看自己浏览器的 Canvas 指纹：

``` text
Your Fingerprint
Signature	✔ 4FAFB231
Uniqueness	99.56% (1130 of 258561 user agents have the same signature)
```

这个手段很容易获得非常高的 Uniqueness。


### WebGL
WebGL 是个比 Canvas 更加底层的 API，你可以用它获得 3D 绘图的强大能力。基于 WebGL 的 fingerprinting，原理与字体、Canvas 并没有什么区别，不外乎以下两点：

* 全面判断浏览器对 WebGL API 的支持（是的，光 API 就有 88 个）。
* 绘制特殊形状，而后计算所渲染得到图片的哈希值。

戳这里是相应的 [demo 页面](https://browserleaks.com/webgl#what-is-webgl-fingerprinting)。可能是 Demo 没有引入字体绘制的原因，这里获得的图片唯一性并不太高，我的 Safari 和 Chrome 居然能够获得完全一致的图片哈希值……


## Real World 表现
上面介绍的一堆手段结合起来，就能获得非常强大的工业级 fingerprinting 库了。如果你对实际效果有疑问，不妨访问 [fingerprintjs2 项目主页](http://valve.github.io/fingerprintjs2/)，尝试这样的操作：

1. 先在你的 Chrome 普通模式下，生成一个 fingerprint。
2. 在 Safari 下，也生成一个 fingerprint。
3. 和同事的同款 Mac 对比一下结果是否有区别。
4. 改掉你的 User Agent 后刷新页面，看看 fingerprint 有没有区别。
5. 进入 Chrome 的匿名模式，重新生成一个 fingerprint，看看是否一致。

不出意外地，在同一个 Chrome 中修改各种常见的配置，fingerprint 是不会改变的。而不论更换成另一台电脑上的相同版本浏览器或是同一台电脑上的不同浏览器，都会带来不同的 fingerprint 结果。这就是 fingerprinting 技术的强大之处了。

根据 Mozilla 的数据<sup>[1](https://wiki.mozilla.org/Fingerprinting)</sup>，在对站点 100 万次的访问里，有 83.6% 的浏览器有着唯一的 fingerprint，对于启用了 Flash 或 Java 的浏览器，这一数据达到了 94.2%。

另一个有意思的数据是，经常被写进隐私政策的 cookie，对 fingerprint 唯一性的贡献非常微弱。数据显示，在上面所介绍的追踪手段中，浏览器插件能够带来 15.4 个比特位的熵增，而启用 cookie 只能带来 0.353 个比特位的熵增。这可是 `2^15` 和 `2^0.3` 的数量级区别啊——并且统计数据还没有计入效果更好的 Canvas 追踪技术。现在可以理解各种垃圾网站上的小广告为了找到你，有多么努力了吧 :-)


## 总结
> 外国用火药制造子弹御敌，中国却用它做爆竹敬神；外国用罗盘针航海，中国却用它看风水；外国用鸦片医病，中国却拿来当饭吃。

目前，各大浏览器厂商都在努力提供更好的隐私保护策略。在本文开头提及的 Safari，就会使用简化的配置项来加大追踪的难度。但 Fingerprinting 技术的背后，值得我们思考的是隐私的价值对技术的滥用。一方面，你会为了更好的隐私保护，而禁用 Canvas、WebGL 和字体渲染吗？恐怕多数人都很难回得去了吧。而另一方面，就像 Google 会用 AI 下围棋，而百度会拿来优化假药广告投放一样，技术本身并没有对错，重要的是使用它的人。

## 参考

* [Fingerprinting - MozillaWiki](https://wiki.mozilla.org/Fingerprinting)
* [DNS Leak Test](https://www.dnsleaktest.com/what-is-the-difference.html)
* [webrtc-ips](https://github.com/diafygi/webrtc-ips)
* [Fingerprinting web users through font metrics](https://www.bamsoftware.com/papers/fontfp.pdf)
* [HTML5 Canvas Fingerprinting](https://browserleaks.com/canvas#how-does-it-work)
* [WebGL Browser Report](https://browserleaks.com/webgl#what-is-webgl-fingerprinting)
