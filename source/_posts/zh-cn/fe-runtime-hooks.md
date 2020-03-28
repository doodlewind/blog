categories: Note

tags:

- Web
- JS

date: 2019-01-09

toc: true

title: 基于原型链劫持的前端代码插桩实践
---

代码插桩技术能够让我们在不更改已有源码的前提下，从外部注入、拦截各种自定的逻辑。这为施展各种黑魔法提供了巨大的想象空间。下面我们将介绍浏览器环境中一些插桩技术的原理与应用实践。

<!--more-->

## 插桩基础概念
前端插桩的基本理念，可以用这个问题来表达：**假设有一个被业务广泛使用的函数，我们是否能够在既不更改调用它的业务代码，也不更改该函数源码的前提下，在其执行前后注入一段我们自定义的逻辑呢？**

举个更具体的例子，如果业务逻辑中有许多 `console.log` 日志代码，我们能否在不改动这些代码的前提下，将这些 log 内容通过网络请求上报呢？一个简单的思路是这样的：

1. 封装一个「先执行自定义逻辑，然后执行原有 log 方法的函数」。
2. 将原生 `console.log` 替换为该函数。

如果希望我们的解法具备通用性，那么不难将第一步中的操作泛化为一个高阶函数：

``` js
function withHookBefore (originalFn, hookFn) {
  return function () {
    hookFn.apply(this, arguments)
    return originalFn.apply(this, arguments)
  }
}
```

于是，我们的插桩代码就很简洁了。只需要形如这样：

``` js
console.log = withHookBefore(console.log, (...data) => myAjax(data))
```

原生的 `console.log` 会在我们插入的逻辑之后继续。下面考虑这个问题：我们能否从外部阻断 `console.log` 的执行呢？有了高阶函数，这同样是小菜一碟：

``` js
function withHookBefore (originalFn, hookFn) {
  return function () {
    if (hookFn.apply(this, arguments) === false) {
      return
    }
    return originalFn.apply(this, arguments)
  }
}
```

只要钩子函数返回 `false`，那么原函数就不会被执行。例如下面就给出了一种清爽化控制台的骚操作：

``` js
console.log = withHookBefore(console.log, () => false)
```

这就是在浏览器中「偷天换日」的基本原理了。


## 对 DOM API 的插桩
单纯的函数替换还不足以完成一些较为 HACK 的操作。下面让我们考虑一个更有意思的场景：**如何捕获浏览器中所有的用户事件？**

你当然可以在最顶层的 `document.body` 上添加各种事件 listener 来达成这一需求。但这时的问题在于，一旦子元素中使用 `e.stopPropagation()` 阻止了事件冒泡，顶层节点就无法收到这一事件了。难道我们要遍历所有 DOM 中元素并魔改其事件监听器吗？比起暴力遍历，我们可以选择在原型链上做文章。

对于一个 DOM 元素，使用 `addEventListener` 为其添加事件回调是再正常不过的操作了。这个方法其实位于公共的原型链上，我们可以通过前面的高阶插桩函数，这样劫持它：

``` js
EventTarget.prototype.addEventListener = withHookBefore(
  EventTarget.prototype.addEventListener,
  myHookFn // 自定义的钩子函数
)
```

但这还不够。因为通过这种方式，真正添加的 listener 参数并没有被改变。那么，我们能否劫持 listener 参数呢？这时，我们实际上需要这样的高阶函数：

1. 把原函数的参数传入自定义的钩子中，返回一系列新参数。
2. 用魔改后的新参数来调用原函数。

这个函数大概长这样：

``` js
function hookArgs (originalFn, argsGetter) {
  return function () {
    var _args = argsGetter.apply(this, arguments)
    // 在此魔改 arguments
    for (var i = 0; i < _args.length; i++) arguments[i] = _args[i]
    return originalFn.apply(this, arguments)
  }
}
```

结合这个高阶函数和已有的 `withHookBefore`，我们就可以设计出完整的劫持方案了：

* 使用 `hookArgs` 替换掉传入 `addEventListener` 的各个参数。
* 被替换的参数中，第二个参数就是真正的 `listener` 回调。将这个回调替换为 `withHookBefore` 的定制版本。
* 在我们为 `listener` 添加的钩子中，执行我们定制的事件采集代码。

这个方案的基本逻辑结构大致形如这样：

``` js
EventTarget.prototype.addEventListener = hookArgs(
  EventTarget.prototype.addEventListener,
  function (type, listener, options) {
    const hookedListener = withHookBefore(listener, e => myEvents.push(e))
    return [type, hookedListener, options]
  }
)
```

只要保证上面这段代码在所有包含 `addEventListener` 的实际业务代码之前执行，我们就能超越事件冒泡的限制，采集到所有我们感兴趣的用户事件了 :)


## 对前端框架的插桩
在我们理解了对 DOM API 插桩的原理后，对于前端框架的 API，就可以照猫画虎地搞起来了。比如，我们能否在 Vue 中收集甚至定制所有的 `this.$emit` 信息呢？这同样可以通过原型链劫持来简单地实现：

``` js
import Vue from 'vue'

Vue.prototype.$emit = withHookBefore(Vue.prototype.$emit, (name, payload) => {
  // 在此发挥你的黑魔法
  console.log('emitting', name, payload)
})
```

当然了，对于已经封装出一套完善 API 接口的框架，通过这种方式定制它，很可能有违其最佳实践。但在需要开发基础库或开发者工具的时候，相信这一技术是有其用武之地的。举几个例子：

* 基于对 console.log 的插桩，可以让我们实现跨屏的日志收集（比如在你的机器上实时查看其他设备的操作日志）
* 基于对 DOM API 的插桩，可以让我们实现对业务无侵入的埋点，以及用户行为的录制与回放。
* 基于对组件生命周期钩子的插桩，可以让我们实现更精确而无痛的性能收集与分析。
* ……


## 总结
到此为止，我们已经介绍了插桩技术的基本概念与若干实践。如果你感兴趣，一个好消息是我们已经将常用的插桩高阶函数封装为了开箱即用的 NPM 基础库 `runtime-hooks`，其中包括了这些插桩函数：

* `withHookBefore` - 为函数添加 before 钩子
* `withHookAfter` - 为函数添加 after 钩子
* `hookArgs` - 魔改函数参数
* `hookOutput` - 魔改函数返回值

欢迎在 [GitHub](https://github.com/gaoding-inc/runtime-hooks) 上尝鲜我司这一开源项目，也欢迎大家关注这个前端专栏噢 :)

P.S. 我们 base 厦门的前端团队活跃招人中，简历求砸 xuebi at gaoding.com 呀~
