categories: Note

tags:

- JS
- Pattern
- Vue

date: 2017-08-03

toc: true

title: 自制前端框架之 30 行的依赖追踪器
---

依赖追踪机制是 Vue 的核心之一，那么依赖追踪算法如何工作呢？在 30 行内我们就能实现它🤓

<!--more-->

## Reactive 基础
说起依赖追踪，就不能不提数据绑定的概念。前端最常见的重复劳动之一就是把数据绑定到 HTML 模板上，这时数据绑定能够实现数据更新时模板的自动更新。简单的三行伪代码就能描述出这个流程的实际使用场景：

``` js
const data = { foo: 123 }
magic(data, dom) // 定义 Reactive 并绑定数据到 dom
data.foo = 456 // 数据更新时 dom 自动更新
```

这里的 `magic` 能够把普通的 JS 对象转换为支持数据绑定的 Reactive 对象，在 Reactive 对象数据更新时，被绑定的模板也会进行更新。作为依赖追踪的基础，我们还是先用几行实现一个最简单的 Reactive 示例吧：

``` js
function defineReactive (obj, key, val) {
  Object.defineProperty(obj, key, {
    get () {
      return val
    },
    set (newValue) {
      // 在此添加更新绑定数据相关代码
      val = newValue
    }
  })
}
```

可以看到，Reactive 本身其实就是通过 `Object.defineProperperty` 添加了自定义 getter / setter 后的对象。这类对象能够在读写其属性值时，执行用户自定的代码，从而在此实现被绑定数据的更新。有了这个能力后，我们就可以开始编写依赖追踪器了。

## 依赖追踪原理
我们可以用 Excel 来理解依赖追踪：Reactive 就是普通单元格中的原始数据，而 Computed 就是插入了公式的单元格。Reactive 的格子更新时，Computed 的格子会根据为它设定的求和公式（即依赖）来自动更新出相应的值。

所以，对 Computed 最朴素的定义，就是一个简单的函数，形如这样：

``` js
// 这里的 data 是一个 Reactive
const isEmpty = () => data.values.length === 0
```

这初看之下没有任何 Magic，不过这里关键的细节区别在于：在指定 Excel 的公式时，我们需要**手动选择公式所依赖的单元格**，但在一个 Computed 函数中，我们**没有传入 Computed 的依赖**！既然没有传入依赖，那么这个 Computed 函数是怎么在它所使用的 Reactive 更新时去更新自身的呢？这就是依赖追踪算法所需要解决的问题了。

我们知道，Reactive 的数据绑定，本质上是在 **set** Reactive 时去执行更新。而依赖追踪则相反，需要在 Computed 中 **get** Reactive 时，去标记 Computed 对 Reactive 的依赖。

为了理解这个算法，我们不妨先假设一个简单的执行场景：假设 Computed 函数 C 依赖了 Reactive 对象 R1 和 R2，这时我们添加一个全局的辅助对象 D 来为当前 Computed 函数收集依赖。从而，我们可以用文字描述出这个算法的执行流程：

1. Computed 函数 C 初次求值时，标记 D 指向 C
2. 对 C 求值过程中，获取了 R1 和 R2 这两个 Reactive 的值，使得各 Reactive 的 getter 被触发
3. **为每个 Reactive 维护一个自己的依赖者 deps 数组，将 D 添加至数组内。**从而，在 C 求值完成后，R1 和 R2 均完成对 C 的依赖收集
4. 求值完成后，C 将 D 标记为空，返回求值结果
5. 经过标记后的 **R1 和 R2 更新时，所有添加至各自 deps 数组中的 Computed 均在 reactive 的 setter 中触发**，一并更新

这个算法的核心，就是为 Reactive 添加【依赖者】数组，从而在 Computed 触发 Reactive 时，添加该 Computed 至 Reactive 的依赖者中。这样，在 Reactive 下次更新时，就能够主动地触发 Computed 的更新了。下面我们使用代码来实现这个文字流程。

## 实现 Computed
动手实现 Computed 前，我们不妨设计出实际使用场景下一个简单的 API，然后从 API 接口出发来进行编码实现。假设我们有一个 `elder` 对象，他具有 `now` 这个 Reactive 来标记当前年份，那么我们可以定义出一个 Computed 来计算出他的年龄：

``` js
const elder = {}
defineReactive(elder, 'now', null)
defineComputed(elder, 'age', () => elder.now - 1926,
  () => console.log('Now his age is', elder.age)
)

elder.now = 2016
console.log(elder.age)

elder.now = 2017
console.log(elder.age)
```

在使用方式上，可以发现我们先是定义 Reactive，再定义从 Reactive 衍生出的 Computed 函数。

接下来就是代码实现了。我们在前文的 defineReactive 函数基础上，拓展出新的 defineComputed 函数。去除掉啰嗦的注释后，是可以控制在 30 行内的😅

``` js
// 标记当前正在求值的 computed 函数
let Dep = null

// 定义 computed，需传入求值函数与 computed 更新时触发的回调
function defineComputed (obj, key, computeFn, updateCallback) {
  // 封装供 reactive 收集的更新回调，以触发 computed 的更新事件
  const onDependencyUpdated = function () {
    // 在此调用 computeFn 计算出的值用于触发 computed 的更新事件
    // 供后续可能的 watch 等模块使用
    const value = computeFn()
    updateCallback(value)
  }
  Object.defineProperty(obj, key, {
    get () {
      // 标记当前依赖，供 reactive 收集
      Dep = onDependencyUpdated
      // 调用求值函数，中途收集依赖
      const value = computeFn()
      // 完成求值后，清空标记
      Dep = null
      // 最终返回的 getter 结果
      return value
    },
    // 计算属性无法 set
    set () {}
  })
}

// 通过 getter 与 setter 定义出一个 reactive
function defineReactive (obj, key, val) {
  // 在此标记哪些 computed 依赖了该 reactive
  const deps = []

  Object.defineProperty(obj, key, {
    // 为 reactive 求值时，收集其依赖
    get () {
      if (Dep) deps.push(Dep)
      // 返回 val 值作为 getter 求值结果
      return val
    },
    // 为 reactive 赋值时，更新所有依赖它的计算属性
    set (newValue) {
      // 在 setter 中更新值
      val = newValue
      // 更新值后触发所有 computed 依赖更新
      deps.forEach(changeFn => changeFn())
    }
  })
}
```

在上例中的代码实现中，我们除了实现了一个新的 defineComputed 函数外，还在 defineReactive 函数中进行了一定的修改。这主要体现在，我们在 Reactive 中：

1. 添加了 deps 数组
2. 在 getter 中进行了依赖收集
3. 在 setter 中计算出了所有依赖该 Reactive 的 Computed

这个在 getter 中收集依赖，而后在 setter 中触发的模式，实际就是本系列中第一篇 MVC 框架介绍中，所涉及的 PubSub 发布订阅模式了。不同之处在于，在依赖收集器中，我们通过 Object.defineProperty 这一高级特性将 PubSub 模式进行了封装，PubSub 中需要用户显式操作的【订阅】过程被平滑地优化为了【通过 getter 自动化进行的依赖收集】。依赖收集完成后，就能在 Reactive 更新时实现依赖追踪了。

OK，这就是依赖追踪器的基础实现了，本文的源码亦托管在 [Github](https://github.com/doodlewind/nano-computed/blob/master/src/index.js) 上，可以拉取或直接复制到 Node 中运行🙃希望对感兴趣的同学有所帮助。

本系列后续会继续专注用简单的代码解释前端框架各类 Magic 的实现机制，安利往期文章：

[自制前端框架之 50 行的虚拟 DOM](http://ewind.us/2017/nano-vdom/)
[自制前端框架之 MVC](http://ewind.us/2017/nano-mvc/)
[Github](https://github.com/doodlewind)
