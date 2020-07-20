categories: Note

tags:

- Web

date: 2020-03-23

toc: true

title: 关于《前端随想录》
---

开通专栏以来，我在知乎写了不少前端技术文章。这里对它们做一些系统的整理，并总结一些我对技术写作的理解与认识。

知乎相比传统博客有个问题：缺乏原始意义上的 About Me 页面，不易于其他人知道「这人是谁，做过什么」。虽然你能点进别人主页视奸 Timeline，但这里消息碎片化程度实在太高了。就连回答赞同数排序也未必准确，毕竟自己认真写的干货点赞数比不上随手玩梗的情况，已经再常见不过了。为了在这个日渐浮躁的互联网里好好沉淀一些东西，这篇文章既会成为一个目录，也会成为我自己的 About Me，保持更新并置顶。

作为前端开发者，我的本职工作主要是 Web 生产力应用的研发。这涉及不同层面上的 GUI 应用领域知识，包括富文本编辑、图形编辑、混合应用技术栈、WebGL 渲染、JS 运行时等。此外我也会做一些小型的探索项目，并分享一些技术上的个人见解。这些内容大致可以分为这么几类：**技术教学、动手 Hack、技术评论、个人内省**。

下面列出分类整理后的文章目录。

## 技术教学
这部分主要是对某项前端技术的入门介绍。我比较关心一些相对「小众」的领域，努力保证文章的趣味性。但如果想真正掌握这些技术，那一定是离不开系统性的学习的。要是我的这些文章能起到**一定的启蒙作用**，那就很不错了。

* [从 JS 引擎到 JS 运行时（上）](https://zhuanlan.zhihu.com/p/104333176)
* [从 JS 引擎到 JS 运行时（下）](https://zhuanlan.zhihu.com/p/104501929)
* [实用 WebGL 图像处理入门](https://zhuanlan.zhihu.com/p/100388037)
* [如何设计一个 WebGL 基础库](https://zhuanlan.zhihu.com/p/93500639)
* [从回调地狱到自函子上的幺半群：解密熟悉又陌生的 Monad](https://zhuanlan.zhihu.com/p/32734492)
* [响应式编程入门：实现电梯调度模拟器](https://ewind.us/2017/rx-elevator-demo/)
* [如何无痛降低 if else 面条代码复杂度](https://ewind.us/2017/refactor-if-else/)
* [零起点的开源社区贡献指南](https://ewind.us/2017/novice-open-source/)

## 动手 Hack
这部分主要分享一些我制作新玩具 Demo 或解决具体问题的历程。我选择的题材主要是兴趣导向，并超出个人舒适区的。文章里一般会描述思路和步骤，并提供可以复现的代码库，希望它们能帮助感兴趣的朋友们**接触到一点更大的世界**。

* [将 React 渲染到嵌入式液晶屏](https://zhuanlan.zhihu.com/p/89574235)
* [将前端技术栈移植到掌上游戏机](https://zhuanlan.zhihu.com/p/97851599)
* [Web 魔方模拟器的设计与实现](https://zhuanlan.zhihu.com/p/43049095)
* [用 JavaScript 实现微机模拟器](https://ewind.us/2017/chip8-emu-intro/)
* [让 Chrome 崩溃的一行 CSS 代码](https://zhuanlan.zhihu.com/p/46456752)
* [哦语言：面向真正粉丝的编程语言](https://ewind.us/2017/ove-lang/)
* [基于文本相似度算法，分析 Vue 是抄出来的框架吗？](https://ewind.us/2017/nlp-framework-analysis/)
* [一个拖拽框背后的高中数学](https://zhuanlan.zhihu.com/p/39993937)

## 技术评论
这部分主要是我对一些开放性技术问题的个人观点，也包括一些专栏外的知乎回答。鉴于我的个性，有些文章是存在不小争议的。随着时间推移，我自己的理解和认识都可能更新。所以我相信答案本身未必重要，**重要的是分析思考的过程与方法论**。

这些是专栏的评述类文章：

* [QuickJS 引擎一年见闻录](https://zhuanlan.zhihu.com/p/161722203)
* [一个白学家眼里的 WebAssembly](https://zhuanlan.zhihu.com/p/102692865)
* [反对函数式编程的政治正确](https://zhuanlan.zhihu.com/p/51563817)
* [你也许不需要 devDependencies](https://zhuanlan.zhihu.com/p/79814652)
* [从时间旅行的乌托邦，看状态管理的设计误区](https://zhuanlan.zhihu.com/p/32107541)
* [这个程序员写的免费在线 PS，让他三十岁前财务自由](https://zhuanlan.zhihu.com/p/70636726)
* [别再拿奇技淫巧搬砖了](https://ewind.us/2017/stop-hacky-code/)
* [浅析 React / Vue 跨端渲染原理与实现](https://zhuanlan.zhihu.com/p/46338731)
* [Slate.js - 革命性的富文本编辑框架](https://ewind.us/2017/slate-intro/)
* [小前端眼里的大前端：GMTC 2018 参会小结](https://ewind.us/2018/gmtc-2018/)
* [WWDC 中提到的浏览器 Fingerprinting 有多可怕？](https://zhuanlan.zhihu.com/p/37778645)

这些是与 JS 系语言相关的回答：

* [程序语言都是怎么发明的？](https://www.zhihu.com/question/358636057/answer/917465056)
* [随着 TypeScript 继续普及，会不会出现直接跑 TypeScript 的运行时？](https://www.zhihu.com/question/363807522/answer/961295958)
* [有没有让 JavaScript 在 JS 引擎上稳定、更快运行的 Style Guide?](https://www.zhihu.com/question/402807137/answer/1322391162)
* [JS 中 parseInt("070") 红宝书说是 56，但我试了是 70，这是为什么？](https://www.zhihu.com/question/391828648/answer/1192805566)
* [Node.js 异步在哪里？](https://www.zhihu.com/question/390859209/answer/1185880057)
* [JavaScript 的设计优点是什么？](https://www.zhihu.com/question/21735081/answer/1145823435)
* [TypeScript 解决了什么痛点？](https://www.zhihu.com/question/308844713/answer/594169638)
* [谁能说清楚 JavaScript 的 this 原理？](https://www.zhihu.com/question/353757734/answer/894810451)
* [JSON 可以替代 XML，为什么网页不用 JSON 格式来写呢？](https://www.zhihu.com/question/373946861/answer/1055657116)

这些是与可视化编辑器与前端框架相关的回答：

* [使用 Vue 等框架的首要原因是为了开发效率，还是减少 DOM 操作的性能损失？](https://www.zhihu.com/question/393217673/answer/1213404791)
* [有多大比例的前端工程师，能在合理时间内独立开发出商业级文本编辑器？](https://www.zhihu.com/question/26739121/answer/291059836)
* [如何不借助 contentEditable 实现富文本编辑器？](https://www.zhihu.com/question/366666295/answer/976815981)
* [基于现代的前端框架，为什么没有成熟的支持控件拖拽布局，并可以自动生成前端代码的设计器出现？](https://www.zhihu.com/question/338929219/answer/868491081)
* [我做了一个 HTML 可视化编辑工具，有前途吗？](https://www.zhihu.com/question/390956688/answer/1184696066)
* [Slate.js 编辑器引擎有什么致命缺陷？](https://www.zhihu.com/question/361228704/answer/937791493)

这些是与原生开发及 WASM 相关的回答：

* [WebAssembly 的出现是否会取代 JavaScript？](https://www.zhihu.com/question/322007706/answer/741764049)
* [有哪些效果拔群的 WebAssembly 应用？](https://www.zhihu.com/question/265700379/answer/956235550)
* [如何看待 WebAssembly 这门技术？](https://www.zhihu.com/question/362649730/answer/974395522)
* [现代浏览器生成一个 JS 函数的开销多大？React hooks 的设计频繁生成新函数对性能有影响吗？](https://www.zhihu.com/question/345689944/answer/910417091)
* [如果用 C++20 来写 Python 的 Implementation，会有多少性能提升？](https://www.zhihu.com/question/347217021/answer/849371319)
* [C「带坏了」多少程序语言的设计？](https://www.zhihu.com/question/60526245/answer/976877257)

这些是与 WebGL 及图形学相关的回答：

* [现在作为前端入门，还有必要去学习高难度的 CSS 和 JS 特效吗？](https://www.zhihu.com/question/327977600/answer/728411768)
* [用计算器打 CS，实际上真的可以实现吗？](https://www.zhihu.com/question/329074538/answer/744058270)
* [在 Web 端利用什么技术可以实现酷炫的智慧楼宇大屏界面？](https://www.zhihu.com/question/365938397/answer/972948542)

这些是与其他业界动向相关的回答：

* [前端会有未来吗？](https://www.zhihu.com/question/392501126/answer/1230559612)
* [如何评价 Vue.js 纪录片？](https://www.zhihu.com/question/398425577/answer/1257568131)
* [SpaceX 龙飞船中的新触控交互操作系统，意味着什么？](https://www.zhihu.com/question/396878847/answer/1261374042)
* [如何看待 GitHub 将公共存储库快照保存到北极地下？](https://www.zhihu.com/question/355902523/answer/1345237105)
* [为什么招聘高级前端开发这么难？](https://www.zhihu.com/question/293047616/answer/497191927)
* [如何看待 React 核心成员 Dan Abramov 自曝年薪 13W 美金？](https://www.zhihu.com/question/376297734/answer/1061430385)
* [2020 年前端最火的技术是什么？](https://www.zhihu.com/question/365588457/answer/981337448)
* [已经 2020 年了 Deno 现在怎么样了？](https://www.zhihu.com/question/359684696/answer/940312667)
* [前端的未来是数据可视化 D3 / WebGL 还是 Node.js 还是物联网？](https://www.zhihu.com/question/346595660/answer/828713278)
* [如何看待美团效仿亚马逊，内部汇报拒用 PPT 而改用 Word？](https://www.zhihu.com/question/340219070/answer/1038875031)
* [前端有哪些看上去很简单，但实际上需要极高技术力或是极高成本的细节？](https://www.zhihu.com/question/405803611/answer/1330737007)

最后还有一个《JavaScript 20 年》的翻译系列：

* [《JavaScript 20 年》中文版 (1) 语言诞生](https://zhuanlan.zhihu.com/p/122334333)
* [《JavaScript 20 年》中文版 (2) 创立标准](https://zhuanlan.zhihu.com/p/136340171)
* [《JavaScript 20 年》中文版 (3) 改革遗恨](https://zhuanlan.zhihu.com/p/143476080)

## 个人内省
这部分主要是我对自己技术生涯的阶段性总结与回顾。我觉得评价自己，其实比评价他人要困难和痛苦得多。像「我做技术是为了什么？我的生活又是为了什么？」这种看起来最简单的问题，却往往并没有那么容易回答。

* [2019 与我的自由启蒙](https://zhuanlan.zhihu.com/p/100755932)
* [我不想成为不懂 GUI 的 UI 开发者](https://zhuanlan.zhihu.com/p/88786832)
* [25 岁，毕业写代码的这三年](https://zhuanlan.zhihu.com/p/65532799)
* [从增查改删到贡献开源：我的 2017 年度总结](https://ewind.us/2017/2017-summary/)

以上已经整理了我自己认为值得推荐的分享内容，方便有需要的朋友查阅。下面多说几句，聊聊我写作的动机与立场（觉得矫情的话就不用看下去啦）。

## 闲言碎语
首先，我并不是想通过这些文章证明我的技术有多强。相反地，**如果你在面试里遇到我，那么你很可能惊喜地发现我无法秒答一些老生常谈的题目**，譬如 this 的几种指向与如何翻转红黑树之类——你看这个在知乎沽名钓誉的家伙，水平也不过如此嘛！

我写许多文章的最大动力并不是炫技（当然也不排除有点这个成分），而是希望像我仰慕的许多大牛那样，能把一些「有价值」的东西分享给更多的人。**比起一些早有标准化答案的经典面试题，我可能更感兴趣于解决实际遇到的开放性问题**。当然好的算法题也有分析讨论的价值，毕竟它们都需要高质量的思考过程，这在我眼里都比结果的 error-free 更重要。类似地，相比于文章给出的结论对错，我更看重思考的过程本身。

不得不说，我的生涯发展还是受到了许多前辈的影响。虽然我每天都喜闻乐见地等着知乎彻底完蛋，但其实我就是在知乎刚诞生不久的那个年代来到这里，并开始学编程的。这里有许多我高山仰止的大牛，对我有很多潜移默化的熏陶与帮助。这些年过去后，虽然我仍然无法成为他们，但他们在我眼里已经不再那么遥不可及了。尽管许多人今天已因各种原因离开，但我发现今天它的编程专业话题仍然能保持一定的质量。对于中文技术人来说，这里仍然是比微信公众号更好的平台，我会继续保持活跃——当然，我感兴趣的话题未必仅仅是前端技术，这是我的自由。对于非技术的写作，我会将内容更新到《[前进达瓦里希](https://zhuanlan.zhihu.com/forward-comrades)》专栏，它的第一篇文章《[美剧〈切尔诺贝利〉背后的真相](https://zhuanlan.zhihu.com/p/105529724)》也获得了不错的反响，这让我感到欣慰。毕竟不管是技术还是非技术的写作，背后都有许多共通的方法论。

其实就算知乎彻底完蛋也没关系，我的所有重要文章内容都有备份。对于转载，只需注明出处即可。在极端情况下，我也保留删除全部文章退出知乎的权利。我也在这里提醒每位知乎创作者，**一定不要信任国内平台的数据安全性**，理由就不必多说了。

许多前辈都说「做分享真正受益的是你自己」——某种程度上这说得没错。但如果只有你自己受益，那说明你的分享还可以更好。我写博客的兴趣从 2014 年起培养到了现在，最早的文章和代码都写得很烂，而现在已是今非昔比了。我并不是从小擅长编码的神童型选手，直到大学才开始接触编程。如果说今天有什么成就，靠的也更多是后天的「持续」投入而并非先天的天赋。相信只要持续获得正反馈而慢慢积累，量变总是能带来质变的。

必须重复一遍，**我为我的观点与言论负责，但我不认为我的观点就是正确的**。相反地，我在很多领域的理解与认识都需要持续进步。对我的文章，有不同意见都很欢迎指出，唯一的要求是希望能保证基本的尊重。

我相信，每个人都有权追求自己的人生价值，每个人都能找到自己贡献社会的方式。对目前的我来说这种方式是 Web 前端技术，**但每个人都值得探索属于自己的方式**——「愿中国青年都摆脱冷气，只是向上走，不必听自暴自弃者流的话。能做事的做事，能发声的发声。有一分热，发一分光，就令萤火一般，也可以在黑暗里发一点光，不必等候炬火。」

在今天这个时代，也许我和我的《前端随想录》哪天也会像网络上的无数前例那样，突然销声匿迹于一片不可抗拒的黑暗之中。

但我仍然愿意付出点滴的努力，希望这世界能多少记得我曾经来过。
