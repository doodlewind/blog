categories: Note

tags:

- Web

date: 2020-07-19

toc: true

title: QuickJS 引擎一年见闻录
---

时间过得真快，转眼间 QuickJS 引擎已经发布一年了。一年来，围绕着它都发生了些什么呢？这篇文章会以一名普通社区用户的视角，聊些值得一提的见闻。内容主要包括这些：

* 特性更新简介
* 社区生态与应用案例
* 若干常见问题
* 对比总结

注意下面主要只是个人的评述，而我的水平显然是远不配和 Fabrice 相提并论的。大家如果有兴趣和时间，还是推荐直接啃第一手资料噢。


## 特性更新简介
自 2019 年 7 月以来，QuickJS 共发布了 14 个版本，基本以月为单位不定期地更新。除了修复邮件列表上反馈的 bug 之外，引擎也在细水长流地加入新功能，并不是个「出道即巅峰」的纯炫技作品。当然，Fabrice 这种世外高人也不是凡人随便使唤得动的，这个项目也有些「改善性需求」尚未落地，会在后面提及。

QuickJS 在引擎特性上的更新，主要可以分为下面这些部分：

* 新语言特性支持
* 配套运行时的新 API
* 新 C 语言 API

首先，QuickJS 相当注重对 ECMAScript 新老特性的支持，其规范支持度和兼容性，可能比很多人想象中都要高。目前它的主页介绍已经默默从「支持 ES2019」变成了「支持 ES2020」，一年来主要支持了下面这些 Stage 3 以上的新语言特性：

* 空值合并运算符（nullish coalescing operator）。
* 可选链操作符（optional chaining）。
* 备受争议的 class private field。
* Promise 的 allSettled 与 any 方法，以及相应的 AggregateError。
* Object.fromEntries
* String.prototype.replaceAll 和 String.prototype.matchAll
* import.meta

目前，QuickJS 的 [Test262](https://test262.report/browse/?engines=javascriptcore%2Cspidermonkey%2Cv8%2Chermes%2Cqjs) 整体用例通过率高达 96%，它在 Language Syntax 和 Standard Built-in Objects 两项里都排名第一，对历史遗留问题 Annex B 部分的支持度也高得令人发指，就标准支持度而言已经超过了 SpiderMonkey 和 JavaScriptCore，和 V8 不分上下：

![](/images/quickjs/test262.png)

除此之外，最能体现 QuickJS 特色的，还是它目前独家支持的两项 Stage 1 语言特性，一个是十进制浮点数运算的 [proposal-decimal](https://github.com/tc39/proposal-decimal)，另一个是 [proposal-operator-overloading](https://github.com/tc39/proposal-operator-overloading)。鉴于这两项提案不少同学可能还没有听说过，这里简单介绍一下它们。

首先是 QuickJS 在 2020 年第一个版本里支持的 Decimal 提案。它想解决的是很多 JS 新手都会困惑的这个经典浮点数问题：

``` js
0.1 + 0.2 === 0.3 // false
```

这显然是浮点数舍入误差导致的。为此，提案支持无舍入误差的十进制浮点数运算，并且能自定义取整方式。这对应于新的 `0.1m` 形式字面量（类似 BigInt 的 `10n`），为此也引入了新的基础类型：

``` js
let x = 0.1m
x + 0.2m === 0.3m // true
typeof x // "bigdecimal"
```

这个特性是通过 Fabrice 以前的作品 [libbf](https://bellard.org/libbf/) 浮点库实现的，它可以支持任意精度的浮点运算。同样在 2020 年 1 月的更新里，他在 QuickJS 主页放出了一段 JS，能把圆周率计算到小数点后 10 亿位。Decimal 提案在介绍部分引用了 Fabrice 的这段代码，怀疑 TC39 里有多少人看得懂它：

``` js
/* compute PI with a precision of 'prec' digits */
function calc_pi(prec) {
    const CHUD_A = 13591409m;
    const CHUD_B = 545140134m;
    const CHUD_C = 640320m;
    const CHUD_C3 = 10939058860032000m; /* C^3/24 */
    const CHUD_DIGITS_PER_TERM = 14.18164746272548; /* log10(C/12)*3 */
    
    /* return [P, Q, G] */
    function chud_bs(a, b, need_G) {
        var c, P, Q, G, P1, Q1, G1, P2, Q2, G2, b1;
        if (a == (b - 1n)) {
            b1 = BigDecimal(b);
            G = (2m * b1 - 1m) * (6m * b1 - 1m) * (6m * b1 - 5m);
            P = G * (CHUD_B * b1 + CHUD_A);
            if (b & 1n)
                P = -P;
            G = G;
            Q = b1 * b1 * b1 * CHUD_C3;
        } else {
            c = (a + b) >> 1n;
            [P1, Q1, G1] = chud_bs(a, c, true);
            [P2, Q2, G2] = chud_bs(c, b, need_G);
            P = P1 * Q2 + P2 * G1;
            Q = Q1 * Q2;
            if (need_G)
                G = G1 * G2;
            else
                G = 0m;
        }
        return [P, Q, G];
    }

    var n, P, Q, G;
    /* number of serie terms */
    n = BigInt(Math.ceil(prec / CHUD_DIGITS_PER_TERM)) + 10n;
    [P, Q, G] = chud_bs(0n, n, false);
    Q = BigDecimal.div(Q, (P + Q * CHUD_A),
                       { roundingMode: "half-even",
                         maximumSignificantDigits: prec });
    G = (CHUD_C / 12m) * BigDecimal.sqrt(CHUD_C,
                                         { roundingMode: "half-even",
                                           maximumSignificantDigits: prec });
    return Q * G;
}
```

与此相关的引擎特性还有一个自定义的 `"use math"` 指令。启用后，字面量 `1.0` 的类型会变成 `"bigfloat"`（二进制表示的任意长浮点数）。目前这部分特性还是 opt-in 的，可以通过 `qjs --bignum` 开启。

而 QuickJS 对 BigDecimal 的实现，也与另一个运算符重载提案有着千丝万缕的联系。需要做向量和矩阵运算的同学，应该都知道运算符重载对这类代码可读性的影响。比如在 TensorFlow.js 里的这种代码：

``` js
function predict(x) {
  // y = a * x ^ 3 + b * x ^ 2 + c * x + d
  return tf.tidy(() => {
    return a.mul(x.pow(tf.scalar(3, 'int32')))
      .add(b.mul(x.square()))
      .add(c.mul(x))
      .add(d);
  });
}
```

就可以写成这样：

``` js
function predict(x) {
  with operators from tf.equation;

  // y = a * x ^ 3 + b * x ^ 2 + c * x + d
  return tf.tidy(() => {
    return a * x ** tf.scalar(3, 'int32')
         + b * x.square()
         + c * x
         + d;
  });
}
```

QuickJS 已经支持了这项 Stage 1 提案，中途还帮助修复了提案伪代码算法中的 [bug](https://github.com/tc39/proposal-operator-overloading/pull/22)。在引擎源码里用作演示而配套的 `qjscalc` 计算器中，就重度应用了运算符重载，这样由嵌套数组构成的矩阵可以直接加减乘除：

``` js
// 3x3 矩阵
const a = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
const b = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

a + b // [[2, 0, 0], [0, 2, 0], [0, 0, 2]]
```

目前 QuickJS 也应该是仅有的支持这一能力的 JS 引擎。

上面这些是 QuickJS 支持的新语言特性。接下来聊聊它在运行时部分的更新。

我们知道，纯粹按规范实现的 JS 引擎是不管「副作用」的，甚至连设置定时器和打 log 都不支持。作为工程项目，引擎至少需要配套某种运行时来处理 IO（比如输出跑 Test262 的结果）。在 QuickJS 里这一点实现得很清晰，直接体现在了代码文件层面：

* `quickjs.c` 对应整个引擎。
* `quickjs-libc.c` 对应运行时标准库，依赖引擎。
* `qjs.c` 对应可执行文件入口，依赖运行时。

所以这里讲的就是 `quickjs-libc.c` 文件里的更新了。它主要提供了 os 和 std 两个开箱即用的模块，一年来新特性包括这些：

**os 模块**

* `os.Worker`
* `os.exec`
* `os.chdir`
* `os.realpath`
* `os.getcwd`
* `os.mkdir`
* `os.stat`
* `os.lstat`
* `os.readlink`
* `os.readdir`
* `os.utimes`

**std 模块**

* `std.parseExtJSON`
* `std.loadFile`
* `std.strerror`
* `std.FILE.prototype.tello`
* `std.popen`
* `std.urlGet`

其中，最近版本里加入的 `os.Worker` 除了支持 message 通信外，还支持 `SharedArrayBuffer` 能力。社区原有的第三方运行时里，还没有提供这种支持。

另外从今年 4 月起，QuickJS 里的 JS 对象已经支持跨 Realm 了。这意味着和 iframe 类似地，同一份脚本里的变量可以存在于不同的 JSContext 中。

最后，在引擎的 C API 方面，则有这些新增：

* `JS_GetRuntimeOpaque`
* `JS_SetRuntimeOpaque`
* `JS_NewUint32`
* `JS_SetHostPromiseRejectionTracker`
* `JS_GetTypedArrayBuffer`
* `JS_ValueToAtom`
* `JS_GetOwnPropertyNames`
* `JS_GetOwnProperty`
* `JS_NewPromiseCapability`

现在我们可以用 C API 来新建 Promise，也可以操作 TypedArray 了。另外像 `JS_NewRuntime` 和 `JS_Eval` 这类核心 API，一年来并没有出现 breaking change。在 API 稳定性上，它并不像很多前端项目那样「拥抱变化」，这方面还是挺令人放心的。


## 社区生态与应用案例
上面这些内容，大家只要看看 [Changelog](https://bellard.org/quickjs/Changelog)  其实都很容易查到。但就算是这个信息，应该也是这个月才添加到了项目主页上。之前如果没有实际下载源码，官网上甚至都看不到具体的更新细节。这侧面体现出了 QuickJS 项目的另一个鲜明特点：在运营上非常「老派」。

QuickJS 的「社区」比起和广大前端开发者熟悉的「社区」，至少有这些不同：

* 坚持用邮件列表，没有 issue 和 bug tracker。
* 从来只发布 tar 打包后的纯文本源码。
* 没有官方 Git 仓库，即便有了也不接受 PR。

非常明显地，**目前整个项目还是完全由 Fabrice 控制的**。另一位合作者 Charlie Gordon（这名字是《献给阿尔吉侬的花束》的主角，可能是个假名）除了引擎刚发布时活跃过一个月，已经消失很久了。如果你反馈了一个冷门 bug，Fabrice 可能（迅速或隔好几天）回复你一句「it will be fixed in next release」。那么恭喜你，下个版本里这个 bug 一定会修掉。但具体什么时候有新版本，目测也没有人知道。另外对一些小白问题，Fabrice 也可能翻牌子秒回（我就遇到过）。

另一件可以肯定的事是，QuickJS 其实还没有「真正」开源，目前主页上只有一个非官方 [GitHub 镜像](https://github.com/horhof/quickjs)。Fabrice 近期表示他自己的仓库使用 Subversion 维护，这个仓库还不打算公开。这既可以解释为什么现在 `quickjs.c` 里能把 5 万多行引擎代码写在同一个文件里，也可以解释为什么它不接受 PR，因为我们拿到的「源码」可能已经是通过工具生成的了。

但这些都挡不住社区的兴趣，因为目前 QuickJS 所发布的代码，实际上是相当易用且清晰可读的。只要看过源码就能发现，在不玩拉马努金式的黑魔法时，Fabrice 写的工程代码就像高中课后习题答案一样简单直接，丝毫不拖泥带水。下面列举一些有趣的社区周边项目：

* [txiki.js](https://github.com/saghul/txiki.js) 运行时基于 libuv 提供了类似 Node.js 的能力，作者是 libuv 的核心开发者。
* [vscode-quickjs-debug](https://github.com/koush/vscode-quickjs-debug) 提供了非官方的 VSCode 调试器支持，需要与作者 fork 出的定制版 QuickJS 配合使用。Fabrice 曾经对此表示会考虑加入调试器协议，可惜现在还没有进一步进展。
* [quickjs-emscripten](https://github.com/justjake/quickjs-emscripten) 可以在浏览器里基于编译到 WASM 的 QuickJS 建立 VM 沙盒，执行不可控的外部 JS 代码。
* [unity-jsb](https://github.com/ialex32x/unity-jsb) 支持在 Unity 游戏引擎里使用 JS，这时运算符重载特性相当重要。
* [GodotExplorer/ECMAScript](https://github.com/GodotExplorer/ECMAScript) 支持在 Godot 游戏引擎里使用 JS。顺带一提，它由知乎用户 at Geequlim 开发的。
* [flutter_js](https://github.com/abner/flutter_js) 支持在 Flutter 环境里执行 JS，它在安卓上会使用 QuickJS。不过注意这时实际的开发语言还是 Dart。
* [qjs-wasi](https://github.com/saghul/wasi-lab/tree/master/qjs-wasi) 支持基于新的 WASI 标准，把 `qjs` 可执行文件直接编译到浏览器里执行。
* [fast-vue-ssr](https://github.com/galvez/fast-vue-ssr) 刚刚推出，配合 Rust 上的高性能 Warp HTTP 框架来做 Vue 的 SSR。作者认为这种手法在多线程使用时，能兼备低资源消耗与高吞吐量。
* [quickjs-zh](https://github.com/quickjs-zh/QuickJS) 提供了 QuickJS 文档的中文翻译。

目前社区也已经实现引擎到各大主流语言的 binding 了：

* [Java](https://github.com/koush/quack)
* [C++](https://github.com/ftk/quickjspp)
* [C#](https://github.com/vmas/QuickJS.NET)
* [Rust](https://github.com/theduke/quickjs-rs)
* [Go](https://github.com/wspl/go-quickjs)
* [Pascal](https://github.com/Coldzer0/QuickJS-Pascal)
* [Python](https://github.com/PetterS/quickjs)

而对于移动端开发者，也有将引擎移植到 [iOS](https://github.com/siuying/QuickJS-iOS) 和 [Android](https://github.com/seven332/quickjs-android) 平台的示例项目供参考。另外引擎也可以通过 Chrome Labs 搞的 [jsvu](https://github.com/GoogleChromeLabs/jsvu) 这个 nvm 式的 version updater 来升级。

既然都贴了这么多链接，就顺便再列一些我之前写的相关文章吧。对我自己来说，很多计算机知识是在拿 QuickJS 尝试实现 idea 的路上才搞清楚的，因此也特别感谢这个项目。这里再分享一下：

* [从 JS 引擎到 JS 运行时（上）](https://zhuanlan.zhihu.com/p/104333176)
* [从 JS 引擎到 JS 运行时（下）](https://zhuanlan.zhihu.com/p/104501929)
* [将前端技术栈移植到掌上游戏机](https://zhuanlan.zhihu.com/p/97851599)
* [将 React 渲染到嵌入式液晶屏](https://zhuanlan.zhihu.com/p/89574235)

上面列的这些都是纯技术项目，有没有一些面向最终用户的产品呢？目前已知的案例还比较少，但都不是「为了用而用」，可以说是找到了 QuickJS 与具体使用场景的契合性的。

首先，著名的 Web 设计工具 Figma 在邮件列表讨论（[这里](https://www.freelists.org/post/quickjs-devel/Bug-in-direct-eval-resolution)）中，表示他们已经将 QuickJS 编译到了 WASM，作为其 Web 编辑器的 JS 插件运行时了。这封邮件中反馈的 bug 与当时 QuickJS 的 eval 行为无法被 shadow 掉有关，对于沙盒来说这显然属于需要屏蔽的能力。

然后，Fabrice 自己其实默默地基于 QuickJS 做了个很不错的产品，也就是在线科学计算器[numcalc.com](http://numcalc.com/)，支持任意精度的复数、超越函数、泰勒级数和矩阵运算等能力，相当强大。这个项目的原理，其实就是把修改后的 `qjs` 命令行 REPL 环境完全搬到了浏览器里，有些更像是在展示极致的个人技术力：

* 展示 libbf 支持任意精度的浮点数运算。
* 展示 QuickJS 独家支持运算符重载提案。
* 展示 QuickJS 可以编译到 WASM。

说来也巧，这和 at 立党 最近在知乎上炒得很热的 [Hedgedog Lab](https://github.com/lidangzzz/hedgehog-lab) 有些异曲同工。不过其中一个是（自己徒手写出 JS 引擎、浮点运算库和 REPL 终端）把圆周率算到 10 亿位，另一个则是（基于社区的 transpiler、gpu.js 和 monaco 编辑器）把矩阵运算移到 GPU 做加速，可以（强行）说各有所长吧。论技术力对比的话 Fabrice 之高山仰止自不必多言，但这件事本身倒是很有趣，适合编个震惊体新闻：

> 《震惊！天津相声演员与编程奇才争相开发在线 JS 计算器，最大输家竟是 Matlab！》

补充一下，我司（厦门稿定科技）内部搭建的移动端 Hybrid 框架里也用到了 QuickJS，用于渲染富 Canvas 式的应用。相应项目目前还处于开发阶段，等后面实际落地后，应该会有更多进一步的分享。我们团队也有 HC 开放，欢迎感兴趣的小伙伴投递噢。


## 常见问题
这里整理了一些现在使用 QuickJS 时，可能比较容易遇到的问题：

* 目前引擎缺少官方支持的调试器，断点调试还是个问题（`debugger` 语句会被忽略）。社区版本里虽然支持了调试器，但只有试验性实现，无法保证稳定性。
* QuickJS 虽然支持在不同线程依次操作 JSRuntime（注意不是并行 eval），但这种操作会导致一个 [stack overflow 报错](https://www.freelists.org/post/quickjs-devel/stackoverflow,2)，具体绕过方法在邮件列表里有详细介绍。
* 原生模块名要以 `.so` 结尾，否则 JS 代码虽然也可以正常完成模块解析并运行，但编译成字节码时会报错。
* ESM 目前支持的都是相对路径，且模块名要显式以 `.js` 结尾。
* 移动端字节码要在 PC 端以相同版本的 QuickJS 编译，否则会出问题。
* 鉴于引擎基于引用计数做 GC，因此在用 C API 操作 JS 对象时，要手动以 `JS_DupValue` 和 `JS_FreeValue` 平衡引用计数，否则是无法通过退出 JSRuntime 时的 asset 检查的。
* 一些特殊语法的性能可能有问题。例如如果把 for 循环里的 `100000` 换成  `10e6`，会慢 20 倍以上。在这方面，源码目录里的 TODO 文件列出了很多还没做的优化，可供参考。
* 为引擎开发原生 API 时，需要手动检测并抛出 `JS_EXCEPTION` 异常，否则调试时可能完全没有 JS 的错误堆栈信息，会很懵逼。
* 目前引擎也还缺少 Profiler 工具，不过源码中有一些 micro benchmark 用例。其中可以用内置 API 拿到纳秒精度的时间，测试结果较为稳定。


## 对比总结
评价 QuickJS 时一定要牢记一点，那就是这毕竟是个没有 JIT 的引擎，虽然比其他嵌入式 JS 引擎快很多，但性能仍然远不能和 V8 这种复杂得多的引擎相提并论。有了 JIT 后，理想条件下能实现 20 倍以上的性能提升（Google 的钱可没白烧啊）。作为解释器，QuickJS 的性能和 CPython 或不带 JIT 的 Lua 在同一级。基于它解释执行的 JS 代码，在移动端比起等价的 C++ 慢个上百倍都是完全有可能的。虽然对于 IO 密集的普通应用来说这也不是不能接受，但这方面我们也踩到过一些坑，有机会再单独写文章讨论。

相比 V8，更适合与 QuickJS 对比的 JS 引擎应该是 Hermes。这时不难发现 QuickJS 在同等性能下，实现了更高的规范支持度和更轻的量级（经过 at 黄玄 补充，Hermes 的体积没有 QuickJS 主页 benchmark 里写的 27M 那么夸张，应该在 1M 左右。但相比之下 QuickJS 只有 210KB），也同样支持编译到内部字节码格式来优化加载速度与代码体积。对于 Hermes 所适用的 Hybrid 应用场景，它应该也是个有力的候选项。

某种程度上说，带和不带 JIT 的 JS 引擎，区别就像手枪和重机枪一样大。这方面基于 Web 技术栈开发超轻量 GUI 应用的框架 [Sciter](https://sciter.com/) 很有发言权。它的作者在 HN 上讨论 QuickJS 时，表示过在这种场景下有两条路：

* 依赖 JIT 黑魔法实现高性能。
* 自己将性能敏感部分用原生语言实现，保持 JS 的「胶水」特色。

Sciter 就选择了后面这条，从而在体积和可嵌入性上做到了远超 Electron 的表现。这方面的专家是 at 龙泉寺扫地僧，这里就不班门弄斧了。

在个人理解里，目前的 QuickJS 在如下场景里都很有潜力：

* 支撑移动端的 Hybrid UI，如 Hermes 之于 React Native。
* 嵌入式硬件的上层应用开发，类似 [Static TypeScript](https://www.zhihu.com/question/363807522/answer/961295958)。
* Web 低代码平台的沙箱，如 Figma 的插件系统。
* 游戏引擎内的脚本子系统。
* 计算机基础知识的学习。
* 闲着无聊想折腾（划掉）。

总之，一年来的 QuickJS 保持着进步，默默地在 **small but complete** 的方向上几乎做到了极致。它仍然具有鲜明的个人特色，毕竟寻常的项目不配出现在 Fabrice 的主页上。这位编程界超级英雄的风采，我们还能欣赏多久呢？应该把这个引擎当作一件玩具，还是一件武器呢？

这都不好说，不过现在尝鲜显然还不算太迟。
