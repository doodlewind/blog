categories: Note

tags:

- Web
- JS

date: 2017-05-20

toc: true

title: Vue 用户的 React 上手小结
---

这是一份从 Vue 用户角度出发的 React 上手总结与对比。

<!--more-->

## 构建系统
正常的前端工程化项目中，二者均采用 Webpack / NPM 作为模块打包和依赖管理工具。虽然不同脚手架所定制的 Webpack 配置有所区别，但实际上切换脚手架的难度可以说是最低的。以至于 [vue-springbud](https://github.com/doodlewind/vue-springbud) 这个 Vue 脚手架可以构建配置一行不改，直接用于打包 React 项目（当然了会缺失 HMR 与样式预编译等高级功能）。

React 的生态更大而松散，体现在构建配置上，就是官方的 loader 更加专注 JSX 编译，而不像 vue-loader 这样既编译模板，又预编译样式。React 的脚手架配置需要更多地定制样式方面的配置，如 css-loader / 预处理器 / CSS Module 配置等。不过在 JS 转译 / Uglify / CommonChunk 提取 / 全局变量 / 各类 Assets loaders / 开发环境 Proxy 等通用的 Webpack 功能使用上，二者的配置方式基本是一致的。


## 基础 API 与功能实现

### 渲染数据
和 Vue 在 HTML template 内写 `{{data}}` 的形式不同，React 将各种数据嵌套在 JSX 表达式中，然后 render JSX 到页面上。

在渲染数组时，React 中经常利用 map 将数据片段映射成一段 JSX，然后在列表区域中直接引用 map 后的 JSX 变量来渲染数组数据。而 Vue 中则使用类似 Smarty 语法的 `v-for` 指令来渲染数组。同时，React 需要为数据添加 `key` 来保证虚拟 DOM diff 算法的效率，而 Vue 中除非渲染的列表也是组件，否则一般不需提供类似用于优化的字段。

渲染数据时另一种常见的需求是，将后端提供的数据进行一些简单的转换后再渲染至页面上。在 Vue 中提供了组件的 computed 属性来实现这一功能，而 React 中则需要在 render 函数中定义一个新变量，将转换后的值赋给这个变量后 render 它。

### 更新数据
Vue 和 React 组件内的 `this` 指向的都是组件的实例，它们都可以通过修改实例数据来更新页面。区别在于，Vue 中的 `this` 没有提供 `state` / `props` / `setState` API，不论是父组件传入的数据还是子组件的数据，都在同一个 `this` 的作用域下（这样业务代码会更短一些）。并且，Vue 也没有 `setState` 这样的 setter 方法来更新数据，直接通过全量赋值 `this.xxx = yyy` 数据的方式就可以更新 DOM 了。

React 和 Vue 的设计区别，在更新数据的 API 中可以得到体现。Vue 的依赖追踪 Hack 了对象的 setter，因此在执行简单的赋值操作时可以直接获知状态树中的修改位置，但 DOM 更新是异步的。因此在 Vue 中如下的代码是没有问题的：

``` js
this.hasData = true
// 数据状态同步更改，但 v-if="hasData" 的元素还没有出现
this.hasData === true
```

需要显式 setState 的 React 则不能从基础的赋值操作中获知变更内容，而是需要通过 `setState` 触发一次 render，而后在 render 中更新 DOM 状态。因此这是一个容易踩的坑：

``` js
this.setState({ hasData: true })
// 有问题，必须在 setState 回调中数据状态才得到更改
this.hasData === true
```

React 中 DOM 状态和数据状态都是异步更新的。Vue 中仅 DOM 状态异步更新，需要保证 DOM 状态正确更新时，所使用的 `Vue.nextTick()` API 实际上也类似于 React 的 setState 回调。

### 用户输入
与 Vue 中通过 `v-model` 绑定 input 等输入元素的方式不同，React 中在 JSX 里使用 Input 标签时，需要显式为表单的 JSX 提供一个 `onChange` 属性，在此属性中指定一个名称形如 `handleInput` 的函数，在函数中调用 React 的 `this.setState()` 来更改状态。这个 handler 函数如果不在 React 组件实例中声明，那么则需要通过在 constructor 中添加 `this.handleXXX = handleXXX.bind(this)` 的方式来绑定函数中的 this 到 React 组件实例。

当存在多个 input 标签时，React 可以复用同一个 handler 函数，并在其中通过类似 `setState({ [name]: data })` 的语法糖来减少冗余代码（当然了这样也比 `v-model` 要繁琐一些）。

减少这些冗余代码的一种方式，是将基础的输入标签（或标签组）封装为 React 的组件，并通过父子组件通信的方式来处理表单中用户输入状态的更新。

### 事件传递
事件传递在 Vue 中是通过 `v-on` 和 `$emit` 来实现的。在父组件模板中声明子组件时，通过 `v-on:childEventName="parentHandler"` 语法来指定对子组件特定名称事件的 Handler method。而迁移到 React 中后，其事件传递的机制有所区别。Handler 虽然同样是在父组件中声明，但 Handler 需要以 props 的形式传入子组件，在子组件中触发事件时，以 `this.props.parentHandler` 形式调用父组件传入的 props 状态。

另外，在 React 中常见组件 ref 属性，可以使用这一属性来在父组件中安全地调用子组件方法。而在 Vue 中虽然可以通过 `$ref` 获取到子组件状态，但这并不是一个推荐的做法。

### 状态管理
React 本身是一个纯 View 库，没有状态管理功能。因此在大型应用中需要 Redux 这样的库来做状态管理。相应的概念在 Vue 中则是 Vuex。二者所引入的新概念学习成本是相近的，从一种迁移到另一种也并不困难。

Vuex 中，需要理解的核心概念是 mutation 和 action。这两种概念是从同步和异步的角度出发去实现的。可以简单理解为【同步状态改变就 commit 一个 mutation，异步的状态操作就 dispatch 一个 action】。在 action 中可以 commit 一个或多个 mutation，也可以触发其它 Promise / async 化的 action 来实现灵活的异步控制流组合。

这个思维模式切换到 Redux 的 reducer / action 概念中，需要澄清的则是：

1. mutation 和 reducer 并没有什么关系（不过它们确实都是同步的）。
2. Redux 的 action 既可以同步，也可以异步。

在最简单的情景下，Redux 中状态的更改，首先需要 dispatch 一个 action 函数。这个 action 函数会返回一个带有 type 类型的原生 JS 对象，action 触发后，Redux 根据 action 的类型去执行 reducer 中的逻辑，根据 action 返回的 type 以及相应的数据，决定如何更新全局状态。reducer 中的逻辑是同步的纯函数，并且可以通过 combileReducers 的 API 来组合多个子页面的 reducer，最后得到整个页面的状态树处理逻辑。

在需要异步的情景下，action 可以不返回原生 JS 对象，而是返回 thunk / promise 一类用于异步操作的数据类型，通过 Redux 的 applyMiddleware API 引入处理这些类型数据的能力。例如 redux-thunk 就可以使得 redux 的 action 不局限于返回一个原生 JS 对象，而是返回一个【接收 dispatch 函数】的 thunk 函数。这个函数在异步操作成功时再去调用传入的 dispatch 方法，在此提交一个真正触发 reducer 逻辑的 action。

Redux 提供的 subscribe API 使得它能够迁移到其它 View 库中作为其状态管理方案。不过在 React 中，有 react-redux 这一中间层包装了 subscribe 以及其它的 Redux API，从而可以通过包装根节点组件到 Provider 组件内，而后 connnet 组件到 Redux 的方式，简化 Redux 在 React 项目中的使用。

由于 action 异步情境下 Redux 没有提供【官方且唯一】的处理方案，因此催生了 redux-thunk / redux-promise / redux-saga / dva 这样种类繁多的辅助 Middleware。在这方面，React 系确实有更高的可定制性，不过若需要一一了解它们并做技术选型，学习成本还是比引入 Vuex 要高的。


## 生态与工具
前文中已经提到了在状态管理方面，React 和 Vue 的一些异同。下面对比一些其它相关的周边生态：

Devtools 方面，React 提供的 Chrome 开发插件和 Vue 的插件都对提升开发效率很有帮助。一些区别在于：

* React 插件支持将选中的组件映射到 console 的 `$r` 变量，更方便地实现调试。
* React 插件支持对生产环境的页面进行调试。这在很多时候是很重要的。
* React 的插件不支持显示【仅组件】的视图，较难直接从 devtool 视图中选中想要调试的组件。
* 调试 Redux 时 React 插件没有官方解决方案，而 Vue 的插件集成了 Vuex 的调试功能。

组件库方面，目前 React 有相对更加丰富的组件库，也有 RN 这样的跨端解决方案。在 Vue 方面靠谱的组件库除了 Element UI 外并不是很多。

在 CSS 预处理器支持方面，vue-loader 提供了相对更完善的预处理器支持。引入 Sass / Less / Stylus 只需指定 `.vue` 组件中 style 标签中的 lang 属性即可。React 的 CSS Modules 支持需要引入一些自定义的 Webpack 配置，相对定制性更强，也对 boilerplate 有更高的要求。

在第三方库支持方面，二者都有不少封装第三方库的组件库（当然了还是 React 更多）。不过它们较 Angular 更为友好的地方在于，在 React 和 Vue 的组件中调用第三方库都是较为方便的，不需要通过 `react-xxx` 或 `vue-xxx` 的封装就能够快速使用常见第三方库（如图表、ajax 等）的功能。


## 常见反模式
在接触了中等规模（去除组件库后，整个项目在约万行级）的 React 业务代码后，可以总结出一些常见的坑：

* 需要前端【更改一下数据格式】的数据一般都会通过 map 的形式转换为 JSX。但这些代码经常直接就是放置在 render 函数中的局部变量，会降低 render 的可读性。
* 未引入 Redux 时存在着多层组件间的事件传递，较为繁琐。
* React 缺少原生的 watch 机制以订阅某种数据的变更。
* 新手编写的 JSX 页面中容易混淆模板与 UI 逻辑，破坏数据和模板的分离解耦。并且 JSX 也容易变得冗长而不易维护，典型情况如【在 JSX 中嵌套三目运算符】。
* constructor 中可能存在大量的 bind。
* 在组件方法中直接编写各种 ajax 业务逻辑。

而相应地，在同等规模的 Vue 项目中也存在一些常见的坑：

* 未引入 Vuex 时存在多层的数据传递。
* 相对更简单的语法造成新人加入时采用各种 ES5 语法（如使用 ES6 的函数而非箭头函数、不用 computed 而在 method 中用古老的 for 循环拼凑数据并手动重置 data 属性等）。
* 在组件中直接执行各种 ajax 业务逻辑。
* 类型检查相对更松。如 Vue 在 2.3 之前 HTML 模板允许标签不闭合，造成升级后一些模板编写不严谨的页面大规模报错等。

总之，React 最重要的组件化和状态管理理念和 Vue 是一致的，熟悉 Vue 的开发者迁移过来并不需要很大的学习成本，更多考虑的还是团队的已有积累和业务方向。
