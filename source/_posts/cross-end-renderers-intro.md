categories: Note

tags:

- Web

date: 2018-10-09

toc: true

title: 浅析 React / Vue 跨端渲染原理与实现
---

当下的前端同学对 React 与 Vue 的组件化开发想必不会陌生，RN 与 Weex 的跨界也常为我们所津津乐道。UI 框架在实现这样的跨端渲染时需要做哪些工作，其技术方案能否借鉴乃至应用到我们自己的项目中呢？这就是本文所希望分享的主题。

<!--more-->

## 概念简介
什么是跨端渲染呢？这里的「端」其实并不局限在传统的 PC 端和移动端，而是抽象的**渲染层 (Renderer)**。渲染层并不局限在浏览器 DOM 和移动端的原生 UI 控件，连静态文件乃至虚拟现实等环境，都可以是你的渲染层。这并不只是个美好的愿景，在 8102 年的今天，除了 React 社区到  `.docx` / `.pdf` 的渲染层以外，Facebook 甚至还基于 Three.js 实现了到 VR 的渲染层，即 ReactVR。现在回顾 React 的 **Learn Once, Write Anywhere** 口号，实际上强调的就是它对各种不同渲染层的支持：

![custom-renderers-1](/images/custom-renderers/1.png)

为什么不直接使用渲染层的 API 呢？跨端开发的一个痛点，就在于各种不同渲染层的学习、使用与维护成本。而不管是 React 的 JSX 还是 Vue 的 `.vue` 单文件组件，都能有效地解耦 UI 组件，提高开发效率与代码维护性。从而很自然地，我们就会希望使用这样的组件化方式来实现我们对渲染层的控制了。

在开始介绍如何为 React / Vue 适配不同渲染层之前，我们不妨回顾一下它们在老本行 DOM 中执行时的基本层次结构。比如我们都知道，在浏览器中使用 React 时，我们一般需要分别导入 `react` 与 `react-dom` 两个不同的 package，这时前端项目的整体结构可以用下图简略地表示：

![custom-renderers-2](/images/custom-renderers/2.png)

很多前端同学熟悉的 UI 库、高阶组件、状态管理等内容，实际上都位于图中封装后「基于 React 实现」的最顶层，连接 React 与 DOM 的 React DOM 一层则显得有些默默无闻。而在 Vue 2.x 中，这种结构是类似的。不过 Vue 目前并未实现 React 这样的拆分，其简化的基本结构如下图所示： 

![custom-renderers-4](/images/custom-renderers/4.png)

如何将它们这个为 DOM 设计的架构迁移到不同的渲染层呢？下文中会依次介绍这些实现方案：

* 基于 React 16 Reconciler 的适配方式
* 基于 Vue EventBus 的非侵入式适配方式
* 基于 Vue Mixin 的适配方式
* 基于 Vue Platform 定制的适配方式


## React Reconciler 适配
之所以首先介绍 React，是因为它已经提供了成型的接口供适配之用。在 React 16 标志性的 Fiber 架构中，`react-reconciler` 模块将基于 fiber 的 reconciliation 实现封装为了单独的一层。这个模块与我们定制渲染层的需求有什么关系呢？它的威力在于，**只要我们为 Reconciler 提供了宿主渲染环境的配置，那么 React 就能无缝地渲染到这个环境**。这时我们的运行时结构如下图所示：

![custom-renderers-3](/images/custom-renderers/3.png)

上图中我们所需要实现的核心模块即为 **Adapter**，这是将 React 能力扩展到新渲染环境的桥梁。如何实现这样的适配呢？

我们以适配著名的 WebGL 渲染库 [PIXI.js](https://pixijs.io) 为例，简要介绍这一机制如何工作。首先，我们所实现的适配层，其最终的使用形式应当如下：

``` js
import * as PIXI from 'pixi.js'
import React from 'react'
import { ReactPixi } from 'our-react-pixi'
import { App } from './app'

// 目标渲染容器
const container = new PIXI.Application()

// 使用我们的渲染层替代 react-dom
ReactPixi.render(<App />, container)
```

这里我们需要实现的就是 `ReactPixi` 模块。这个模块是 Renderer 的一层薄封装：

``` js
// Renderer 需要依赖 react-reconciler
import { Renderer } from './renderer'

let container

export const ReactPixi = {
  render (element, pixiApp) {
    if (!container) {
      container = Renderer.createContainer(pixiApp)
    }
    // 调用 React Reconciler 更新容器
    Renderer.updateContainer(element, container, null)
  }
}
```

它依赖的 Renderer 是什么形式的呢？大致是这样的：

``` js
import ReactFiberReconciler from 'react-reconciler'

export const Renderer = ReactFiberReconciler({
  now: Date.now,
  createInstance () {},
  appendInitialChild () {},
  appendChild () {},
  appendChildToContainer () {},
  insertBefore () {},
  insertInContainerBefore () {},
  removeChild () {},
  removeChildFromContainer () {},
  getRootHostContext () {},
  getChildHostContext () {},
  prepareUpdate () {},
  // ...
})
```

这些配置相当于 Fiber 进行渲染的一系列钩子。我们首先提供一系列的 Stub 空实现，而后在相应的位置实现按需操作 PIXI 对象的代码即可。例如，我们需要在 `createInstance` 中实现对 PIXI 对象的 new 操作，在 `appendChild` 中为传入的 PIXI 子对象实例加入父对象等。只要这些钩子都正确地与渲染层的相应 API 绑定，那么 React 就能将其完整地渲染，并在 `setState` 时依据自身的 diff 去实现对其的按需更新了。

这些连接性的胶水代码完成后，我们就能够用 React 组件来控制 PIXI 这样的第三方渲染库了：

![react-pixi-adapter](/images/custom-renderers/react-pixi-adapter.png)

这就是基于 React 实现渲染层适配的基本实现了。


## Vue 非侵入式适配
由于 Vue 暂时未提供类似 `ReactFiberReconciler` 这样专门用于适配渲染层的 API，因此基于 Vue 的渲染层适配在目前有较多不同的实现方式。我们首先介绍「非侵入式」的适配，它的特点在于完全可在业务组件中实现。其基本结构形如下图：

![custom-renderers-5](/images/custom-renderers/5.png)

这个实现的初衷是让我们以这种方式编写渲染层组件：

``` html
<div id="app">
  <pixi-renderer>
    <container @tick="tickInfo" @pointerdown="scaleObject">
      <pixi-text :x="10" :y="10" content="hello world"/>
    </container>
  </pixi-renderer>
</div>
```

首先我们实现最外层的 `pixi-renderer` 组件。基于 Vue 中类似 Context 的 Provide / Inject 机制，我们可以将 PIXI 注入该组件中，并基于 Slot 实现 Renderer 的动态内容：

``` js
// renderer.js
import Vue from 'vue'
import * as PIXI from 'pixi.js'

export default {
  template: `
    <div class="pixi-renderer">
      <canvas ref="renderCanvas"></canvas>
      <slot></slot>
    </div>`,
  data () {
    return {
      PIXIWrapper: { PIXI, PIXIApp: null },
      EventBus: new Vue()
    }
  },
  provide () {
    return {
      PIXIWrapper: this.PIXIWrapper,
      EventBus: this.EventBus
    }
  },
  mounted () {
    this.PIXIWrapper.PIXIApp = new PIXI.Application({
      view: this.$refs.renderCanvas
    })
    this.EventBus.$emit('ready')
  }
}
```

这样我们就具备了最外层的渲染层容器了。接下来让我们看看内层的 Container 组件（注意这里的 Container 不代表最外层的容器，只是 PIXI 中代表节点的概念）：

``` js
// container.js
export default {
  inject: ['EventBus', 'PIXIWrapper'],
  data () {
    return {
      container: null
    }
  },
  render (h) { return h('template', this.$slots.default) },
  created () {
    this.container = new this.PIXIWrapper.PIXI.Container()
    this.container.interactive = true

    this.container.on('pointerdown', () => {
      this.$emit('pointerdown', this.container)
    })
    // 维护 Vue 与 PIXI 组件间同步
    this.EventBus.$on('ready', () => {
      if (this.$parent.container) {
        this.$parent.container.addChild(this.container)
      } else {
        this.PIXIWrapper.PIXIApp.stage.addChild(this.container)
      }

      this.PIXIWrapper.PIXIApp.ticker.add(delta => {
        this.$emit('tick', this.container, delta)
      })
    })
  }
}
```

这个组件里显得古怪的 `render` 是由于其虽然无需模板，但却可能有子组件的特点所决定的。其主要作用即是维护渲染层对象与 Vue 之间的状态一致。最后让我们看看作为叶子节点的 Text 组件实现：

``` js
// text.js
export default {
  inject: ['EventBus', 'PIXIWrapper'],
  props: ['x', 'y', 'content'],
  data () {
    return {
      text: null
    }
  },
  render (h) { return h() },

  created () {
    this.text = new this.PIXIWrapper.PIXI.Text(this.content, { fill: 0xFF0000 })
    this.text.x = this.x
    this.text.y = this.y
    this.text.on('pointerdown', () => this.$emit('pointerdown', this.text))

    this.EventBus.$on('ready', () => {
      if (this.$parent.container) {
        this.$parent.container.addChild(this.text)
      } else {
        this.PIXIWrapper.PIXIApp.stage.addChild(this.text)
      }
      this.PIXIWrapper.PIXIApp.ticker.add(delta => {
        this.$emit('tick', this.text, delta)
      })
    })
  }
}
```

这样我们就模拟出了和 React 类似的组件开发体验。但这里存在几个问题：

* 我们无法脱离 DOM 做渲染。
* 我们必须在各个定制的组件中手动维护 PIXI 实例状态。
* 使用了 EventBus 和 props 两套组件间通信机制，存在冗余。

有没有其它的实现方案呢？


## Vue Mixin 适配
将 DOM 节点绘制到 Canvas 的 [vnode2canvas](https://github.com/muwoo/vnode2canvas) 渲染库实现了一种特殊的技术，可以通过 Mixin 的方式实现对 Vnode 的监听。这就相当于实现了直接一个到 Canvas 的渲染层。这个方案的结构大致形如这样：

![custom-renderers-6](/images/custom-renderers/6.png)

它的源码并不多，亮点在于这个 Mixin 的 mounted 钩子：

``` js
mounted() {
  if (this.$options.renderCanvas) {
    this.options = Object.assign({}, this.options, this.getOptions())
    constants.IN_BROWSER && (constants.rate = this.options.remUnit ? window.innerWidth / (this.options.remUnit * 10) : 1)
    renderInstance = new Canvas(this.options.width, this.options.height, this.options.canvasId)
    // 在此 $watch Vnode
    this.$watch(this.updateCanvas, this.noop)
    constants.IN_BROWSER && document.querySelector(this.options.el || 'body').appendChild(renderInstance._canvas)
  }
},
```

由于这里的 `updateCanvas` 中返回了 `Vnode`（虽然这个行为似乎有些不合语义的直觉），故而这里实际上会在 Vnode 更新时触发对 Canvas 的渲染。这样我们就能巧妙地将虚拟节点树的更新与渲染层直接联系在一起了。

这个实现确实很新颖，不过多少有些 Hack 的味道：

* 它需要为 Vue 组件注入一些特殊的方法与属性。
* 它需要耦合 Vnode 的数据结构，这在 React Reconciler 中是一种反模式。
* 它需要自己实现对 Vnode 的遍历与对 Canvas 对象的 getter 代理，实现成本较高。
* 它仍然附带了 Vue 自身到 DOM 的渲染层。

有没有一些更加「正统」的方法呢？


## Vue Platform 定制适配
可以认为 Vue 2.x 中对 Weex 的支持方式，是最贴合我们对定制渲染层的理解的。大名鼎鼎的 mpvue 也是按照这个方案实现了到小程序的渲染层。类似地，我们可以简略地画出它的结构图：

![custom-renderers-7](/images/custom-renderers/7.png)

上图中的 Platform 是什么呢？我们只要打开 mpvue 的源码，很容易找到它在 platforms 目录下新增的目录结构：

```
platforms
├── mp
│   ├── compiler
│   │   ├── codegen
│   │   ├── directives
│   │   └── modules
│   ├── runtime
│   └── util
├── web
│   ├── compiler
│   │   ├── directives
│   │   └── modules
│   ├── runtime
│   │   ├── components
│   │   ├── directives
│   │   └── modules
│   ├── server
│   │   ├── directives
│   │   └── modules
│   └── util
└── weex
    ├── compiler
    │   ├── directives
    │   └── modules
    ├── runtime
    │   ├── components
    │   ├── directives
    │   └── modules
    └── util
```

上面的 `mp` 实际上就是新增的小程序渲染层入口了。可以看到渲染层是独立于 Vue 的 core 模块的。那么这里的适配需要做哪些处理呢？概括而言有以下这些：

* 编译期的目标代码生成（这个应当是小程序的平台特性所决定的）。
* runtime/**events** 模块中渲染层事件到 Vue 中事件的转换。
* runtime/**lifecycle** 模块中渲染层与 Vue 生命周期的同步。
* runtime/**render** 模块中对小程序 `setData` 渲染的支持与优化。
* runtime/**node-ops** 模块中对 Vnode 操作的处理。

这里有趣的地方在于 `node-ops`，和笔者一开始设想中在此同步渲染层对象的状态不同，mpvue 的实现看起来非常容易阅读……像这样：

``` js
// runtime/node-ops.js
const obj = {}

export function createElement (tagName: string, vnode: VNode) {
  return obj
}
export function createElementNS (namespace: string, tagName: string) {
  return obj
}
export function createTextNode (text: string) {
  return obj
}
export function createComment (text: string) {
  return obj
}
export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {}
export function removeChild (node: Node, child: Node) {}
export function appendChild (node: Node, child: Node) {}
export function parentNode (node: Node) {
  return obj
}
export function nextSibling (node: Node) {
  return obj
}
export function tagName (node: Element): string {
  return 'div'
}
export function setTextContent (node: Node, text: string) {
  return obj
}
export function setAttribute (node: Element, key: string, val: string) {
  return obj
}
```

看起来这不是什么都没有做吗？个人理解里这和小程序的 API 有更多的关系：它需要与 `.wxml` 模板结合的 API 加大了按照配置 Reconciler 的方法将状态管理由 Vue 接管的难度，因而较难通过这个方式直接适配小程序为渲染层，还不如通过一套代码同时生成 Vue 与小程序的两棵组件树并设法保持其同步来得划算。

到这里我们已经基本介绍了通过添加 platform 支持 Vue 渲染层的基本方式，这个方案的优势很明显：

* 它无需在 Vue 组件中使用渲染层 API。
* 它对 Vue 业务组件的侵入相对较少。
* 它不需要耦合 Vnode 的数据结构。
* 它可以确实地脱离 DOM 环境。

而在这个方案的问题上，目前最大的困扰应该是它必须 fork Vue 源码了。除了维护成本以外，如果在基于原生 Vue 的项目中使用了这样的渲染层，那么就将会存在两个具有细微区别的不同 Vue 环境，这听起来似乎有些不清真啊…好在这块的对外 API 已经在 Vue 3.0 的规划中了，值得期待 XD


## 总结
到此为止，我们已经总结了 React 与 Vue 中定制渲染层的主要方式。重复一遍：

* 基于 React 16 Reconciler 的适配方式，简单直接。
* 基于 Vue EventBus 的非侵入式适配方式，简单但对外暴露的细节较多。
* 基于 Vue Mixin 的适配方式，Hack 意味较强。
* 基于 Vue Platform 定制的适配方式，最为灵活但需要 fork 源码。

可以看到在目前的时间节点上，没有路径依赖的项目在定制 Canvas / WebGL 渲染层时使用 React 较为简单。而在 Vue 的方案选择上，参考尤大在笔者[知乎回答](https://www.zhihu.com/question/296743614/answer/502160756)里的评论，fork 源码修改的方式反而是向后兼容性较好的方案。

除了上文中的代码片段外，笔者编辑本文的过程中也实现了若干渲染适配层的 POC 原型，它们可以在 [renderer-adapters-poc](https://github.com/doodlewind/render-adapters-poc) 这个仓库中看到。最后附上一些参考链接供感兴趣的同学阅读：

* [react-reconciler](https://github.com/facebook/react/tree/master/packages/react-reconciler)
* [Hello World Custom React Renderer](https://medium.com/@agent_hunt/hello-world-custom-react-renderer-9a95b7cd04bc)
* [Vue.js Custom Component Renderers](https://alligator.io/vuejs/custom-component-renderers/)
* [将你的 Virtual dom 渲染成 Canvas](https://zhuanlan.zhihu.com/p/39886896)
* [mpvue 初始提交](https://github.com/Meituan-Dianping/mpvue/commit/2a947d0baff4b7b1c1dfb72ad66ebcce048f6f1f)


> P.S. 我们 base 厦门折腾渲染的编辑器团队开放招人中，简历求砸 xuebi at gaoding.com 哈
