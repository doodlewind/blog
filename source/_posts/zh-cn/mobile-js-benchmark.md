categories: Note

tags:

- Web
- JS

date: 2017-11-16

toc: true

title: 移动端逆袭！iPad 的 JavaScript 性能已超越 rMBP
---

说到移动端，很多同学的印象可能还停留在【兼容费劲、费性能动画、不好调试】的阶段。但苹果每年发布会的【迄今最强】难道都是在挤牙膏吗？笔者做了个前端领域内的性能对比评测，结果非常有趣。

<!--more-->

## 思路
在前端范畴内，对【性能】的追求一般出现在资源加载速度、减少重复渲染等层面，而对于 JavaScript 语言本身的执行速度关注相对较少。但 JavaScript 的执行速度，又和设备的性能乃至用户体验存在着很强的关联性：

1. JS 单线程异步非阻塞的模式，天生考验单核性能。
2. JS 运行时天生跨平台，用于评测的算法代码在所有平台上都是同一份，不像 GeekBench 可能会在不同平台进行不同的编译优化。
3. 在每个平台，浏览器都是重度优化的杀手级应用，能充分利用设备硬件性能。
4. JS 的执行速度直接关系到 Web 浏览体验的流畅度。不仅是桌面端的 Electron，许多移动端原生应用也已经重度依赖 WebView、Hybrid 或 Bridge 方案。

所以，下面的基础思路就是：在不同的设备上运行同样的 JavaScript 评测代码，根据执行速度来对它们的性能做出评价。

## 测试方式
参与的设备总共三个（贫穷限制了我的想象）：

* 13 寸 Retina MacBook Pro 2015，i5 + 8G RAM
* iPad Pro 10.5 寸，A10X + 4G RAM
* iPhone SE，A9 + 2G RAM

采用的测试代码一共三套：

* Webkit 团队出品的 [SunSpider](https://webkit.org/perf/sunspider/sunspider.html) 测试
* Chromium 团队出品的 [Octane 2.0](http://chromium.github.io/octane/) 测试
* JSPerf 的 [DOM 操作](jsperf.com/javascript-dom-benchmark) 测试

浏览器平台一共三个：

* macOS 10.13 + Safari 11.0.2
* macOS 10.13 + Chrome 62
* iOS 11.1 + mobile Safari（iPhone 和 iPad 版本相同）

## 测试结果

### SunSpider 果兔兔
安兔兔跑分广受诟病的一点，在于它接收了某些手机厂商的投资而难以保证公正性。在前端领域这是不存在的，因为所有的主流性能测试都是浏览器厂商而不是手机厂商维护的…SunSpider 就是 Webkit 出品的老牌测试，包含加解密、数据结构、位运算、正则等常见操作。鉴于 Webkit 和苹果的关系，把它叫做果兔兔也不为过。测试结果截图如下：

![chart-sunspider](/images/mobile-js-benchmark-chart.001.jpeg)

第一名是 iPad Pro，第二名是 rMBP，最后是 iPhone SE。看起来 Chrome 在这项评测中性能意外的低，这是为什么呢？由于 SunSpider 本身的 micro benchmark 方式被 Google 团队认为已经不匹配 JS 引擎的优化机制，因而他们放弃了 SunSpider，转而开发出了自己的 Octane。

### Octane 谷兔兔
Chromium 团队维护的 Octane 也算是谷歌亲儿子了。它除了数学运算外，还加入了不少编译、CPU 模拟、GC 性能方面的指标。我们看看这个评测的结果：

![chart-octane](/images/mobile-js-benchmark-chart.002.jpeg)

iPad Pro 继续领跑，rMBP Chrome 的分数明显靠谱了很多，但离桌面版 Safari 还有距离。iPhone SE 依旧路人…

值得一提的是，在 TypeScript 编译的单项测试中，iPad Pro 的成绩达到了 rMBP 的近两倍！这不就是库克反复强调的生产力工具吗！想象一下拿 Mac 构建前端项目，速度还赶不上平板的感觉吧😀

### JSPerf 脏兔兔
上面的几个评测指标有个共同的问题，就是只关注 JavaScript 语言本身的执行速度，和 DOM 渲染这种比较【脏】但是又和用户体验息息相关的内容相比，区分度可能还不够强。因此我们在 JSPerf 上做了一个简单的 DOM 操作测试：

![chart-dom](/images/mobile-js-benchmark-chart.003.jpeg)

看起来谷歌又一次负优化了……不过 `iPad Pro > rMBP > iPhone SE` 的顺序仍然准确。

## 总结
根据上面的测试结果，我们能够得出的结论是：**iPad Pro 的 Mobile Safari，其 JavaScript 性能确实比 2015 款 rMBP 的 Chrome 和 Safari 要强。**请注意，这个结论是有严格的限制条件的。如果谁把这个结论粗暴地简化成【iPad 吊打 Mac】然后批判一番，那么他不是蠢就是坏。

这个结果也能够反驳不少观点。比如，很多人所认为的【GeekBench 里 iOS 跑分超越 Mac 是纯粹扯淡】的观点可能需要重新考量了。另外【架构不同不具可比性】的说法更是站不住脚，毕竟就算架构不同，跑的 JavaScript 代码、打开的网页可都是完全相同的啊。如果我们打开同样的页面，iPad 跑的比 Mac 快，这就和架构无关，是实打实可衡量的体验差距了。

如果你坚持【跑分不代表体验】，那么不妨思考下：一个人的高考成绩和牛逼程度有没有相关性呢？这个话题太大，在这里不做展开。就事论事地说，跑分和高考作为一种将高维体验拍平为单维度分数的评价体系，当然会存在客观性的问题。不过，就像高考改革是为了更好地筛选出人才一样，[浏览器厂商也在改进跑分的机制](https://v8project.blogspot.com/2017/04/retiring-octane.html)。

当然，本文的测试显然是存在不少问题，作者能想到的就包括：

* SunSpider 和 Octane 已经逐渐被浏览器厂商认为过于【应试教育】，和真实世界存在差异，因此离真实体验还有差距（Chromium 团队正在推进更能衡量日常体验的方案，是不是和【素质教育】有点像呢）。
* 没有安卓和 Windows，更没有 iPhone X（再说一遍，贫穷限制了我的想象）。
* 没有各种重复取均值，结果未必准确。

不过，从一些特殊维度出发所做的评测，其实是非常有趣的。这篇文章本身也多少受了笔者前文 [基于文本相似度算法，分析 Vue 是抄出来的框架吗？](https://juejin.im/post/5985abf9f265da3e345f4f97)的启发。这样的文章并不一定能保证绝对的准确与公正，但从新的视角来看问题，所得到的结论多半会很有趣哦。

下面给出文中所涉及的内容参考：

### 评测数据
这是绘制文中图表数据所对应的截图：

#### SunSpider
* [sunspider-ipp](/images/sunspider-ipp.PNG)
* [sunspider-rmbp-safari](/images/sunspider-rmbp-safari.png)
* [sunspider-rmbp-chrome](/images/sunspider-rmbp-chrome.png)
* [sunspider-se](/images/sunspider-se.PNG)

#### Octane
* [octane-ipp](/images/octane-ipp.PNG)
* [octane-rmbp-chrome](/images/octane-chrome.png)
* [octane-rmbp-safari](/images/octane-safari.png)
* [octane-se](/images/octane-se.PNG)

#### JSPerf
* [jsperf-ipp](/images/dom-ipp.png)
* [jsperf-rmbp-chrome](/images/dom-chrome.png)
* [jsperf-rmbp-safari](/images/dom-safari.png)
* [jsperf-se](/images/dom-se.png)

### 测试地址
这些评测代码只要点开链接就能直接跑哦，欢迎壕们在评论里晒出自己牛逼设备的分数！

* [SunSpider](https://webkit.org/perf/sunspider/sunspider.html)
* [Octane 2.0](http://chromium.github.io/octane/)
* [JSPerf](jsperf.com/javascript-dom-benchmark)

最后，看了这些果兔兔、谷兔兔和脏兔兔的评测，有没有注意到作者的头像也是兔兔呢，[欢迎关注啊](https://github.com/doodlewind)（拖走）
