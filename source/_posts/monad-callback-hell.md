categories: Note

tags:

- JavaScript
- Pattern

date: 2018-01-07

toc: true

title: 从回调地狱到自函子上的幺半群：解密熟悉又陌生的 Monad
---

前端领域中许多老生常谈的话题背后，其实都蕴含着经典的计算机科学基础知识。在今天，只要你使用 JS 发起过网络请求，那其实你基本就使用过了函数式编程中的 Monad。这是怎么一回事呢？让我们从回调地狱说起吧……

<!--more-->


## 回调地狱与 Promise
熟悉 JS 的同学对于回调函数一定不会陌生，这是这门语言中处理异步事件最常用的手法。然而正如我们所熟知的那样，**顺序处理多个异步任务**的工作流很容易造成回调的嵌套，使得代码难以维护：

``` js
$.get(a, (b) => {
  $.get(b, (c) => {
    $.get(c, (d) => {
      console.log(d)
    })
  })
})
```

长久以来这个问题一直困扰着广大 JSer，社区的解决方案也是百花齐放。其中一种已经成为标准的方案叫做 **Promise**，你可以将异步回调**包在 Promise 里**，由 `Promise.then` 方法链式组合异步工作：

``` js
const getB = a =>
  new Promise((resolve, reject) => $.get(a, resolve))

const getC = b =>
  new Promise((resolve, reject) => $.get(b, resolve))

const getD = c =>
  new Promise((resolve, reject) => $.get(c, resolve))

getB(a)
  .then(getC)
  .then(getD)
  .then(console.log)
```

虽然 ES7 里已经有了更简练的 async/await 语法，但 Promise 已经有了非常广泛的应用。比如，网络请求的新标准 fetch 会将返回内容封装为 Promise，目前最流行的 Ajax 库 axios 也是这么做的。至于一度占领 70% 网页的元老基础库 jQuery，早在 1.5 版本中就支持了 Promise。这就意味着，只要你在前端发起过网络请求，你基本上就和 Promise 打过交道。**而 Promise 本身，就是一种 Monad。**

不过，各类对 Promise 的介绍多半集中在它的各种状态迁移和 API 使用上，这和 Monad 听起来似乎完全八竿子打不着，这两个概念之间有什么联系呢？要讲清楚这个问题，我们至少得搞懂 **Monad 是什么**。


## 冬三雪碧与 Monad
很多本来有兴趣学习 Haskell 等函数式语言的同学，都可能被一句名言震慑到打退堂鼓——【Monad 不就是自函子上的幺半群吗，有什么难以理解的】。其实这句话和白学家说的【[冬马小三，雪菜碧池](https://zh.moegirl.org/%E5%86%AC%E4%B8%89%E9%9B%AA%E7%A2%A7)】没有什么差别，不过是一句正确的废话而已，听完懂的人还是懂，不懂的人还是不懂。所以如果再有人和你这么介绍 Monad，请放心地打死他吧——喂等等，谁说冬三雪碧是正确的了！

回归正题，Monad 到底是什么呢？我们大可不必拿出 PLT 或 Haskell 那一套，而是在 JS 的语境里好好考虑一下这个问题：既然 Promise 在 JS 里是一个对象，类似地，你也可以把 Monad 当做一个**特殊的对象**。

既然是对象，那么它的黑魔法也不外乎存在于属性和方法两个地方里了。下面我们要回答一个至关重要的问题：**Monad 有什么特殊的属性和方法，来帮助我们逃离回调地狱呢？**

我们可以用**非常简单**的伪代码来澄清这个问题。假如我们有 A B C D 四件事要做，那么基于回调嵌套，你可以写出最简单的函数表达式形如：

``` js
A(B(C(D)))
```

看到嵌套回调的噩梦了吧？不过，我们可以抽丝剥茧地简化这个场景。首先，我们把问题简化到最普通的回调嵌套：

``` js
A(B)
```

基于**添加中间层**和**控制反转**的理念，我们只需十几行代码，就能够实现一个简单的中间对象 P，把 A 和 B 分开传给这个对象，从而把回调拆分开：

``` js
P(A).then(B)
```

现在，A 被我们包装了一层，P 这个**容器**就是 Promise 的雏形了！在笔者的博文 [从源码看 Promise 概念与实现](http://ewind.us/2017/promise-implementing/) 中，已经解释了这样将回调嵌套解除的基本机制了，相应的代码实现在此不再赘述。

但是，这个解决方案只适用于 A B 两个函数之间发生嵌套的场景。只要你尝试去实现过这个版本的 P，你一定会发现，我们现在没有这种能力：

``` js
P(A).then(B).then(C).then(D)
```

也没有这种能力：

``` js
P(P(P(A))).then(B)
```

这就是 Monad 大展身手的时候了！我们首先给出答案：**Monad 对象是这个简陋版 `P` 的强化，它的 `then` 能支持这种嵌套和链式调用的场景。**当然，正统的 Monad 里这个 API 不是这个名字，但作为参照，我们可以先看看 Promise/A+ 规范中的一个[关键细节](https://promisesaplus.com/#the-promise-resolution-procedure)：

在每次 Resolve 一个 Promise 时，我们需要判断两种情况：

1. 如果被 Resolve 的内容仍然是 Promise（即所谓的 `thenable`），那么**递归 Resolve** 这个 Promise。
2. 如果被 Resolve 的内容不是 Promise，那么根据内容的具体情况（如对象、函数、基本类型等），去 `fulfill` 或 `reject` 当前 Promise。

直观地说，这个细节能够保证下面两种调用方式完全等效：

``` js
// 1
Promise.resolve(1).then(console.log)

// 1
Promise.resolve(
  Promise.resolve(
    Promise.resolve(
      Promise.resolve(1)
    )
  )
).then(console.log)
```

这里的嵌套是否似曾相识？这实际上就是披着 Promise 外衣的 Monad 核心能力：对于一个 P 这样装着**某种内容**的容器，我们能够**递归地把容器一层层拆开，直接取出最里面装着的值**。只要实现了这个能力，通过一些技巧，我们就能够实现下面这个优雅的**链式调用** API：

``` js
Promise(A).then(B).then(C).then(D)
```

这更带来了额外的好处：不管这里面的 B C D 函数返回的是同步执行的值还是异步解析的 Promise，我们都能**完全一致地**处理。比如这个同步的加法：

``` js
const add = x => x + 1
Promise
  .resolve(0)
  .then(add)
  .then(add)
  .then(console.log)
// 2
```

和这个略显拧巴的异步加法：

``` js
const add = x =>
  new Promise((resolve, reject) => setTimeout(() => resolve(x + 1), 1000))

Promise
  .resolve(0)
  .then(add)
  .then(add)
  .then(console.log)
// 2
```

不分同步与异步，它们的调用方式与最终结果完全一致！

作为一个总结，让我们看看从回调地狱到 Promise 的过程中，背后运用了哪些函数式编程中的概念呢？

* 最简单的 `P(A).then(B)` 实现里，它的 `P(A)` 相当于 Monad 中的 `unit` 接口，能够**把任意值包装到 Monad 容器里**。
* 支持嵌套的 Promise 实现中，它的 `then` 背后其实是 FP 中的 `join` 概念，**在容器里还装着容器的时候，递归地把内层容器拆开，返回最底层装着的值。**
* Promise 的链式调用背后，其实是 Monad 中的 `bind` 概念。你可以扁平地串联一堆 `.then()`，往里传入各种函数，Promise 能够帮你抹平同步和异步的差异，把这些函数**逐个应用到容器里的值上**。

回归这节中最原始的问题，**Monad 是什么呢**？只要一个对象具备了下面两个方法，我们就可以认为它是 Monad 了：

1. **能够把一个值包装为容器** - 在 FP 里面这叫做 `unit`。
2. **对容器里装着的值，能够把一个函数应用到值上** - 这里的难点在于，容器里可能嵌套着容器，因此应用函数到值上的时候需要递归。在 FP 里面这叫做 `bind`（这和 JS 里的 `bind` 完全是两个概念，请不要混淆了）。

正如我们已经看到的，`Promise.resolve()` 能够把任意值包装到 Promise 里，而 Promise/A+ 规范里的 Resolve 算法则实际上实现了 `bind`。因此，我们可以认为：Promise 就是一个 Monad。其实这并不是一个新奇的结论，在 Github 上早有人从代码角度给出了证明，有兴趣的同学可以去[感受一下](https://gist.github.com/briancavalier/3296186) :-)

作为总结，最后考虑这个问题：我们是怎么把 Promise 和 Monad 联系起来呢？Promise 消除回调地狱的关键在于：

1. 拆分 `A(B)` 为 `P(A).then(B)` 的形式。这其实就是 Monad 用来构建容器的 `unit`。
2. 不分同步异步，都能写 `P(A).then(B).then(C)...`，这其实是 Monad 里的 `bind`。

到这里，我们就能够从 Promise 的功能来理解 Monad 的作用，并用 Monad 的概念来解释 Promise 的设计啦 😉


## 何谓自函子上的幺半群
到了这里，只要你理解了 Promise，那么你应该就已经可以理解 Monad 了。不过，Monad 传说中【自函子上的幺半群】又是怎么一回事呢？其实只要你读到了这里，你就已经见识过**自函子**和**幺半群**了（这里的理解未必准确，权当抛砖引玉之用，希望 dalao 指正）。

### 自函子
**函子**即所谓的 Functor，是一个能把值装在里面，通过传入函数来变换容器内容的**容器**：简化的理解里，前文中的 `Promise.resolve` 就相当于这样的映射，能把任意值装进 Promise 容器里。而**自函子**则是【能把范畴映射到本身】的 Functor，可以对应于 `Promise(A).then()` 里仍然返回 Promise 本身。


### 幺半群
幺半群即所谓的 Monadic，满足两个条件：单位元与结合律。

**单位元**是这样的两个条件：

首先，作用到单位元 `unit(a)` 上的 `f`，结果和 `f(a)` 一致：

``` js
const value = 6
const f = x => Promise.resolve(x + 6)

// 下面两个值相等
const left = Promise.resolve(value).then(f)
const right = f(value)
```

其次，作用到非单位元 `m` 上的 `unit`，结果还是 `m` 本身：

``` js
const value = 6

// 下面两个值相等
const left = Promise.resolve(value)
const right = Promise.resolve(value).then(x => Promise.resolve(x))
```

至于**结合律**则是这样的条件：`(a • b) • c` 等于 `a • (b • c)`：

``` js
const f = a => Promise.resolve(a * a)
const g = a => Promise.resolve(a - 6)

const m = Promise.resolve(7)

// 下面两个值相等
const left = m.then(f).then(g)
const right = m.then(x => f(x).then(g))
```

上面短短的几行代码，其实就是对【Promise 是 Monad】的一个证明了。到这里，我们可以发现，日常对接接口编写 Promise 的时候，我们写的东西都可以先提升到函数式编程的 Monad 层面，然后用抽象代数和范畴论来解释，逼格是不是瞬间提高了呢 XD


## 总结
上面所有的论证都没有牵扯到 `>>==` 这样的 Haskell 内容，我们可以完全用 JS 这样低门槛的语言来介绍 Monad 是什么，又有什么用。某种程度上笔者认同王垠的观点：函数式编程的门槛被人为地拔高或神话了，明明是实际开发中非常实用且易于理解的东西，却要使用更难以懂的一套概念去形式化地定义和解释，这恐怕并不利于优秀工具和理念的普及。

当然了，为了体现逼格，如果下次再有同学问你 Promise 是什么，请这么回复：

> Promise 不就是自函子上的幺半群吗，有什么难以理解的 🙂

最后插播广告：笔者写这篇文章的动机，是源自实现一个完全 Promise 化的异步数据转换轮子 [Bumpover](https://github.com/doodlewind/bumpover) 时对 Promise 的一些新理解。有兴趣的同学欢迎关注哦 XD
