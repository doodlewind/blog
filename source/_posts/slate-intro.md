categories: Note

tags:

- Web
- Pattern
- React

date: 2017-10-17

toc: true

title: Slate.js - 革命性的富文本编辑框架
---

相信很多同学即便没有接触过富文本编辑领域，也一定听说过【富文本编辑是天坑，千万不要碰】的说法——是的，富文本编辑是天坑，除非你选择了 [Slate](docs.slatejs.org)。下面会介绍富文本编辑的复杂度所在，以及 Slate 的解决方式。

<!--more-->

## 背景
富文本编辑领域和常规的前端开发相比，有个非常微妙的区别：在这个领域里，最流行的解决方案往往是相当【重】的。为什么在一贯推崇【越轻越好】的前端社区，轻量级的编辑器没有成为主流呢？这要从编辑器的实现原理说起。

在浏览器中，实现富文本编辑的原理大致可分为下面这三种：

1. 在 `<textarea>` 上定位各种样式。这是 Facebook 早期评论系统所使用的。
2. 实现自己的布局引擎，连闪烁的光标都是通过 `<div>` 控制的。这是 Google Docs 所使用的。
3. 使用浏览器原生的 ContentEditable 编辑模式。这是绝大多数现有富文本编辑器所使用的。

三种方案中，第一种连加粗、斜体等操作都很难支持，已经基本弃用；第二种的工作量非常巨大，只有谷歌、微软这样能够自己造浏览器的巨头才能玩得好；对于最后一种，如果你不了解 `contenteditable`，你可以打开任意一个网站，在它的 `<body>` 标签里加上这个属性，然后看看它是怎样变身为一个华丽的编辑器的😀看起来这个方式比前两种都要靠谱许多，浏览器已经替你处理好了快捷键、撤销栈、光标、输入法、兼容性…很体贴啊！

### ContentEditable 之殇
> 她那时候还太年轻，不知道所有命运赠予的礼物，早已在暗中标好了价格。
> 
> ——茨威格《断头王后》

天下没有免费的午餐，ContentEditable 也不例外。Medium Editor 的作者写过一篇文章，介绍了 [ContentEditable 的可怕之处](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480)。文中的批评可以归结为一句话，即 ContentEditable 的数据结构和行为**缺乏一致性**。

比如，对一句【喜迎**十九大**】，下面的几种 HTML 表示是完全等效的：

``` html
<!--正常-->
<p>喜迎<b>十九大</b></p>
<!--分离的 b 标签-->
<p>喜迎<b>十</b><b>九大</b></p>
<!--嵌套的 b 标签-->
<p>喜迎<b><b>十九大</b></b></p>
<!--空的 b 标签-->
<p>喜迎<b>十</b><b></b><b>九大</b></p>
<!--span 代替 b 标签-->
<p>喜迎<span style="font-weight: bold">十九大</span></p> 
```

它们虽然看上去一样，但对它们的编辑行为会产生显著的区别。而在使用 ContentEditable 时，**浏览器经常会自动插入这些垃圾标签**。

再比如，对于一句【喜迎十九大】，一次简单的换行操作可能产生这样的结果：

``` html
<p>喜迎<br/>十九大</p> <!--插入 br 标签-->
<p>喜迎</p></p>十九大</p> <!--分割 p 标签-->
```

不同浏览器哪怕对于简单的换行操作，其行为也是存在各种分歧的。这样一来，在 Chrome 中编辑的文档，在 Firefox 中打开继续编辑后，就很有可能出现 bug，而这些 bug 并不是简单的样式问题，**而是会破坏数据结构的恶性 bug**。

社区中有不少所谓的【超轻量级编辑器】，它们几乎就只是 ContentEditable 加了一层美化的壳。这种编辑器基本完全依赖浏览器的原生行为，不会顾及 ContentEditable 对数据结构的破坏，基于它们去实现高级的编辑功能是十分困难的。如果抱着【轻量的东西更漂亮】的思路选择它们，决定前请务必三思。

### 是应用，是类库，还是框架？
另一个在富文本编辑领域较为尴尬的问题，是编辑器的定位。一般而言，前端领域接触的各种项目，不外乎以下三种：

#### 应用 Application
应用泛指包含了界面和交互逻辑的项目，比如各种管理后台系统。

#### 类库 Library
类库提供 API 供用户调用来开发应用，但**并不影响应用的代码架构**，比如 jQuery 和 React：

> jQuery: The Write Less, Do More, JavaScript **Library**
> 
> React is a JavaScript **library** for building user interfaces.

也许不少同学对 React 有【全家桶】的偏见，在这里再强调一遍，**React 本身仅仅是个视图层**，需要和许多类库结合，才能用于开发应用。

#### 框架 Framework
框架同样提供 API，但它对应用代码有很强的侵入性，需要用户按照框架的方式，**提供代码供框架运行**。Vue 和 Angular 都是典型的框架：

> Vue.js - The Progressive
JavaScript **Framework**
> 
> AngularJS — Superheroic JavaScript MVW **Framework**

那么，富文本编辑器属于上面的哪一种呢？每个编辑器项目都会说自己的定位是 Editor，但 Editor 是应用、是类库、还是框架呢？许多主打【开箱即用】的编辑器，已经集成了许多样式和交互逻辑，实际上**已经是一个应用了**。

这里的问题在于，**应用的定制性是最差的**。因而，在需要定制不同的编辑体验时，许多【开箱即用】的编辑器很难通过简单的配置来满足需求。这时，往往需要使用各种奇技淫巧，或再学习一套编辑器自身笨拙的插件机制。

Vue 和 Angular 这样的框架，在易用性上是有口皆碑的。那么，富文本编辑领域，有没有这样的框架呢？有的，并且 Slate 还不是第一个。对编辑器有所了解的同学可能知道，Facebook 出品的 [Draft.js](https://draftjs.org) 就是一个这样的编辑框架，能让你使用 React 技术栈定制自己的编辑器。既然 Draft.js 已经非常出色，那么 Slate 与之相比，有什么创新之处呢？而对于上文中 ContentEditable 的各种问题，Slate 又是如何解决的呢？让我们来看看吧。

## 介绍 Slate
Slate 并非一个编辑器应用，而是一套在 React 和 Immutable 的坚实基础上，用于操作富文本数据的强大框架。**基于 Slate 实现一个富文本编辑器，只相当于使用 React（视图层）+ Immutable（数据层）开发一个普通 Web 应用。**下图中展示了一个基于 Slate 实现的编辑器架构，数据的流动非常简单易懂：

![editor-arch](http://7u2gqx.com1.z0.glb.clouddn.com/citadel-editor.jpg)

图中，左侧视图层的 Toolbar 工具栏和 Editor 内的各种 Node 都是纯粹的 React 组件，右侧的模型层则大量应用了 Slate 所提供的支持。下面，我们简单介绍一下这个架构中的几个关键角色。

### Immutable，迄今最理想的数据结构
我们知道，JS 对象的属性是可以随意赋值的，也就是 mutable 可变的。而相对地，不可变的数据类型不允许随意赋值，每次通过 Immutable API 的修改，都会生成一个新的引用。

看起来这并不算什么，和每次修改都全量复制一份数据比起来并没有什么区别。但 Immutable 的强大之处，在于**不同引用之间，相同的部分是完全共享的**。这也就意味着，对一棵基于 Immutable 的复杂文档树，**即便只改变了某一片叶子节点，也会生成一棵新树，但这棵新树除了那一片叶子节点外，所有内容都是和原有的树共享的**。

这和富文本编辑有什么关系呢？我们知道，编辑器的【撤销】其实是一个难度非常大的功能，许多定制了撤销功能的编辑器，很容易出现撤销前后的状态不一致的情况。但有了 Immutable 后，每次编辑都会生成一个全新的编辑器状态，只需**简单地在不同状态之间切换，就能轻松地实现撤销和重做操作**。并且，Immutable 也完全支持复杂的嵌套来表达文档的树形结构。可以说，Immutable 天生适合用于实现富文本编辑的模型层。在 Slate 和 Draft.js 中，富文本数据就是对 Immutable 的一层封装，从而自带了对撤销操作的支持，不需额外编码实现。在这方面，Slate 相比 Draft.js 的一个重要加分项是它**支持嵌套的数据结构**，对表格等复杂内容的编辑提供了良好的支持。

### React，迄今最合适的视图层
说到 Immutable 就不能不提 React，目前 [Immutable.js](https://facebook.github.io/immutable-js/) 这个不可变数据的 JS 库就是 Facebook 自己实现的，并且一开始引入 Immutable 的目的也不是为了撤销，而是为了优化 React 应用的性能。可以说，Immutable 和 React 有着天生的默契。

那么，为什么我们需要 React 呢？目前，除了 Slate 和 Draft.js 外几乎所有的编辑器方案，在需要定制编辑节点（如公式、图表等）时，要么需要接触和 DOM 紧密耦合的编辑器插件概念，要么只能使用编辑器内置的功能。这种做法在学习成本和效率上都不是最优的。

设想一下，如果**编辑器中的编辑内容，全部都能以 React 组件的形式（如标题用 Heading 组件，段落用 Paragraph 组件等）来实现**，那么富文本编辑的门槛还会这么高吗？从 Immutable 数据映射到一个个 React 组件，是已经在许多 Web 应用中经历过考验的成熟模式。而在这种架构下，ContentEditable 那些令人望而生畏的问题也能得到很好的解决：只需要为 React 组件增加 `contentEditable` 属性，而后对各种按键、点击等事件 `preventDefault`，由框架决定事件对 Immutable 的变换，最后生成新状态按需触发重绘即可！

这种方案下，实现一个编辑器不再需要精通 DOM 的专家，难度大大降低了。即便像本文作者这样仅仅熟悉 React，对前端只有一年多经验的普通开发者，也有能力开发自己的编辑器了。在此稍微夹带一些私货：

在富文本编辑领域，React + Immutable 这种在全局粒度全量地更改状态，而后按需更新组件的方案，比起 Vue 这样基于依赖追踪细粒度地更新组件的方案，是更有优势的。Vue 直接 mutate 数据的方式在原理上并不利于实现撤销与回退，并且函数式组件 VNode 的 API 也没有 React 这么直观易用（Vue 2.5 有改善，但差距仍然存在）。目前，Vue 社区还没有类似的框架出现，**这个场景也是 React 技术栈相比 Vue 的一个闪亮之处。**

不过，Draft.js 和 Slate 都实现了对 React 的支持。虽然 Slate 定制节点的 API 更方便一些，但这也不是决定性的优势。那么 Slate 的特殊之处又哪呢？

### Slate，迄今最优秀的 Controller
从前面的介绍中，我们看到相当多创新之处都是来自 Draft.js 的。那么，Slate 又有什么独特之处呢？

Draft.js 有 Immutable 作为 Model，有 React 作为 View，但在使用它实现编辑器的过程中，你可能会感觉这比起一般的应用开发来，负担还是有些沉重，或者说少了一点什么东西。嗯，这个东西也许就是你熟悉的 Controller。

即便在前端轮子满天飞的今天，UI 应用的架构 MVC 也不会过时，而是演化为了 MVVM 甚至 M-V-Whatever 的架构。编辑器应用同样是个 UI 应用，**我们同样需要一种机制，将 Model 和 View 连接起来**。

这可能不是 Draft.js 的闪光之处，它的文档变换 API 使用起来比较沉重，并且对 EditorState 的修改存在着较多限制。而 Slate 则提供了更加灵活的概念，来连接 Model 与 View。我们简单介绍一下 Slate 中编辑操作发生时的处理流程：

1. 用户在编辑器光标所在的 Node 内按键，触发事件。
2. 根据按键的键值，分发不同的 Change，如换行、加粗等。
3. Change 修改 State，生成新 State。
4. 新 State 经过 Schema 校验后，渲染到编辑器内，按需更新相应的 Node。

整个流程中最核心的机制可概括为一个公式：`state.change().change()`，Change 是一个非常优雅的 API，所有的变换都是都通过 Change 对象实现的。比如，用户先插入了文本，又删除了另一个段落，这时对文档的变更就可以抽象为：

``` js
state.change().insertText().deleteBlock()
```

每个操作都是链式调用！在协同编辑的场景下，来自不同用户的操作其实也可以归结为这样对 State 的链式调用，这也让基于 Slate 实现协同编辑成为了可能。另一方面，每一个 Change 链式调用中的 API 都可实现为纯函数，而后通过 Slate 的 `call` API 来链式执行，这也让编写自己的 Change 并添加单元测试成为了可能。

这种优雅地处理编辑操作的方式，使得 Slate 能够更简单地将 Model 与 View 连接起来，实现对富文本数据的复杂操作。另外，Slate 支持自定义对状态的 Schema 校验规则，可以添加一些形如【第一个节点必须是 Heading 节点】或者【图片节点必须包含 src 属性】的校验规则，并对异常数据进行过滤。

当然，Slate 中并没有 Controller 的概念，不过实际上，基于 Slate 编写的富文本编辑 Change 操作，和编写传统 MVC 应用中 Controller 逻辑的体验有些接近。换句话说，Slate 把编写复杂操作逻辑的难度，降低到了编写 Change 函数的水平。在这一点上，Slate 的架构是十分易用的。

## 总结
在富文本编辑领域，Slate 是一个后起之秀。不过在推出迄今的短短一年内，它的社区贡献者数量已经和 Draft.js 甚至 Vue 接近，达到了百人级别。并且，它的 Issue 和 PR 处理比 Draft.js 更加及时，作者对新想法也更加开放，迭代更加活跃。

Slate 的许多核心特性是从其他优秀编辑器项目中借鉴的，如其 Immutable 数据层与框架理念来自 Draft.js、Schema 与 Change 概念来自 ProseMirror 等。虽然它的许多闪光点单独看来并非独树一帜，但在宏观层面上做到了博采众长（听起来和 Vue 有些接近？）。目前它还处于快速的迭代中，对有兴趣参与的同学，成为贡献者的机会很多哦 😀

One more thing，本文作者所在的美团点评厦门前端团队完成了对 Slate.js 中文文档的翻译，现已作为官方的中文版本提供。我们也向 Slate 贡献了多个 bugfix 与优化的 PR。我们的团队正在聚焦为 PC 端提供创新的工作体验，非常欢迎感兴趣同学的加入 😉

## Resources
- [Slate 官网](http://slatejs.org/)
- [Slate Github](https://github.com/ianstormtaylor/slate)
- [Slate 中文文档](https://doodlewind.github.io/slate-doc-cn/)
- [本文作者 Github](http://github.com/doodlewind)
