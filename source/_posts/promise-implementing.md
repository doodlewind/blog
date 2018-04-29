categories: Note

tags:

- JS
- Algorithms

date: 2017-04-15

toc: true

title: 从源码看 Promise 概念与实现
---

Promise 是 JS 异步编程中的重要概念，它较好地解决了异步任务中回调嵌套的问题。在没有引入新的语言机制的前提下，这是如何实现的呢？上手 Promise 时常见若干晦涩的 API 与概念，它们又为什么存在呢？源码里隐藏着这些问题的答案。

<!--more-->

下文会在介绍 Promise 概念的基础上，以一步步代码实现 Promise 的方式，解析 Promise 的实现机制。相应代码参考来自 [PromiseJS 博客](https://www.promisejs.org/implementing/) 及 You don't know JS 的若干章节。


## Why Promise
（有使用 Promise 经验的读者可忽略本段）

基于 JS 函数一等公民的优良特性，JS 中最基础的异步逻辑一般是以向异步 API 传入一个函数的方式实现的，这个函数里包含了异步完成后的后续业务逻辑。与普通的函数参数不同的是，这类函数需在异步操作完成时才被调用，故而称之为回调函数。以异步 Ajax 查询为例，基于回调的代码实现可能是这样的：

``` js
ajax.get('xxx', data => {
  // 在回调函数里获取到数据，执行后续逻辑
  console.log(data)
  // ...
})
```

从而，在需要多个异步操作依次执行时，就需要以回调嵌套的方式来实现，例如这样：

``` js
ajax.get('xxx', dataA => {
  // 第一个请求完成后，依赖其获取到的数据发送第二个请求
  // 产生回调嵌套
  ajax.get('yyy' + dataA, dataB => {
    console.log(dataB)
    // ...
  })
})
```

这样一来，在处理越多的异步逻辑时，就需要越深的回调嵌套，这种编码模式的问题主要有以下几个：

* 代码逻辑书写顺序与执行顺序不一致，不利于阅读与维护。
* 异步操作的顺序变更时，需要大规模的代码重构。
* 回调函数基本都是匿名函数，bug 追踪困难。
* 回调函数是被第三方库代码（如上例中的 `ajax`）而非自己的业务代码所调用的，造成了 IoC 控制反转。

其中看似最无关紧要的控制反转，实际上是纯回调编码模式的最大问题。**由于回调函数是被第三方库调用的，因此回调中的代码无法预期自己被执行时的环境**，这可能导致：

* 回调被执行了多次
* 回调一次都没有被执行
* 回调不是异步执行而是被同步执行
* 回调被过早或过晚执行
* 回调中的报错被第三方库吞掉
* ……

通过【防御性编程】的概念，上述问题其实都可以通过在回调函数内部进行各种检查来逐一避免，但这毫无疑问地会严重影响代码的可读性与开发效率。这种异步编码模式存在的诸多问题，也就是臭名昭著的【回调地狱】了。

Promise 较好地解决了这个问题。以上例中的异步 `ajax` 逻辑为例，基于 Promise 的模式是这样的：

``` js
// 将 ajax 请求封装为一个返回 Promise 的函数
function getData () {
  return new Promise((resolve, reject) => {
    ajax.get('xxx', data => {
      resolve(data)
    })
  })
}

// 调用该函数并在 Promise 的 then 接口中获取数据
getData().then(data => {
  console.log(data)
})
```

看起来变得啰嗦了？但在上例中需要嵌套回调的情况，可以改写成下面的形式：

``` js
function getDataA () {
  return new Promise((resolve, reject) => {
    ajax.get('xxx', dataA => {
      resolve(dataA)
    })
  })
}

function getDataB (dataA) {
  return new Promise((resolve, reject) => {
    ajax.get('yyy' + dataA, dataB => {
      resolve(dataB)
    })
  })
}

// 使用链式调用解开回调嵌套
getDataA()
  .then(dataA => getDataB(dataA))
  .then(dataB => console.log(dataB))
```

这就解决了异步逻辑的回调嵌套问题。那么问题来了，这样优雅的 API 是如何实现的呢？


## 基础概念
非常笼统地说，Promise 其实应验了 CS 的名言【所有问题都可以通过加一层中间层来解决】。在上面回调嵌套的问题中，Promise 就充当了一个中间层，用来【把回调造成的控制反转再反转回去】。在使用 Promise 的例子中，控制流分为了两个部分：触发异步前的逻辑通过 `new` 传入 Promise，而异步操作完成后的逻辑则传入 Promise 的 `then` 接口中。通过这种方式，第一方业务和第三方库的相应逻辑都由 Promise 来调用，进而在 Promise 中解决异步编程中可能出现的各种问题。

这种模式其实和观察者模式是接近的。下面的代码将 `resolve` / `then` 换成了 `publish` / `subscribe`，将通过 `new Promise` 生成的 Promise 换成了通过 `observe` 生成的 `observable` 实例。可以发现，这种调用同样做到了回调嵌套的解耦。这就是 Promise 魔法的关键之一。

``` js
// observe 相当于 new Promise
// publish 相当于 resolve
let observable = observe(publish => {
  ajax.get('xxx', data => {
    // ...
    publish(data)
  })
})

// subscribe 相当于 then
observable.subscribe(data => {
  console.log(data)
  // ...
})
```

到这个例子为止，都还没有涉及 Promise 的源码实现。在进一步深入前，有必要列出在 Promise 中常见的相关概念：

* `resolve` / `reject`: 作为 Promise 暴露给第三方库的 API 接口，在异步操作完成时由第三方库调用，从而改变 Promise 的状态。
* `fulfilled` / `rejected` / `pending`: 标识了一个 Promise 当前的状态。
* `then` / `done`: 作为 Promise 暴露给第一方代码的接口，在此传入【原本直接传给第三方库】的回调函数。

这些概念中有趣的地方在于，标识状态的变量（如 `fulfilled` / `rejected` / `pending`）都是形容词，用于传入数据的接口（如 `resolve` 与 `reject`）都是动词，而用于传入回调函数的接口（如 `then` 及 `done`）则在语义上用于修饰动词的副词。在阅读源码的时候，除了变量的类型外，其名称所对应的词性也能对理解代码逻辑起到帮助，例如：

* 标识数据的变量与 OO 对象常用名词（`result` / `data` / `Promise`）
* 标识状态的变量常用形容词（`fulfilled` / `pending`）
* 被调用的函数接口常用动词（`resolve` / `reject`）
* 用于传入函数的参数接口常用副词（如 `then` / `onFulfilled` 等，毕竟函数常用动词，而副词本来就是用来修饰动词的）

预热了 Promise 相关的变量名后，就可以开始实现 Promise 了。下文的行文方式既不是按行号逐行介绍，也不是按代码执行顺序来回跳跃，而是按照实际编码时的步骤一步步地搭建出相应的功能。相信这种方式比直接在源码里堆注释能更为友好一些。


## 状态机
一个 Promise 可以理解为一个状态机，相应的 API 接口要么用于改变状态机的状态，要么在到达某个状态时被触发。因此首先需要实现的，是 Promise 的状态信息：

``` js
const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

function Promise () {
  // 存储该 Promise 的状态信息
  let state = PENDING

  // 存储 FULFILLED 或 REJECTED 时带来的数据
  let value = null

  // 存储 then 或 done 时调用的成功或失败回调
  var handlers = []
}
```

## 状态迁移
指定状态机的状态后，可以实现基本的状态迁移功能，即 `fulfill` 与 `reject` 这两个用于改变状态的函数，相应实现也十分简单：

``` js
const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

function Promise () {
  // 存储该 Promise 的状态信息
  let state = PENDING

  // 存储 FULFILLED 或 REJECTED 时带来的数据
  let value = null

  // 存储 then 或 done 时调用的成功或失败回调
  let handlers = []
  
  function fulfill (result) {
    state = FULFILLED
    value = result
  }

  function reject (error) {
    state = REJECTED
    value = error
  }
}
```

在这两种底层的状态迁移基础上，我们需要实现一种更高级的状态迁移方式，这就是 `resolve` 了：

``` js
const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

function Promise () {
  // 存储该 Promise 的状态信息
  let state = PENDING

  // 存储 FULFILLED 或 REJECTED 时带来的数据
  let value = null

  // 存储 then 或 done 时调用的成功或失败回调
  let handlers = []
  
  function fulfill (result) {
    state = FULFILLED
    value = result
  }

  function reject (error) {
    state = REJECTED
    value = error
  }

  function resolve (result) {
    try {
      let then = getThen(result)
      if (then) {
        // 递归 resolve 待解析的 Promise
        doResolve(then.bind(result), resolve, reject)
        return
      }
      fulfill(result)
    } catch (e) {
      reject(e)
    }
  }
}
```

`resolve` 既可以接受一个 Promise，也可以接受一个基本类型。当 `resolve` 一个 Promise 时，就使用 `doResolve` 辅助函数来执行这个 Promise 并等待其完成。通过暴露 `resolve` 而隐藏底层的 `fulfill` 接口，从而保证了一个 Promise 一定不会被另一个 Promise 所 `fulfill`。在这个过程中所用到的辅助函数如下：

``` js
/**
 * 检查一个值是否为 Promise
 * 若为 Promise 则返回该 Promise 的 then 方法
 *
 * @param {Promise|Any} value
 * @return {Function|Null}
 */
function getThen (value) {
  let t = typeof value
  if (value && (t === 'object' || t === 'function')) {
    const then = value.then
    // 可能需要更复杂的 thenable 判断
    if (typeof then === 'function') return then
  }
  return null
}

/**
 * 传入一个需被 resolve 的函数，该函数可能存在不确定行为
 * 确保 onFulfilled 与 onRejected 只会被调用一次
 * 在此不保证该函数一定会被异步执行
 *
 * @param {Function} fn 不能信任的回调函数
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function doResolve (fn, onFulfilled, onRejected) {
  let done = false
  try {
    fn(function (value) {
      if (done) return
      done = true
      // 执行由 resolve 传入的 resolve 回调
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}
```


## resolve 接口
在完整完成了内部状态机的基础上，还需要向用户暴露用于传入第一方代码的 `new Promise` 接口，及传入异步操作回调的 `done` / `then` 接口。下面从 resolve 一个 Promise 开始：

``` js
const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

function Promise (fn) {
  // 存储该 Promise 的状态信息
  let state = PENDING

  // 存储 FULFILLED 或 REJECTED 时带来的数据
  let value = null

  // 存储 then 或 done 时调用的成功或失败回调
  let handlers = []
  
  function fulfill (result) {
    state = FULFILLED
    value = result
  }

  function reject (error) {
    state = REJECTED
    value = error
  }

  function resolve (result) {
    try {
      let then = getThen(result)
      if (then) {
        // 递归 resolve 待解析的 Promise
        doResolve(then.bind(result), resolve, reject)
        return
      }
      fulfill(result)
    } catch (e) {
      reject(e)
    }
  }
  
  doResolve(fn, resolve, reject)
}
```

可以发现这里重用了 `doResolve` 以执行不被信任的 `fn` 函数。这个 `fn` 函数可以多次调用 `resolve` 和 `reject` 接口，甚至抛出异常，但 Promise 中对其进行了限制，保证每个 Promise 只能被 `resolve` 一次，且在 `resolve` 后不再发生状态转移。


## 观察者 done 接口
到此为止已经完成了一个完整的状态机，但仍然没有暴露出一个合适的方法来观察其状态的变更。我们的最终目标是实现 `then` 接口，但由于实现 `done` 接口的语义要容易得多，因此可首先实现 `done`。

下面的例子中要实现的是 `promise.done(onFulfilled, onRejected)` 接口，使得：

* `onFulfilled` 与 `onRejected` 二者只有一个被调用。
* 该接口只会被调用一次。
* 该接口总是被异步执行。
* 调用 `done` 的执行时机与调用时 Promise 是否已 `resolved` 无关。

``` js
const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

function Promise (fn) {
  // 存储该 Promise 的状态信息
  let state = PENDING

  // 存储 FULFILLED 或 REJECTED 时带来的数据
  let value = null

  // 存储 then 或 done 时调用的成功或失败回调
  let handlers = []
  
  function fulfill (result) {
    state = FULFILLED
    handlers.forEach(handle)
    handlers = null
  }

  function reject (error) {
    state = REJECTED
    value = error
    handlers.forEach(handle)
    handlers = null
  }

  function resolve (result) {
    try {
      let then = getThen(result)
      if (then) {
        // 递归 resolve 待解析的 Promise
        doResolve(then.bind(result), resolve, reject)
        return
      }
      fulfill(result)
    } catch (e) {
      reject(e)
    }
  }
  
  // 保证 done 中回调的执行
  function handle (handler) {
    if (state === PENDING) {
      handlers.push(handler)
    } else {
      if (state === FULFILLED &&
        typeof handler.onFulfilled === 'function') {
        handler.onFulfilled(value)
      }
      if (state === REJECTED &&
        typeof handler.onRejected === 'function') {
        handler.onRejected(value)
      }
    }
  }
  
  this.done = function (onFulfilled, onRejected) {
    // 保证 done 总是异步执行
    setTimeout(function () {
      handle({
        onFulfilled: onFulfilled,
        onRejected: onRejected
      })
    }, 0)
  }
  
  doResolve(fn, resolve, reject)
}
```

从而在 Promise 的状态迁移至 resolved 或 rejected 时，所有通过 `done` 注册的观察者 handler 都能被执行。并且这个操作总是在下一个 tick 异步执行的。


## 观察者 then 方法
在实现了 `done` 方法的基础上，就可以实现 `then` 方法了。它们没有本质的区别，但 `then` 能够返回一个新的 Promise：

``` js
this.then = function (onFulfilled, onRejected) {
  const _this = this
  return new Promise(function (resolve, reject) {
    return _this.done(function (result) {
      if (typeof onFulfilled === 'function') {
        try {
          return resolve(onFulfilled(result))
        } catch (ex) {
          return reject(ex)
        }
      } else return resolve(result)
    }, function (error) {
      if (typeof onRejected === 'function') {
        try {
          return resolve(onRejected(error))
        } catch (ex) {
          return reject(ex)
        }
      } else return reject(error)
    })
  })
}
```

最后梳理一下典型场景下 Promise 的执行流程。以一个 ajax 请求的异步场景为例，整个异步逻辑分为两部分：调用 ajax 库的代码及异步操作完成时的代码。前者被放入 Promise 的构造函数中，由 `doResolve` 方法执行，在这部分业务逻辑通过调用 `resolve` 与 `reject` 接口，在异步操作完成时改变 Promise 的状态，从而调用后者，即调用 Promise 中通过 `then` 接口传入的 `onFulfilled` 与 `onRejected` 后续业务逻辑代码。这个过程中，`doResolve` 对第三方 ajax 库的各种异常行为（多次调用回调或抛出异常）做了限制，而 `then` 下隐藏的 `done` 则封装了 `handle` 接口，保证了多个通过 `then` 传入的 handler 总是异步执行，并能得到合适的返回结果。由于 `then` 中的代码总是异步执行并返回了一个新的 Promise，因此可以通过链式调用的方式来串联多个 `then` 方法，从而实现异步操作的链式调用。


## 总结
阅读了 Promise 的代码实现后可以发现，它的魔法来自于将【函数一等公民】和【递归】的结合。一个 `resolve` 如果获得的结果还是一个 Promise，那么就将递归地继续 `resolve` 这个 Promise。同时，Promise 的辅助函数中解决了诸多异步编程时的常见问题，如回调的多次调用及异常处理等。

介绍 Promise 时不少较为晦涩的 API 其实也来自于对 Promise 编码实现时的涉及的若干底层功能。例如，`fulfilled` 这个概念就被封装在了 `resolve` 下，而 `done` 方法则是 `then` 方法的依赖等。这些概念在 Promise 的演化中被封装在了通用的 API 下，只有在阅读源码时才会用到。Promise 的 API 设计也是简洁的，其接口命名和英语的词性也有相当大的联系，这也有利于理解代码实现的相应功能。

除了上文中从状态机的角度理解 Promise 以外，其实还可以从函数式编程的角度来理解这个模式。可以将 Promise 看做一个封装了异步数据的 Monad，其 `then` 接口就相当于这个 Monad 的 `map` 方法。这样一来，Promise 也可以理解为一个特殊的对象，这个对象【通过一个函数获取数据，并通过另一个函数来操作数据】，用户并不需要关心其中潜在的异步风险，只需要提供相应的函数给 Promise API 即可（这展开又是一篇长文了）。

希望本文对 Promise 的分析对理解异步编程有所帮助。
