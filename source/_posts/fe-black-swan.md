categories: Note

tags:

- Summary

date: 2017-12-13

toc: true

title: 浏览器里的黑天鹅：不可预知的前端变革点
---

『黑天鹅』是这样的事件：难以预测、冲击性大，并且能马后炮地事后分析。少数的黑天鹅事件几乎能解释这个世界上发生的所有事情。难道前端领域的演化也不是循序渐进，而是黑天鹅式的吗？让我们换一种角度回顾一下历史吧…

<!--more-->

## 不可预知的黑天鹅
> 审视一下你周围的环境，回顾自你出生以来周围发生的重大事件、技术变革和发明，把它们与人们此前关于它们的预期相比较，然后看一下它们中有多少是在预料之中的？看看你自己的生活，你的职业选择、你与配偶的邂逅、你被迫离开故土、你面临的背叛、你突然的致富或潦倒，这些事有多少是按照计划发生的？
> 
> ——《黑天鹅》

许多史书、传记都以一种决定论的视角来阐述历史演化的必然性，但实际上对于生存在当时的芸芸众生而言，历史上的巨大变革点往往在某个平凡的日子里突然地发生，没有一点点防备也没有一丝顾虑。比如，当年一位准备离休当教授的江南老人，怎么就突然去了北京呢？

> 我的这个经历就是到了上海，到了 89 年的年初的时候，我在想我估计是快要离休了，我想我应该去当教授……我绝对不知道，我作为一个上海市委书记怎么把我选到北京去了。
> 
> ——👓

技术的发展同样存在着高度的跳跃性和不确定性。在几年甚至几十年一遇的时间节点上，会诞生出全新的技术，然后才是一段段的平稳增长。并且，新技术的诞生往往并不像 iPhone 发布会那样具备强烈的仪式感，而可能只是在平淡乃至质疑中揭开自己的面纱。下面，我们会把视野进一步聚焦到浏览器里，来看看前端领域中几个我们今天再熟悉不过的技术是怎么诞生的，在当时又引起了什么反响呢？

## 仓促降生的 JavaScript
90 年代中期是个神奇的时间段。在电影工业界，1994 年诞生的三部经典影片《肖申克的救赎》、《这个杀手不太冷》到《阿甘正传》长期在豆瓣电影 Top 250 中位列前十。而到了 1995 年，三门新生的编程语言在今天更是牢牢占据 TIBOE 编程语言排行榜中的前十，它们是 Java、PHP 和 JavaScript。

如果说 Java 表达了肖申克监狱的沉重，PHP 暗示了杀手里昂的危险，那么 JavaScript 在诞生之初或许体谅了阿甘的智商…多年后 JS 之父 Brendan Eich 在接受采访时，是这么表达设计 JS 的初心的：

> 我们准备向使用图片、插件和 Java applet 等组件构建 Web 内容的 Web 设计师和**兼职程序员**提供一种『胶水语言』。我们把 Java 当做**高薪程序员**使用的『组件语言』，而**胶水程序员**——即网页设计师们——就可以通过一门脚本语言来组装组件并将交互自动化了。

所以，在 JS **作者本人**看来，他所期望的前端工程师不过是『兼职程序员』和『胶水程序员』（原文 part time programmer / glue programmer）而已，这多少有些一语成谶的味道。为了让实现这门语言的提议获得 Netscape 管理层的认可，他在 1995 年 5 月，花了**十天**实现了一个原型。请注意这个时间节点，因为区区三个月后，Netscape 就以创造 IPO 记录的姿态上市了。

在公司高速发展的历史背景下，JS 的很多方面都有赶工的痕迹。在访谈中被问及语言发展过程中最头痛的问题时，Brendan 也承认了这一点：

> （最棘手的问题）主要是概念验证的时间不可思议的短，并且在这之后语言设计就必须冻结了。包括实现内建对象在内，我开发解释器的时间是大概十天。

如果 Brendan 知道这些匆匆冻结的基础设计会在接下来的 20 多年里影响百万级的开发者和十亿级的用户的话，也许他会说服管理层多给他一点时间吧……这么短的设计时间导致这门语言的基础设计中存在着一堆历史原因留下的技术债，比如语言里居然并存了 `undefined` 和 `null` 两种表示『值不存在』的概念：

JavaScript 在设计时应用了 Java 将值区分为『原始值』和『对象』的做法。它也使用了 Java 表达『不是对象』的值，即 `null`。而根据 C（而不是 Java）的先例，`null` 在转换到数值的时候会成为 0：

``` js
> Number(null)
0
> 5 + null
5
```

而 JavaScript 的第一个版本是没有异常处理的。这样一来，一些未定义的变量和缺失的属性就需要通过一个值来表示。`null` 本来很适合这个场景，但 Brendan 还想要满足下面两个条件：

* 这个值不应该有对应到引用类型的含义，因为它不仅仅是对象。
* 这个值不应该转换到 0，因为这样会使得错误更加难以发现。

结果，Brendan 加上了 `undefined` 这个概念来表达另一种形式下的『值不存在』。它会转换成 `NaN`：

``` js
> Number(undefined)
NaN
> 5 + undefined
NaN
```

这就是 JS 中别 (chou) 具 (ming) 一 (zhao) 格 (zhu) 的 `undefined` 的由来了。这个特性在很多年来给很多开发者带来了很大的痛苦。比如，一个 bug 在真正产生的那一行常常不会直接报错，而是会产生一个 `undefined` 被解释器接收。然后过了很久，在另一个地方会产生一个莫名其妙的报错，告诉你 `undefined` 下不存在某某属性，但其实错误根本不在这一行，而是在很早之前就发生了！这个特性放在今天来看绝对入不了 PL 界的法眼，不过只给你十天的话，你真的不会选择这个更容易实现的设计吗？

当然了，没有任何一门语言生来就是完美的。然而在浏览器这个对前向兼容有着极其严苛要求的领域，想做出任何语言特性上的 Breaking Change 都是非常困难的。像下面这个问题就已经是一个 feature 而不是 bug 了：

``` js
var obj = {}
typeof obj // 'object'
typeof null // 'object'

obj instanceof Object // true
null instanceof Object // false
```

作为总结，现在我们有这些证据来直接或间接地证明 JavaScript 是一个仓促实现的产物：

* 设计目标定位低端码农。
* 金主处于粗放增长阶段。
* 原型迭代花费时间极短。
* 许多基础特性实现潦草。

在互联网这个连接超过 30 亿人的巨大系统里，应用层的唯一编程语言却是一个充满设计缺陷的赶工作品，实在是一件匪夷所思的事情——这也很好地体现了黑天鹅事件突然发生而影响深远的特点。当然，Web 的重要性催生了无数后来者持续的创新，下面我们会挑选出这些创新中最广为人知的几项，来印证它们的黑天鹅性质。

## 面基现场的 jQuery
十二年前那个白色相簿的季节，如果你有幸在纽约参加了一场 BarCamp 线下交流会，你能想象到台上这个叫做 John Resig 的小伙子安利的，连文档都还没写完的新轮子会在全世界超过 70% 的网页里运行吗？

BarCamp 是一种由参与者相互分享的工作坊式会议，其议程内容由参加者提供，主题通常与互联网、编程、开源相关。换句话说，这是一种小规模的技术交流会。BarCamp 会举办很多次，由很多演讲者来分享很多不同的主题，以 jQuery 的影响力而言，它可能是这类活动中诞生的轮子里最著名的 Big Thing 了。不过，红极一时的 jQuery 在发布时，甚至只是作者本人的几个分享主题中的一个而已。根据 John Resig 自己的陈述，在那场 BarCamp 中他也没分享什么别的，大概三件事：

* 讲了一个叫做 ideaShurb 的实时协作应用 Demo。
* 讲了一个叫做 Feed Pile 的新网站产品，用来汇聚熟人的信息流。
* 讲了一个叫做 jQuery 的新轮子，可以改进用 JS 控制 HTML 的方式。

如果说还有一点什么成绩，就是额外讲了一个对社交网络思考的 PPT，还有提出了一个付费社交的 idea 也是很大的。不过最主要的就是这三件事。

在当时，编写 JavaScript 意味着不停地在兼容性上踩坑：你需要支持 IE6 和 Firefox，而谷人希的 Chrome 五年后才发布。jQuery 很快受到了<del>胶水程序员</del>前端开发者们的普遍喜爱，到今天来自近 300 人的超过 6000 个 commit 记录证明了它的火热程度。jQuery 还建立了基金会，有许多志愿者继续维护。

从 jQuery 的例子里我们能够看到，一个变革性技术的起点可以有多么小。jQuery 并不是某个公司或组织推进的项目，作者本人在当时更没有 all-in 开发（John Resig 本人还是一位创业者和浮世绘研究者，在基金会成立后基本上退出了项目的维护）。而回到今天，现在我们还有谁知道 ideaShurb 和 Feed Pile 呢？我们非常有理由相信，作者本人一定希望他分享的这三个项目都能做起来，然而最后留下来乃至改变上百万人工作方式的，只有 jQuery 这一个。在今天，有许多文章有着『当时的 Web 面临着兼容性问题，所以 jQuery 的出现是历史的必然』这样的观点。不过只要你了解了它的诞生过程，就会发现黑天鹅的偶然性和不确定性才是这些项目中唯一的共性。

在这一节的最后，让我们怀念一下当时的 jQuery 首页吧。那时候天还是蓝的，水还是绿的，北京的房价还只要 8000 一平……

![jquery-debut](/images/jquery-debut.png)

## 饱受质疑的 React
> 当我们开源 React 的时候，最早收到的反应是有疑问的。

在 React 开源一周年之际，其官方博客上轻描淡写的一句话背后，是其诞生之初社区普遍性的质疑。让我们看看 Reddit 上的人们最早对于 React 开源的消息是如何回应的吧：

> 读了他们的文档，我都根本不知道最简单的示例是想干嘛。
> 
> 只有我觉得这个看起来又乱又笨重吗（还有个新语法要学）？这个比起 Angular 来有什么好处吗？
> 
>  > Facebook 的库能给 Facebook 用，不代表它适合其他人。
> 
> 卧槽好吓人，为什么会想在代码里加 *更多的* 标记呢？
> 
> 有那么一秒钟我在想今天是不是 4 月 1 号。它破坏了太多约定了，注定拉仇恨。我欢迎多样性，不过这个看起来肯定不好。
> 
> 把 HTML、XML 和 JavaScript 混在一起的做法让我感觉回到了 JSP 的年代。当你在一个文件里存在五种语言和语法的时候，判断光标位置是哪种语言都是一个 NP 难的问题。算了吧，除非真有啥区别，要不然我还是用 Angular。
> 
> HTML 混在 JavaScript 里？不了谢谢。
> 
> 看起来花了十个亿啊。
> 
> 丑。

Reddit 上最热门的几十条评论中，几乎有 90% 以上都是负面意见。有意思的是，刚好在这一年，知乎上对阿里云王坚博士的评价也是一边倒的差评。

在公开的资料中我们能知道的是，React 最早是 JS 版的 XHP（这是一种 Facebook 的 PHP 方言），由于 XHP 和客户端 JS 代码混编的不便，一名工程师向经理申请到了六个月时间来把它完全迁移到 JavaScript 上。时至今日，它已经有了几万个 `react-xxx` 周边插件、近万 commit 和上千贡献者，是前端社区中的超级巨星。

React 代表的就是另一种类型的技术创新了。它的确打破了很多『最佳实践』和思维定式，也带来了非常多的争议，但它背后的理念和范式的确引领了前端社区的一轮技术进步。在这个例子中最有意思的地方在于，一个 2013 年的<del>胶水程序员</del>前端开发者初次接触它的时候，90% 以上的第一印象是『这 TM 什么玩意』，没错，那时的主流民意也觉得比特币太贵了…**在预测未来的能力上，我们经常错得离谱却还自以为是**。

关于 React，最后还有一个细节很值得一提：它是本文中唯一一个没有明确作者的轮子。我们都知道 React 是 Facebook 公司的产物，但那个申请到六个月时间造轮子的工程师是谁呢？React 的所有新消息都是通过 Facebook 官方博客发布的、源码里的 `AUTHORS` 是字母排序的、`react-basic` 的初始设计文档也没有作者的提交记录…我们最后还是找到了这位大牛 Jordan W 的 [Github](https://github.com/jordwalke)，不过和 React 团队里群星璀璨的网红们比起来，他却连照片都不放一张…结合国内前端社区关于 Vue 和 Angular 的大撕逼与 React 的争议性，我们似乎可以理解作者隐姓埋名的苦衷了…

## 生逢其时的 Vue
上文的介绍的这些轮子，都有着自己牛逼闪闪的地方：JavaScript 使得浏览器中的富交互行为成为可能、jQuery 发明的 DSL 大大简化了 DOM 操作、React 的编程范式颠覆了开发者的思维模式…而到了 Vue 这里，我们却很难找到一个『好用』之外，它在技术上的颠覆性闪光点。不过，既然它的热度在国内已经盖过 React，它也定然有自己的独特之处。

和 React 相比，Vue 的亮相可以说是默默无闻了。在 Hacker News 上，作者 Evan You [初次发布 Vue](https://news.ycombinator.com/item?id=7169288) 的帖子获得了 54 点数和 26 条评论。作为对比，React 连换个许可协议都获得了 2280 点数和 498 条评论。

虽然初次发布时话题性没有 React 那么强，但是 Vue 的传播和口碑却相当的好，在发布后的第一周内就获得了 2w+ 的官网浏览量和 600+ star。三年以后的今天，它已经几乎成为中国开发者业务开发的首选框架了。Vue 兴起的过程已经老生常谈，在此按下不表。在这一节里，我们希望思考的问题是：为什么就在近期，有大量的前端开发者转向 Vue 呢？为什么 Angular / Avalon / Knockout 这些类似的 MVVM 框架没有形成这样的星火燎原之势呢？

从技术角度上，笔者能够想到几个『合理』的理由：

* 转向 Vue 时国内已经可以普遍抛弃 IE8，而 Vue 的实现原理恰好最低支持 IE9。
* Angular 1 性能不好，而 Angular 2 的 API 变更非常大。
* React 的 JSX 长期被视为异端，全家桶不好配，中文化支持也没有 Vue 好。
* Knockout 和 Avalon 缺乏现代的工程化支持，维护乏力。
* ……

所以这些理由有道理吗？它们不过都是纯粹的马后炮而已！这些理由都不过是我们基于『Vue 非常火』的现实，去正当化『Vue 为什么能火』的合理性而已。毫无疑问，Vue 的框架设计是第一流的，不过，Vue 的普及程度是某些大厂内部框架的几十倍，是否意味着它的代码质量就比这些同时期的框架好上这么多倍呢？我们没法量化比较这一点。不过，这里有一个例子可以作为类比：

如果你是个音乐爱好者，那么在没有唱片的时候，你可能会花钱到本地的剧院花 100 刀听本地小乐团的音乐会。而在唱片流行后，你可以只花 10 刀就能听到世界第一乐团的音乐，这时候你去本地小乐团的音乐会的意愿还会一样强吗？对于信息资源，存在着非常强的马太效应，而开源也在编程领域大大加强了这种效应。类比到前端领域里，种种 React 和 Vue 等框架的替代品有多少真正应用到了生产环境呢？黑天鹅的巨大影响力很大程度上来源于这种『赢家通吃』的集聚效应，而 Vue 则是这个领域中不可多得的胜利者。

到这里为止，我们已经看到了浏览器领域里几个关键技术的诞生，和我们的想象之间所存在的不同：JavaScript 实现得非常草率、jQuery 只是个微小的业余项目、React 诞生之初饱受质疑、Vue 的设计并没有多少颠覆性…然而它们已经不会被历史遗忘了。所以下一个变革点在哪呢？如果黑天鹅能够被预测，那它就不是黑天鹅了。

## 后记
> 人呐就都不知道，自己就不可以预料。一个人的命运啊，当然要靠自我奋斗，但是也要考虑到历史的行程。

行文至此，笔者有了一些额外的想法：文中涉及的开发者毫无疑问都是社区中的精英，但做出巨大贡献的他们，在技术水平上就一定是最优秀的吗？个人愿意相信，在百万级的开发者中，必然还存在着许多低调的大牛们，他们的项目所需工作之艰深，所遇到的挑战之困难不会亚于上面的任何一个项目。不过，黑天鹅只有那么几只，聚光灯的范围也只有那么一点，对于绝大多数勤勤恳恳的开发者，黑天鹅的机会都是可遇而不可求的。

所以我们该有怎么样的态度来面对技术演化的黑天鹅性质呢？玉伯 dalao 的签名非常有借鉴意义：『因上努力，果上随缘』。达到开发明星项目水平的同学有很多，但革命性的项目有太多不确定性，我们能做的也就是踏实地去学习和进步，然后耐心地等待吧。换句话说，这就是所谓的『且行好事，莫问前程』了。当然了，请不要把这个态度和胶水程序员们心安理得地编写增查改删的业务逻辑混为一谈哦 🙂

鉴于作者对前端的了解有限，因此本文只涉及了几个前端领域中老生常谈的例子而已。如果大家有勘误或更好的想法，欢迎在 [Github](https://github.com/doodlewind/blog-src) 或评论中提出，谢谢。


## References

* [How JavaScript Was Created](http://speakingjs.com/es5/ch04.html)
* [The A-Z of Programming Languages: JavaScript](https://www.computerworld.com.au/article/255293/a-z_programming_languages_javascript/)
* [A Brief History of JavaScript](https://brendaneich.com/2010/07/a-brief-history-of-javascript/)
* [The History of undefined and null](http://speakingjs.com/es5/ch08.html#_the_history_of_undefined_and_null)
* [JavaScript’s History and How it Led To ReactJS](https://thenewstack.io/javascripts-history-and-how-it-led-to-reactjs/)
* [Popularity - Brendan Eich](https://brendaneich.com/2008/04/popularity/)
* [BarCampNYC Wrap-up](https://johnresig.com/blog/barcampnyc-wrap-up/)
* [History break: How did John build jQuery?](https://www.khanacademy.org/computing/computer-programming/html-js-jquery/jquery-dom-access/a/history-of-jquery)
* [The most popular JavaScript library, jQuery, is now 10 years old](https://thenextweb.com/dd/2016/01/14/the-most-popular-javascript-library-jquery-is-now-10-years-old/)
* [One Year of Open-Source React](https://reactjs.org/blog/2014/05/29/one-year-of-open-source-react.html)
* [React: Facebook's latest Javascript client library, now open sourced](https://www.reddit.com/r/programming/comments/1fak87/react_facebooks_latest_javascript_client_library/)
* [Relicensing React, Jest, Flow, and Immutable.js](https://news.ycombinator.com/item?id=15316175)
* [Vue.js: JavaScript MVVM made simple](https://news.ycombinator.com/item?id=7169288)
* [First Week of Launching Vue.js](http://blog.evanyou.me/2014/02/11/first-week-of-launching-an-oss-project/)
* [Evan You](https://betweenthewires.org/2016/11/03/evan-you/)
* [Internet Trends](http://www.kpcb.com/internet-trends)
