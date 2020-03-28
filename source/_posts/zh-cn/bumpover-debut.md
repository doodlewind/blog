categories: Note

tags:

- JavaScript
- Summary

date: 2018-01-05

toc: false

title: Bumpover.js - 牢固而趁手的数据校验转换库
---

[Bumpover](https://github.com/doodlewind/bumpover) 能帮助你编写出简洁明了的数据校验与转换代码。通过熟悉的**类型注解 API** 与**声明式的转换规则**，你可以轻松地在**运行期**校验未知的数据，并将其转换为自己可控的格式。

<!--more-->

稳定的数据结构对应用至关重要，但在持续的需求变更和版本迭代中，数据格式**总是**处于频繁的变动之中。你当然可以编写更多的 if else 逻辑来兼容不同类型的数据，不过这显然会带来更多枯燥、随意而危险的面条代码。有没有更好的方式呢？

现在，TypeScript 和 Flow 已经为我们带来了非常方便的类型声明 API，可以帮助你在**编译期**检测出潜在的类型问题。不过对于**运行期**未知的数据 - 如源自后端接口、文件系统和剪贴板粘贴的数据 - 它们的作用也相对有限：想想上次对接后端接口的时候你调了多久？

并且，在一般意义上的数据校验之外，数据的转换与迁移也是日常开发中非常常见的场景。除了数据可视化这样需要频繁转换数据结构的场景外，对于一些将复杂 JSON 或 XML 内容序列化为字符串后存储在关系型数据库中的数据，它们在数据结构变动时，清洗起来是相当困难的：完成一道把 `'<p>123</p>'` 解析成 `{ paragraph: 123 }` 的面试题是一回事，保证稳定可预期的数据转换就是另一回事了。

Bumpover 就是设计来解决上面这几个问题的。它通过结合来自 [Superstruct](https://github.com/ianstormtaylor/superstruct) 的类型声明和规则驱动的数据更新机制，实现了：

* 对 JSON 与 XML 格式数据声明式的校验 - 类似 JSON Schema，但轻便灵活得多。
* 友好的类型注解 API，支持递归定义的数据类型。
* 基于 Promise 的数据节点更新规则，可异步转换存在外部依赖的数据。
* 灵活的数据遍历机制，允许全量保留子节点、过滤未知节点等。
* 可插拔的序列化和反序列化器，可轻松地支持各类私有数据格式。

说了这么多，那么 Bumpover 到底如何使用呢？耽误你一分钟的时间就够了：

> 开始前，记得安装依赖 :-)

```
npm install --save bumpover superstruct
```

将 Bumpover 与 Superstruct 导入到代码库中：

``` js
import { Bumpover } from 'bumpover'
import { struct } from 'superstruct'
```

假设这个场景：你有一份数据，其内容可能是虚拟 DOM 树中的节点，格式长这样：

``` js
const maybeNode = {
  name: 'div',
  props: { background: 'red' },
  children: []
}
```

我们可以定义一个 struct 来校验它：

``` js
import { struct } from 'superstruct'

const Node = struct({
  name: 'string',
  props: 'object?',
  children: 'array'
})
```

现在我们就能用 `Node` 来校验数据啦，将其作为函数调用即可：

``` js
Node(maybeNode)
```

一旦数据校验失败，你会获得详细的错误信息，而成功时会返回校验后的数据。

现在如果我们需要转换这份数据，该怎么做呢？比如，如果我们需要把所有的 `div` 标签换成 `span` 标签，并保留其它节点，该怎样可靠地实现呢？你可以过程式地人肉遍历数据，或者，简单地定义**规则**：

``` js
import { Bumpover } from 'bumpover'

const rules = [
  {
    match: node => node.name === 'div',
    update: node => new Promise((resolve, reject) => {
      resolve({
        node: { ...node, name: 'span' }
      })
    })
  }
]

const bumper = new Bumpover(rules)
bumper.bump(data).then(console.log)

// 获得新节点数据
```

只要提供规则，bumpover 就会帮助你处理好剩下的脏活。注意下面几点就够了：

* Rules 规则是实现转换逻辑的 Single Source of Truth。
* 使用 `rule.match` 匹配节点。
* 使用 `rule.update` 在 Promise 内更新节点，这带来了对异步更新的支持：对一份富文本 XML 数据，在做数据迁移时可能需要将其中 `<img>` 标签里的图片链接重新上传到云端，成功后再将新的链接写入新的数据结构中。Bumpover 能很好地支持这样的异步更新。
* 将新节点包装在 `node` 字段内 resolve 即可。

这就是最基础的示例了！对于更新后获得的数据，你还可以为每条规则提供 `rule.struct` 字段，校验转换得到的新节点是否符合你的预期。

转换简单的 JS 对象数据还不能完全体现出 Bumpover 的强大之处。考虑另一个场景：前端对 XML 格式数据的处理，一直缺乏易用的 API。除了原生 DOM 诡异的接口外，sax 这样基于流的处理方式也十分沉重。而 Bumpover 则提供了开箱即用的 `XMLBumpover` 可以帮助你。同样是把 `<div>` 转换为 `<span>` 标签，对 JSON 和 XML 格式数据的转换规则**完全一致**！

> XML 转换需要安装 `xml-js` 依赖

``` js
import { XMLBumpover } from 'bumpover'

const rules = [
  {
    match: node => node.name === 'div',
    update: node => new Promise((resolve, reject) => {
      resolve({
        node: { ...node, name: 'span' }
      })
    })
  }
]

const input = `
<div>
  <div>demo</div>
</div>
`

const bumper = new XMLBumpover(rules)
bumper.bump(input).then(console.log)

// '<span><span>demo</span></span>'
```

这背后有什么黑魔法呢？不存在的。对于你自己的各种神奇的数据格式，**只要你能提供它与 JSON 互相转换的 Parser，你就能编写同样的 Bumpover 规则来校验并转换它**。作为例子，Bumpover 还提供了一个 `JSONBumpover` 类，能够处理 JSON 字符串。我们来看看它的实现源码：

``` js
import { Bumpover } from './index'

export class JSONBumpover extends Bumpover {
  constructor (rules, options) {
    super(rules, options)
    this.options = {
      ...this.options,
      serializer: JSON.stringify,
      deserializer: JSON.parse
    }
  }
}
```

只要提供了 `JSON.parse` 和 `JSON.stringify`，你就能支持一种全新的数据类型了。并且，你还可以把 `xml2js` 和 `JSON.stringify` 相结合，定制出更灵活的数据转换器 😉

如果这些实例让你有了点兴趣，Bumpover 项目下还有一份完整的 [Walkthrough](https://github.com/doodlewind/bumpover/blob/master/docs/walkthrough.md)，介绍如何使用 Bumpover 实现异步迁移、及早返回、过滤节点等更灵活的特性，辅以完整的 [API 文档](https://github.com/doodlewind/bumpover/blob/master/docs/reference.md)。并且，Bumpover 虽然才开始开发不到一周，但已经实现了测试用例的 **100% 代码覆盖率**，欢迎感兴趣的同学前来体验哦 😀

最后作为一点花絮，介绍一下笔者开发 Bumpover 的动机，以及它和 Superstruct 的渊源：Superstruct 与 [Slate](https://github.com/ianstormtaylor/slate) 富文本编辑框架师出同门，而笔者本人恰好是这个编辑器的主要贡献者之一。Slate 在 `v0.30` 左右遇到了编辑器 Schema 校验的各种问题，而 Superstruct 就是一个应运而生，允许自定义更灵活 Schema 的新轮子。而笔者在实际使用中发现 Superstruct 还能够推广到更一般的场景下，这就是 Bumpover 诞生的源动力了。

[Bumpover](https://github.com/doodlewind/bumpover) 还处于非常早期的阶段，非常希望各位 dalao 们能够赏脸支持~谢谢！

* [Bumpover Repo](https://github.com/doodlewind/bumpover)
* [Superstruct Repo](https://github.com/ianstormtaylor/superstruct)
* [Slate 介绍](https://juejin.im/post/59e6fc9951882578d503952c)
