categories: Note

tags:

- Web
- JS

date: 2020-01-14

toc: false

title: 一个白学家眼里的 WebAssembly
---

<!-- ![](https://ewind.us/images/wasm-wa2/wa2-js-wa.jpg) -->

在知乎「[如何看待 WebAssembly 技术](https://www.zhihu.com/question/362649730)」的问题里，可以看出大家普遍对浏览器、WASM 和 JS 之间的三角关系有不少误解。因此这里作为一个开 (bai) 发 (xue) 者 (jia)，我就来尝试纠正些常见的问题吧。

<!-- more -->

> 全文观点摘要：**WASM 运行时性能在原理上就是受限的，甚至 JS 都可以和编译到 WASM 的 Rust 一较高下。加上工具链的高度侵入性，它并不太适合作为前端背景同学 all in 的方向，但对于原生应用的跨平台分发则非常有潜力**。

## WASM == 汇编级性能？
这显然不对，WASM 里的 Assembly 并不意味着真正的汇编码，而只是种新约定的字节码，也是需要**解释器**运行的。这种解释器肯定比 JS 解释器快得多，但自然也达不到真正的原生机器码水平。一个可供参考的数据指标，是 JS 上了 JIT 后整体性能大致是机器码 1/20 的水平，而 WASM 则可以跑到机器码 1/3 的量级（视场景不同很不好说，仅供参考）。**相当于即便你写的是 C++ 和 Rust 级的语言，得到的其实也只是 Java 和 C# 级的性能**。这也可以解释为什么 WASM 并不能在所有应用场景都显示出压倒性的性能优势：**只要你懂得如何让 JS 引擎走在 Happy Path 上，那么在浏览器里，JS 就敢和 Rust 五五开**。

一个在 WASM 和 JS 之间做性能对比的经典案例，就是 Mozilla 开发者和 V8 开发者的白学现场。整个过程是这样的：

* Mozilla Hacks 发表了一篇名为 [用 Rust 和 WASM 优化 Source Map 性能](https://hacks.mozilla.org/2018/01/oxidizing-source-maps-with-rust-and-webassembly/) 的博文，将 `source-map` 这个 JS 包的性能**优化了五倍**。
* V8 核心开发 Vyacheslav Egorov 回应了名为 [你也许不需要用 Rust 和 WASM 来优化 JS](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) 的博文，用纯 JS 实现了**速度比 Rust 更快的惊人优化**。
* 原文作者以 [无需魔法的速度](https://fitzgeraldnick.com/2018/02/26/speed-without-wizardry.html) 为名展开了进一步讨论，并用 Rust 做出了新的性能优化。

巧的是，这场论战正发生在两年前**白色相簿的季节**。双方就像雪菜和冬马那样展开了高水平的对决，名场面十分精彩。最终 Vyacheslav 给出了一张三轮过招后的性能对比图。可以看到虽然最终还是 Rust 更快，但 JS 被逼到极限后非但不是败犬，还胜出了一回合：

![](https://ewind.us/images/wasm-wa2/parse-iterate-rust-wasm-vs-js-2.png)

> JS：先开始性能优化的是你吧！擅自跑到我无法触及的地方去的人是你吧！明明遥不可及，却又近在咫尺，先想出这种拷问方式的人是你吧！明明是这样，为什么还非得被你责备不可啊…？像那样…每天、每天，在我的眼前，跑得那么快…还说这全都是我的错…太残忍了啊…

另外，Milo Yip 大大做过的不同语言光线追踪性能测试（修罗场），也能侧面印证带 VM 语言与机器码之间的性能对比结论。C++、Java 和 JS 在未经特别优化的前提下，可以分别代表三个典型的性能档次：

[C++/C#/F#/Java/JS/Lua/Python/Ruby 渲染比试](https://www.cnblogs.com/miloyip/archive/2010/07/07/languages_brawl_GI.html)

> Ruby：为什么你们都这么熟练啊！

## WASM 比 JS 快，所以计算密集型应用就该用它？
这有点偏颇，WASM 同样是 **CPU** 上的计算。对于可以高度并行化的任务，使用 WebGL 来做 **GPU** 加速往往更快。譬如我在  [实用 WebGL 图像处理入门](https://zhuanlan.zhihu.com/p/100388037)  这篇文章里介绍的图像处理算法，比起 JS 里 for 循环遍历 Canvas 像素就可以很轻松地快个几十倍。而这种套两层 for 循环的苦力活，用现在的 WASM 重写能快几倍就非常不错了。至于浏览器内 AI 计算的性能方面，社区的评测结论也是 WebGL 和 WebMetal 具备最高的性能水平，然后才是 WASM。参见这里：[浏览器内的 AI 评测](https://blog.logrocket.com/ai-in-browsers-comparing-tensorflow-onnx-and-webdnn-for-image-classification/) 

不过，WebGL 的加速存在精度问题。例如前端图像缩放库 Pica，它的核心用的是 Lanczos 采样算法。我用 WebGL 着色器实现过这个算法，它并不复杂，早期的 Pica 也曾经加入过可选的 WebGL 优化，但现在却劈腿了 WASM。这一决策的理由在于，**WASM 能保证相同参数下的计算结果和 JS 一致，但 WebGL 则不行**。相关讨论参见这里：[Issue #114 · nodeca/pica](https://github.com/nodeca/pica/issues/114)

所以对计算密集型任务，WASM 并不是前端唯一的救星，而是给大家多了一种在性能、开发成本和效果之间权衡的选择。在我个人印象里，前端在图形渲染外需要算力的场景说实话并不太多，像加密、压缩、挖矿这种，都难说是高频刚需。至于未来可能相当重要的 AI 应用，长期而言我还是看好 WebGPU 这种更能发挥出 GPU 潜力的下一代标准，当然 WASM 也已经是个不错的可选项了。

> WebGL：是我，是我先，明明都是我先来的…3D 也好，图像处理也好，还是深度学习也好…

![](https://ewind.us/images/wasm-wa2/kazusa-first.jpg)

## 只要嵌入 WASM 函数到 JS 就能提高性能？
既然 WASM 很快，那么是不是我只要把 JS 里 `const add (a, b) => a + b` 这样的代码换成用 C 编译出来的 WASM，就可以有效地提高性能了呢？

这还真不一定，因为现代浏览器内的 JS 引擎都标配了一种东西，那就是 **JIT**。简单来说，上面这个 `add` 函数如果始终都在算整数加法，那么 JS 引擎就会自动编译出一份计算 `int a + int b` 的机器码来替代掉原始的 JS 函数，这样高频调用这个函数的性能就会得到极大的提升，这也就是 JIT 所谓 Just-in-time 编译的奥妙所在了。

所以，不要一觉得 JS 慢就想着手动靠 WASM 来嵌入 C，其实现代 JS 引擎可都是在不停地帮你「自动把 JS 转换成 C」的！如果你可以把一个 JS 函数改写成等价的 C，那么我猜如果把这个函数单独抽离出来，靠 JS 引擎的 JIT 都很可能达到相近的性能。这应该就是 V8 开发者敢用 JS 和 Rust 对线的底气所在吧。

像在 [JS 和 WASM 之间的调用终于变快了](https://hacks.mozilla.org/2018/10/calls-between-javascript-and-webassembly-are-finally-fast-%F0%9F%8E%89/) 这篇文章中，Lin Clark 非常精彩地论述了整个优化过程，最终使得 JS 和 WASM 间的函数调用，比**非内联的** JS 函数间调用要快。不过，至于和被 JIT 内联掉的 JS 函数调用相比起来如何，这篇文章就没有提及了。

这里偏个题，Mozilla 经常宣传自己实现的超大幅优化，有不少都可能来源于之前明显的设计问题（平心而论，我们自己何尝不是这样呢）。像去年 Firefox 70 在 Mac 上实现的 [大幅省电优化](https://mozillagfx.wordpress.com/2019/10/22/dramatically-reduced-power-usage-in-firefox-70-on-macos-with-core-animation/)，其根源是什么呢？粗略的理解是，以前的 Firefox 在 Mac 上竟然**每帧都会全量更新窗口像素**！当然，这些文章的干货都相当多，十分推荐大家打好基础后看看原文，至少是个更大的世界，也常常能对软件架构设计有所启发。

如果后续 WASM 支持了 GC，那么嵌入互调的情况很可能更复杂。例如我最近就尝试在 Flutter 的 Dart 和安卓的 Java 之间手动同步大对象，希望能「嵌入一些安卓平台能力到 Flutter 体系里」，然而这带来了许多冗长而低性能的胶水代码，需要通过异步的消息来做深拷贝，可控性很低。虽然 WASM 现在还没有 GC，但一旦加上，我有理由怀疑它和 JS 之间的对象生命周期管理也会遇到类似的问题。只是这个问题主要是让 Mozilla 和 Google 的人来操心，用不着我们管而已。

> 参数传递什么的，已经无所谓了。因为已经不再有函数，值得去调了。
> 传达不了的指针，已经不需要了。因为已经不再有对象，值得去爱了。

![](https://ewind.us/images/wasm-wa2/unreachable-love.jpg)

## 在 JS 里调 WASM，就像 Python 里调 C 那样简单？
这个问题只有实际做过才有发言权。譬如我最近尝试过的这些东西：

* 在安卓的 Java class 里调用 C++
* 在 Flutter 的 Dart 里调用 C
* 在 QuickJS 这种嵌入式 JS 引擎里调用 C

它们都能做到一件事，那就是在引擎里新建原生对象，并将它以**传引用的方式**直接交给 C / C++ 函数调用，并用引擎的 GC 来管理对象的生命周期。这种方式一般称为 FFI（Foreign Function Interface 外部函数接口），可以把原生代码嵌入到语言 Runtime 中。但如果是两个不同的 Runtime，事情就没有这么简单了。例如 QuickJS 到 Java 的 binding 项目 [Quack](https://github.com/koush/quack#marshalling)，就需要在 JS 的对象和 Java 对象中做 Marshalling（类似于 JSON 那样的序列化和反序列化）的过程，不能随便传引用。

对 WASM 来说是怎样的呢？基本上，WASM 的线性内存空间可以随便用 JS 读写，并没有深拷贝的困扰。不过，WASM 只有 int 和 float 之流的数据类型，连 string 都没有，因此对于稍复杂一点的对象，都很难手写出 JS 和 WASM 两边各自的结构。现在这件脏活是交由 wasm-bindgen 等轮子来做的。但毕竟这个过程并不是直接在 JS 的 Runtime 里嵌入 C / C++ 函数，和传统编译到机器码的 FFI 还是挺不一样的。

而至于不能在 WASM 的 Memory 对象里表达的 JS 对象，就会遇到一种**双份快乐**的问题了。例如现在如果需要频繁地用 WASM 操作 JS 对象，那么几乎必然是影响性能的。这方面典型的坑是基于 WASM 移植的 OpenGL 应用。像 C++ 中的一个 `glTexImage2D` 函数，目前编译到 WASM 后就需要先从 WASM 走到 JS 胶水层，再在 JS 里调 `gl.texImage2D` 这样的 WebGL API，最后才能经由 C++ binding 调用到原生的图形 API。这样从一层胶水变成了两层，性能不要说比起原生 C++，能比得上直接写 JS 吗？

当然，Mozilla 也意识到了这个问题，因此他们在尝试如何更好地将 Web IDL（也就是浏览器原生 API 的 binding）开放给 WASM，并在这个过程中提出了 [WASM Interface Types](https://hacks.mozilla.org/2019/08/webassembly-interface-types/) 概念：既然 WASM 已经是个字节码的中间层了，那么干脆给它约定个能**一统所有编程语言运行时类型的 IR 规范**吧！不过，这一规范还是希望主要靠协议化、结构化的深拷贝来解决问题，只有未来的 `anyref` 类型是可以传引用的。`anyref` 有些像 Unix 里的文件描述符，这里就不展开了。

![](https://ewind.us/images/wasm-wa2/wasm-interface-types.png)

所以，未来也许 WASM 里会有 DOM 的访问能力，但目前这毕竟还只是个饼。不要说像 WebGL 的某些扩展已经明确 [不受 Web IDL 支持](https://heycam.github.io/webidl/#NoInterfaceObject)，就算距离把主流的 Web 标准都开放到 WASM 并普及到主流用户，在 2020 年这个时间节点看来还是挺遥远的。

> 浏览器：为什么会变成这样呢…第一次有了高性能的脚本语言，又兼容了高级的原生语言。两份快乐重叠在一起。而这两份快乐，又带来了更多的快乐。得到的，本该是像梦境一般的幸福时光…但是，为什么，会变成这样呢…

![](https://ewind.us/images/wasm-wa2/double-happiness.jpg)

## 前端框架迟早会用 WASM 重写？
我觉得很难，或者说这件事的投入产出比 (ROI) 未必足够。因为对于主流的前端应用来说，它们都是 IO 密集而不是计算密集型的，这时 WASM 增加的算力很难成为瓶颈，反而会增加许多工程上的维护成本。

这方面的一个论据，是 Google 的 [JIT-less V8 介绍](https://v8.dev/blog/jitless)。V8 在关闭 JIT 后峰值性能降低到了不到原先十分之一的级别（见 [QuickJS Benchmark](https://bellard.org/quickjs/bench.html)），却也几乎不影响刷 YouTube 这种轻度应用的性能表现， 在模拟重度 Web 应用负载的 Speedometer 标准下，其跑分也有原先的 60% 左右，只有在 Webpack 打包类型的任务上出现了数量级的差异。你觉得迁移到 WASM 后，峰值算力就算比现在再翻两倍，能在事件驱动、IO 密集的 GUI 场景中表现出颠覆性的突破吗？能说服框架作者们完全放弃现有的 JS 代码库，选用另一种语言来彻底重写框架吗？况且 WASM 从长期来看，可都要依赖不少体积足以影响首屏性能的 JS 胶水代码和 polyfill 呢。

用 WASM 重写主流 UI 框架，意味着前端需要重度依赖一门完全不同的语言技术栈。**你说因为 JVM 比 V8 快，所以 Node 应用就应该用 Java 重写吗**？我看前端圈里的政治正确明明是反过来的啊…

> 我即使是死了，钉在棺材里了，也要在墓里，用这腐朽的声带喊出：JS 牛逼！！！（被禁言）

## WASM 属于前端生态？
这个我不太认可。要知道，**一个 WASM 应用，其编译工具链和依赖库生态，基本完全不涉及 JS**。

2018 年我尝试编译过 ffmpeg 到 WASM，这整个过程几乎和 JS 没任何关系，重点都集中在搭建 Docker 编译环境和魔改 Makefile 上了。以我当时的水平，整个流程让我非常困惑。

后来我在折腾嵌入式 Linux 和安卓的过程中，顺带搞懂了**工具链**的概念。一个原生应用，需要编译、汇编和链接过程，才能变为一个可执行文件。比如我的开发机是 Mac，那么装在 macOS 上典型的几套工具链像这样：

* 面向 macOS 的工具链，是编译到 macOS 二进制格式的 clang 那一套
* 面向安卓的工具链，是编译到 ARM 二进制格式的 aarch64-linux-android-gcc 那一套（在 NDK 里翻翻就知道了）
* 面向 PSP 的工具链，是编译到 MIPS 二进制格式的 mips-gcc 那一套（名字不一定对啊）
* 面向 WASM 的工具链，是面向 WASM 字节码格式的 Emscripten 那一套

后面三者都是编译到其它的平台，因此叫做**交叉编译**。

一套支持交叉编译的工具链，会附带上用于支持目标平台的一些库，例如 include 了 `<GLES2/gl2.h>` 之后，你调用到的 `glTexImage2D` API 就是动态库里提供的。有了动态库，这个 API 才能在 x86 / ARM / MIPS / WASM 等平台上一致地跑起来（就像安卓上的 `.so` 格式）。**像 Emscripten 就提供了面向 WASM 平台，编译成 JS 格式的一套动态库**。但它只能保证这些 API 能用，性能如何就另说了。它自己也对移植 WebGL 时的性瓶颈提出了很多的 [优化建议](https://emscripten.org/docs/optimizing/Optimizing-WebGL.html)。

所以这里再重复一遍，**编译 WASM 应用所需的依赖库和整套工具链，几乎都跟 JS 没什么关系**。JS 就像机器码那样，只是人家工具链编译出来的输出格式而已。在 JS 开发者看来，这整套东西可能显得相当突兀。但从原生应用开发者的视角看来，这一切都再正常不过了。

来而不往非礼也。WASM 可以把其它语言引进来，JS 就不能往外走出去了吗？除了 Flutter 这种修正主义路线，像我详细介绍过的 Static TypeScript 和 QuickJS，就是信奉 JS 系的冬马党们搞的反向输出：

* [随着 TypeScript 继续普及，会不会出现直接跑 TypeScript 的运行时？](https://www.zhihu.com/question/363807522/answer/961295958)
* [将 React 渲染到嵌入式液晶屏](https://zhuanlan.zhihu.com/p/89574235)

说了这么多，那么 WASM 的适用场景到底是什么呢？现在 WASM 社区大力推广的提案，如 WASI、多线程、GC 这些，其实都跟 JS 生态关系不大，而是方便**把更复杂的原生应用直接搬进 Web** 的技术需求。话都说到这份上了，大家还没看出来吗？这不就是典型雪菜式的明修栈道，暗度陈仓嘛（笑）

最后总结下，JS 和 WASM 的人设大概各自是这样的：

* JS：我先来的，**哪里有浏览器，哪里就是我的主场**。虽然有人不喜欢我的脾气，但我到哪都是一头黑长直的字符串脚本。追我的引擎有的是，但我始终首先是浏览器的忠犬。
* WASM：我是高岭之花，浏览器内外大家都欢迎我，而且谁都能编译到我，所以欢迎大家都来用我的二进制格式吧。我虽然很想和 JS 和浏览器三个人永远在一起，但最希望以后跨平台**只要靠我的努力就可以永远幸福下去了**。

> WASM：啊…如果 JS 是强类型的男孩子的话就好了。

![](https://ewind.us/images/wasm-wa2/kazusa-boy.jpg)

你觉得明明先来的冬马 (JS) 和高岭之花的雪菜 (WASM) 哪个更对你胃口呢？提醒下某些整天喊着我全都要的白学家，双份快乐可不是一般人玩得起的噢。

> 一般来说整个白学家（程序员）群体里冬马党基数最大，但骨灰级玩家常常是雪菜党。至于我嘛…你看看我简介里的花名叫什么？

最后上一张合照，冬马和雪菜都是好样的！

![](https://ewind.us/images/wasm-wa2/group-photo.jpg)

## 后记
WASM 当然是个革命性的技术，代表了一种跨平台的全新方向，尤其对原生应用开发者来说具备巨大的商业价值。但它对前端来说其实就是个浏览器内置的字节码虚拟机，不是一切性能问题的灵丹妙药。目前网上不少对它的赞美，在我看来多少有些过誉了。所以建议大家不要盲目跟风，还是从**白学**，啊不**计算机科学**的基础出发，去判断一个技术的适用场景和价值在哪吧。

> 本文配图均来自纯 JS 实现的高性能前端应用 [稿定 PS](https://ps.gaoding.com/)。白学部分纯属娱乐，请大家不要过分解读（如为什么 JS 的 Logo 是雪菜黄，而 WASM 的 Logo 反而是冬马紫之类）。我的水平有限，欢迎大家对本文技术观点更进一步的交流，也希望大家能关注我的「[前端随想录](https://zhuanlan.zhihu.com/fe-fantasy)」这个自由技术专栏～
