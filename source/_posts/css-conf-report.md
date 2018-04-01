categories: Note

tags:

- Summary

date: 2018-04-01

toc: false

title: 2018 CSS 大会多图见闻录
---

CSS 之于前端有些像厦门之于 IT 界：耳熟能详却又略显小众。那么在厦门召开的第四届 CSS 大会是否能结合碰撞出新的火花呢？跟随着本兼职摄影师来看看吧~

<!--more-->

周六上午的巨幕影厅里，本届 CSS 大会正式拉开帷幕。在现在的前端圈技能树越点越多的大潮下，单单会写代码的前端或许已经不能算是优秀的前端了。比如我司优秀的前端小姐姐，是自带开场前唱歌暖场技能的👏

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01807.jpg)

趁开场前观察了一下会场，妹子还真不少😏

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01830.jpg)

进入正题。我们迎来了第一个分享，来自新加坡同学的《Responsive Components》。

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01835.jpg)

这个演讲的内容围绕着如何构建编写可扩展的 CSS 而展开。说实话，这恐怕已经不算是一个新颖的议题了。不过由于是全场第一场演讲的缘故，到场的同学们听得都很认真，甚至还有记笔记的：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01856.jpg)

而至于具体内容呢，给我个人留下印象最深刻的一点是——Demo 的排版相当精致呢……内容的画风大概是这样的：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01850.jpg)

如果你已经熟悉了当前前端生态下 CSS 的一套工具链，你可能会觉得这套东西是已经得到过充分讨论，甚至不甚必要的：在今天给一个 button 定义可组合的 small 和 large 之类的类名，我想应该是前端同学的基本技能了吧？另外，也许是受到 「CSS」大会的名称所限，讲师对 Components 的探讨似乎也只是聚焦在 CSS 的层面，这确实很切题，可惜多少会有种一桌佳肴少了点荤菜的遗憾感。可能是时间所限，这个分享跳过了提问环节，我们直接进入了下一位嘉宾勾股所带来的话题。

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01883.jpg)

勾股老师带来的话题是《CSS Houdini 初探》，这是一套正在到来的底层 CSS API。如果说第一个分享像是不痛不痒的前戏，这个分享里信息量的尺度就大了非常多，说刷新了我个人对 Render 这个词的认识也不为过。这里结合个人理解做个简单的二次传（an）播（li），理解不当之处请多多指正。

传统意义上 JS 和 DOM 的绑定是如此紧密，以至于我们可能认为只要掌握了对 DOM 的控制，再配合独立的 CSS，表达力就足够强大了。

> 一见 JavaScript，立刻想到浏览器，立刻想到 DOM，立刻想到 DOM 操作，立刻想到副作用，立刻想到肮脏。
> 
> 前端程序员的想象惟在这一层能如此跃进。
> 
> ——鲁迅

但 DOM 对渲染的控制并非万能。除了 Canvas 外，前端同学在 JS 中几乎没有对渲染内容的像素级控制：譬如，**你能够用 JS 存取页面任意 `(x, y)` 坐标的像素颜色吗？**相信每个想要自动化测试 UI 渲染结果或者实现截图需求的同学，都会明白这个痛点所在。

要想在 JS 中实现对渲染过程更细粒度的控制，除了 `getComputedStyle` 和 `el.style.width = xxx` 这种通过 DOM 隔靴搔痒的操作以外，还有什么更直接的机制呢？

就在去年，主流浏览器已经普遍提供了对 **[CSS 变量](http://www.ruanyifeng.com/blog/2017/05/css-variables.html)**的支持，它允许你在 CSS 中声明形如 `--foo` 和 `--bar` 的**自定义属性**，而后通过 `var()` 函数对变量求值。你可以把这个机制理解成原生的简化版 Less / Sass 变量，但它并不能通过上面的 DOM API 存取。并且，由于 CSS 规则的灵活性，在动画中实时解析它的值是[非常困难](https://stackoverflow.com/questions/38751778/is-it-possible-to-use-css-custom-properties-in-values-for-the-content-property)的。

CSS Houdini 中 Paint API 与 Animation Worklet 的到来，则大大增强了前端对 CSS 动效的控制力：如果你的 CSS 变量是供 background 等支持图片的属性使用的，那么你可以**在 JS 中将 Canvas 作为这个 CSS 属性的值，且相应的 Transition 过程由浏览器自动更新**！

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01869.jpg)

在现场演示了基于这个 API 所实现的类 Material Design 水波按键效果，结合了 Canvas 与 CSS 的实现代码非常简洁。代码的画风大概这样：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01873.jpg)

CSS Houdini 其实是一整套丰富的 API，除了上面提到的 Paint 和 Web Animation 以外，还有更多的能力。例如如果要实现一个「**标题先自适应放大，再粘性吸顶，最后随滚动消失**」的滚动效果，传统上需要使用 JS 实现很细粒度的控制，并且容易带来性能问题。而 CSS Houdini 中提供了一些新的概念，组合起来的强大威力能让我们轻松解决这个问题：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01876.jpg)

Animations 是已经成熟的动画系统，Timeline 可以指定「第几秒做什么」，Keyframe Effects 能够指定「在哪些帧加什么特技」。将它们结合，我们就能得到一个**直接与滚动进度相关的**动画 API 了。这些特性还没有完全落地，为什么这里还要特地提及呢？

实际上我个人在近期正在折腾一个 Web 的视频编辑器，这时如何处理「**会随时间不停改变，且随时可交互**」的 UI 就成了一个不大不小的问题。让我感到最有趣也最惭愧的地方是，我已经实现的 API 和今天才发现的 Timeline + Keyframe 的一套非常接近，目标都是最后能够通过形如 `play(0.5)` 或 `stop(0.2)` 的方式支持**从 Timeline 的任意进度启停交互**。这虽然验证了目前实现的方向基本靠谱，但惭愧的是今天才知道又双叒叕重复发明轮子了……

最后展望未来，三驾马车的进化：

* **HTML** → Web Components
* **JS** → Web Assembly
* **CSS** → **CSS Houdini**

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01880.jpg)

值得一提的是，最后的最后有个挺有趣的 One More Thing，希望下次 CSS Conf 能见到实体👇（下图中还出现了贺老，这个也算 One More Thing 吗）

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01881.jpg)

在勾股之后是顾轶灵男神的分享《可复用组件的 CSS 接口设计》，<del>为什么见到真人会有种女装一定更可爱的想法</del>：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01888.jpg)

这个话题从上古时期样式的规范说起，重温了一遍 CSS 的演化历程。例如下面这个 Netscape 最终胎死腹中的提案，是不是有种 React 穿越 20 年的感觉：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01889.jpg)

接下来的内容则主要围绕着组件库设计时在样式方案上的取舍展开了。和 Vue 里端起一把梭就是 scope 比起来，React 的样式方案确实算是百花齐放。但不论具体的选型有何考量，这个原则是相通的：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01891.jpg)

通过区分内部和外部 API，达到**对扩展开放，对修改封闭**的状态的理念，确实是工程上可行且可靠的实践。但对于 CSS 这个连作用域都没有的语言来说，要区分 public 和 private 总是存在不容易的。从这个角度来考量的话，CSS-in-JS 是一个能够让 CSS 具备更多现代语言特性的好方案，值得投资。而（一直争议很大的）BEM 相比起这些更现代化的方案，则更像是汇编与早期 C 语言中的匈牙利命名法，相当于只有在完全没有作用域机制保护时才需要引入的**约定**，而松散的约定总是很难被遵守的。

男神讲着讲着就介绍到了自有的组件库设计了，这里提到了一个挺漂亮的手法，即通过形如下面所示的数据结构，把组件的公有 API 状态数量限制住。这里插播个广告，要想再运行时校验这样的数据结构的数据又嫌弃 JSON Schema 笨重，不妨了解下我维护过的 [Superstruct](https://github.com/ianstormtaylor/superstruct) 哈😀

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01893.jpg)

上午的三个正式分享结束后，是一个简短的「闪电分享」，分享嘉宾是一位来自头条的大佬。

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01896.jpg)

可惜我由于短暂地离开了现场，回来的时候已经不知道他在讲什么了……问了周围的几个同学也是一脸懵逼😅大致是通过修改浏览器源码的方式实现了比 PWA 更好的 Web 应用支持，还是蛮神奇的。虽然没有太多有印象的内容，不过 PPT 的画风倒是拍下了，大家可以自己体会。（感觉风格也是蛮头条的哈哈）

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01900.jpg)

早上的分享就这样结束了，散场时间蹭了贺老一张合照😅

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01905.jpg)

下午的第一个分享是张鑫旭老师的《Leader，我不想写 CSS》，内容非常清奇，是围绕着「怎么样让 CSS 写起来更爽」而展开的：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01920.jpg)

内容相当简短，除了安利了一波编辑器插件和 snippet 以外，还提到了一个作者自己重新发明的超简洁版 Qcss 语法。它有个骚操作是通过 Service Worker 在浏览器端 parse 样式，从而达到近 50% 样式表体积的缩减。这个挺有意思，就是当时太急了有两个槽想吐……

* 如果一个页面减少 50% 的 CSS 体积对性能有影响，那么以这个页面布局的复杂度之高，估计在静态资源和业务逻辑上还会有更大的性能瓶颈可以优化吧🤔
* 为什么对推荐 Less over Sass 的理由是「Less 的语法可以少写小括号」呀……我大 Stylus 疯起来连花括号、分号和冒号都可以不写呢😅

请不要在意我的吐槽，毕竟大佬的分享气氛还是非常活跃的，全程其实都是这个其乐融融的画风：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01917.jpg)

接下来是大漠老师的分享《探索动效开发模式》了。提到动效虽然大家首先想到的是 CSS 的实现方式，但大漠老师分享的格局显然不仅限于此，比想象的高屋建瓴得多：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01934.jpg)

分享中非常强调动效开发的设计工具支持、素材管理、数据驱动等概念，最后的效果是让前端同学无需编码或仅仅编码业务逻辑（而非动效本身），就能实现设计同学的想法。这背后的工具链相当长：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01933.jpg)

首先需要支持 AE 和 Dragon Bone 等上游编辑工具的格式，这方面虽然 Airbnb 的 Bodymovin 相当给力，但仍然有不少自己填坑的地方。而前端的渲染部分坑也比我想象的大不少：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01931.jpg)

看到图以后有些庆幸自己没真正开始填一个从 Shader 开始往上写的 Renderer 坑，果然还是太年轻啊。

接下来到了茶歇时间，提问大漠老师边上的粉丝貌似也是最多的：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01965.jpg)

我也刚好趁这个时候蹭了一波热度，请教了大佬关于 CSS 作用域支持的一些问题。刚好这个问题和 Web Component 和 Vue 都有些渊源，迟了一波大佬们热情的解（an）答（li）。好吧我只是来顺便蹭图的（

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01967.jpg)

蹭完图以后发现作为前端会议，主办方非常政治正确啊：

* 挂绿色（Vue）的带子是讲师。
* 挂蓝色（React）的带子是我等吃瓜群众。
* 挂红色（Angular）的带子是打杂的工作人员。

hmmmm……

扯完回到会场，发现我好像错过了鹅厂小哥的 CSS 黑科技分享……补个图大家感受下吧。现场 coding 用一个 div 画出的水波纹特效还是挺有趣的😀

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01969.jpg)

然后是一丝姐姐，欸没看到女装生气不听了（其实气氛特别活跃，提问的同学特别多）。可惜是我自己对移动端了解比较浅，提不出什么有意义的问题……

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01975.jpg)

最后的分享是来自我司（欢乐逛）城管大队长的 CSS 黑魔法分享😏

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01978.jpg)

其实我的 CSS 水平基本只有 flex 搭积木的程度而已，城管抛出来的一个个「奇技淫巧」我很多基本没有听说过，一系列的黑魔法让我充分认识到我在团队里的菜鸡水平 XD

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC02013.jpg)

和之前讲解 CSS 特效偏向 Demo 化分享思路不同，城管的介绍更侧重在实际项目里使用 CSS 技巧所解决的问题。毕竟要有了实际的案例背书，我们才会更「安心」地把这些技巧落地到项目中去。这个编辑器项目本身已经产品化了，大家可以[戳这里](https://www.gaoding.com/)感受一下。

另一个很有意思的地方是这张 CSS Zen Garden 的图。

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC02026.jpg)

CSS Zen Garden 应当是更符合 Web 承载文档的初心的。在现在这个 Web 应用兴起的时代，Zen Garden 似乎已经逐渐被遗忘了啊……怀念大学图书馆上印刷精美的《CSS Zen Garden》，也算是我前端的启蒙读物之一吧。

到这里为止 CSS 大会的分享就告一段落了。作为一个小小的总结，我个人的感想是 CSS 确实已经相当成熟了，而且纯 CSS 领域的圈子并不大，以至于许多演讲者所分享的技巧都会出现或多或少的重叠。并且，CSS 的初心应当是一门用于排版的 DSL，只是它的功能历经多年的演化已经非常繁多，这才出现了各种令人眼花缭乱的黑魔法。但由于它一开始的设计目标所限，找出某个冷门属性 hack 出一个神奇效果固然很爽，但你并不能保证下次还能找到类似的神奇属性来满足无尽的交互需求：这多少让前端缺乏了一点安全感啊。

好在我们在这届大会上看到了 CSS Houdini 一类这样在传统的声明式样式之外，为渲染过程引入更多定制性的努力。以前寻找黑魔法属性的过程，有些像寻找微分方程的**特解**，而更强的表达力与更完善的工具链则像是寻找出具有普适性的**通解**。如果我们能为各种复杂的特效找到通用的开发模式，相信 Web 上能承载的内容还能更加惊艳🌈

最后是我司（欢乐逛）的小伙伴合影，硬广就不多打了，感兴趣的同学戳这篇[在海边写代码](https://juejin.im/post/5a2651d06fb9a0451c3a40ad)即可😀

![](http://7u2gqx.com1.z0.glb.clouddn.com/hlg.jpg)

One More Thing，其实你或许已经发现了，前端圈的技术会议大概已经不是过来单纯听人讲 PPT 的了，沟（shang）通（ye）交（hu）流（chui）才是正经事：

![](http://7u2gqx.com1.z0.glb.clouddn.com/css-conf-DSC01953.jpg)

> 「我是用着你的 [font-spider](https://github.com/aui/font-spider) 长大的啊」
> 
> 「我是看着你的[博客](http://www.zhangxinxu.com/)长大的啊」

😅
