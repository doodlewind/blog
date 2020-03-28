categories: Note

tags:

- Algorithms
- JS

date: 2016-11-14

toc: true


title: 50 行代码的 HTML 编译器
---

虚拟 DOM 几乎已经是现代 JS 框架的标配了。那么该怎样将 HTML 字符串编译为虚拟 DOM 呢？这样的编译器并不是什么黑科技，这里只用了不到 50 行 JS 就实现了一个。

<!--more-->

## Demo
在 [HTML Toy Parser Demo](http://ewind.us/h5/html-toy-parser/) 中，可以将输入的 HTML 字符串编译成虚拟 DOM 并渲染在页面上。这个玩具项目的源码在 [Github](https://github.com/doodlewind/HTML-Toy-Parser) 上。

作为一个玩具编译器，它还不能支持一些常见的 HTML 格式，如类似 `<h2>123<small>456</small></h2>` 这样将值和标签混合的写法。不过，这个玩具是能完善地解析多个并列标签或深层嵌套标签的。下面分享一下如何从头开始搭建出这样一个简单的编译器。


## 编译器 101
编译器和解释器不同的地方在于，编译器是将一种编程语言的代码编译为另一种（例如将高级语言编译为机器语言），而解释器则是将一种编程语言的代码逐条解释执行（例如执行各种脚本语言）。编译器并不需要执行编译得到的代码（如 `gcc xxx.c` 以后是通过 OS 来执行编译得到的 x86 机器码）而解释器是直接执行语言代码（如各种脚本语言都需要通过诸如 `python xxx.py` 或 `node xxx.js` 的方式来执行）。

所以，将 HTML 字符串转换为 DOM 对象的程序就是一个编译器（虽然十分简陋）。按照经典的教科书，一般一个完整的编译过程由三步组成：词法分析、语法分析和语义分析。这三个流程各对应一个模块：词法分析器、语法分析器和语义计算模块。

以 `<p>123</p>` 这段字符串为例，对它的编译过程，首先始于类似【分词】操作的词法分析。这个过程就是输入一段字符串，输出 `<p>` / `123` / `</p>` 三个词法 Token 的过程。这些 Token 都有各自的属性（或类型），比如 `<p>` 是一个开始标签、而 `</p>` 是一个结束标签等。

词法分析器输入的这些 Token 被输入语法分析器中进行语法分析。语法分析，其实就是将输入的一连串 Token 数组构建为一棵抽象语法树（AST）的过程。比如，类似 `<h2><small>123</small></h2>` 这样嵌套的标签，解析成语法树后，`<small>` 就是 `<h2>` 的子节点。而类似 `<div>123</div> <a>456</a>` 这样并列的标签则是语法树中的兄弟节点。构建好这棵语法树后，就可以进行语义计算了。

最后的语义计算过程就是遍历语法树的过程。例如在遍历一棵虚拟 DOM 语法树的过程中，可以将每个语法树上的节点都渲染为真实的 DOM 节点，从而将虚拟 DOM 绑定到真实 DOM，这样就实现了完整的从 HTML 字符串编译到 DOM 元素的流程。


## 词法分析
这里的词法分析器 [Lexer](https://github.com/doodlewind/HTML-Toy-Parser/blob/master/app/lexer.js) 就是一个切分 HTML 字符串的工具。在最简化的情景下，HTML 字符串所包含的内容可以分为这三种：

* 起始标签，如 `<body>` / `<div>` / `<span>` 等
* 标签内容，如 `123` / `abc`/ `!@#$%` 等
* 结束标签，如 `</body>` / `</div>` / `</span>` 等

一个学术上严谨的词法分析器，需要用有限状态机来将文本切分成以上的三种类型。这里为了简单起见，使用了用正则表达式来切分文本。算法很简单：

1. 从字符串开头开始，首先匹配一个结束标签 Token
2. 如果没有匹配到结束标签，那么从字符串开头开始匹配一个开始标签 Token
3. 如果还是没有匹配到开始标签，那么匹配一段标签值 Token
4. 每次匹配到一个 Token，都记录下这个 Token 的类型和文本
5. 将 Token 的 HTML 字符串去除掉，回到步骤 1 直到切完字符串为止

词法分析完成后，所获得的 Token 数组内容大致如下：

``` js
tokens = [
    { type: 'TagOpen', val: '<p>' },
    { type: 'Value', val: 'hello' },
    { type: 'TagClose', val: '</p>' },
    { type: 'TagOpen', val: '<div>' },
    { type: 'TagOpen', val: '<h2>' },
    { type: 'TagOpen', val: '<small>' },
    { type: 'Value', val: 'world' },
    { type: 'TagClose', val: '</small>' }
    // ...
]
```

## 语法分析
语法分析是将上面得到的 `tokens` 数组构造为一棵语法树的过程，实现语法分析器 Parser 也是实现简单编译器时的难点。Parser 的算法有自顶向下（LL）和自底向上（LR）之分，[对比讨论](http://stackoverflow.com/questions/5975741/what-is-the-difference-between-ll-and-lr-parsing)暂且略过，下面介绍这个简单编译器的 Parser 实现：

首先，词法分析中得到的 Tokens 所得到的 `TagOpen` / `Value` / `TagClose` 这三种类型，在语法树中的位置是有区别的。例如，只有 `Value` 能成为叶子节点，而 `TagOpen` 和 `TagClose` 这两种类型只能用来包裹出一个 HTML 标签 `Tag` 类型。而一个或多个 `Tag` 类型又能够组成 `Tags` 类型。而一棵语法树的根节点则是一个只有一个 `Tags` 子节点的 `Html` 类型。

现在我们有了五种类型：即 `TagOpen` / `Value` / `TagClose` / `Tag` / `Tags`。这五种类型中，前三种是从词法分析直接得到的，称他们为【**终止符**】，而后两种为构建语法树过程中的 “抽象” 类型，称它们为【**非终止符**】

这个 [Parser](https://github.com/doodlewind/HTML-Toy-Parser/blob/master/app/parser.js) 采用了最简单的递归下降算法来解析 Tokens 数组。递归下降的过程是这样的：

1. 首先从语法树顶部的根节点开始，向前【匹配非终止符】。每个【匹配非终止符】的过程，都是调用一个函数的过程。例如匹配 `Tag` 需要调用 `tag()` 函数，匹配 `Tags` 需要调用 `tags()` 函数等
2. 每个非终止符的函数中，都按照这个非终止符的语法结构，依次匹配各种终止符或非终止符。例如 `tag()` 函数需要依次匹配 `TagOpen` - `Value` - `TagClose` 三个终止符，或者 `TagOpen` - `Tag` - `TagClose` 这样两个终止符和一个非终止符。如果在 `tag()` 函数中遇到了又需要匹配 `Tag` 的情况（这就是 HTML 标签嵌套的情形）时，就需要再次调用 `tag()` 函数来向下匹配一个新的 `Tag`，这也就是所谓的递归下降了。
3. 当所有的 Token 都被吃入并匹配后，完成匹配。

教科书级的代码示例是这样的（但是这不是伪代码，是能够实际执行语法分析的）：

``` js
// 简化的 parser.js

// tokens 为输入的词法 Token 数组
// currIndex 为当前语法分析过程所匹配到的下标，只会逐个向前递增，不回退
// lookahead 为当前语法分析遇到的 Token，即 tokens[currIndex]
var tokens, currIndex, lookahead

// 返回下一个 token 并将下标前移一位
function nextToken() {
  return tokens[++currIndex]
}

// 按照所需匹配的终止符类型，匹配下一个终止符
// 若下一个终止符和需要匹配的类型不一直，则说明代码中存在语法错误
// 如在解析 <a> 123 <a> 这三个 Token 时，最后需要 match('TagClose')
// 但此时最后一个 Token 类型为 TagOpen，这时就会抛出语法错误
function match(terminalType) {
  if (lookahead && terminalType === lookahead.type) lookahead = nextToken()
  else throw 'SyntaxError'
}

// LL 中的函数均是用于匹配非终止符的函数
// 如果有更复杂的非终止符，在此添加它们所对应的函数即可
const LL = {
  // 匹配 Html 类型非终止符的函数
  html() {
    // 当存在 lookahead 时，不停向前匹配 Tag 标签
    while (lookahead) LL.tag()
    // 当完成对所有 Token 的匹配后，lookahead 为越界的 undefined
    // 这时退出循环，在此结束语法分析过程
    console.log('parse complete!')
  },
  // 匹配 Tag 类型非终止符的函数
  tag() {
    // HTML 标签的第一个 Token 一定是 TagOpen 类型
    match('TagOpen')
    // 匹配完成 TagOpen 后，可能需要匹配一个嵌套的标签
    // 也可能需要匹配一个标签的 Value
    // 这时候就需要通过向前看符号 lookahead 来判断怎样匹配
    // 若需要匹配嵌套的标签，那么下一个符号必然是 TagOpen 类型
    lookahead.type == 'TagOpen' ? LL.tag() : match('Value')
    // 最后匹配一个结束标签，即 TagClose 类型的 Token
    match('TagClose')
    // 执行到这里时，就完成了对一个 HTML 标签的语法解析
    console.log('tag matched')
  }
}

export default {
  parse(inputTokens) {
    // 初始化各变量
    tokens = inputTokens, currIndex = 0, lookahead = tokens[currIndex]
    // 开始语法分析，目标是将 Tokens 解析为一整个 HTML 类型
    LL.html()
  }
}
```


## 语义分析
上面的语法分析过程中，并没有显式构建一棵语法树的代码。实际上，语法树是在 `LL` 中各个匹配非终止符的函数的互相调用中，隐式地构建出来的。要将这棵语法树转换为虚拟 DOM，只需要在 `tag()` 和 `html()` 等互相调用的函数中传入参数即可。

例如将 `tag()` 函数签名修改为如下的形式，即可实现

``` js
tag(currNode) {
  match('TagOpen')
  // 在遇到嵌套标签的情况时，递归向下解析
  if (lookahead.type == 'TagOpen') {
    // 将当前节点作为参数，调用 tags 匹配掉嵌套的标签
    // 将会返回挂载完成了所有子节点的当前节点
    currNode = NT.tags(currNode)
  } else {
    // 当前标签是一个叶子节点，这时直接修改当前节点的值
    // 这时 lookahead 指向的已经是一个 Value 类型的 Token 了
    currNode.val = lookahead.val
    // 匹配掉这个 Value 类型，
    match('Value')
    // 这时的 lookahead 指向 TagClose 类型
  }
  match('TagClose')
  // 最后返回计算完成的节点给上层
  return currNode
}
```

所以，这种语法分析方式下，语义计算的完整代码实际上耦合在了语法分析器中。最后 `html()` 函数返回的结果，就是一棵虚拟 DOM 语法树了。

要将获得的虚拟 DOM 渲染为真实 DOM，是非常容易的。只需要深度遍历这棵虚拟 DOM 树，将每个节点通过 API 插入 DOM 中即可：

``` js
// generator.js
function renderNode(target, nodes) {
  // nodes 由调用者传入，是调用者的全部子节点
  nodes.forEach(node => {
    // trim 用于修剪标签的首尾文本，例如将 <p> 剪为 p
    // 然后生成一个全新的 DOM 节点 newNode
    let newNode = document.createElement(trim(node.type))
    
    // node.val 不存在时，说明当前节点不是子节点
    // 此时传入 node 的子节点递归调用自己，深度优先遍历树
    if (!node.val) newNode = renderNode(newNode, node.children)
    
    // node.val 存在时，说明当前 node 是叶子节点
    // 此时 node.val 就是当前 DOM 元素的 innerHTML
    else newNode.innerHTML = node.val
    
    // 将新生成的节点挂载到 DOM 上
    target.appendChild(newNode)
  })
  // 向调用者返回挂载后的元素
  return target
}
```


## TODO
上面的一套流程走完后，实际上就实现了从 HTML 字符串到虚拟 DOM 再到真实 DOM 的流程了。由于虚拟 DOM 的抽象性，因此可以在 HTML 字符串中通过模板语法来绑定若干变量，然后在这些变量改变后，修改虚拟 DOM 对应的位置，并将虚拟 DOM 的相应部分重新渲染到真实 DOM，从而减少手动重新绘制 DOM 的冗余代码，并通过尽量少地重绘 DOM 来提高性能。

当然了，这个编译器的语法分析部分采用的是教科书中最简单的递归下降算法，递归的方式在很多时候性能都不是最好的。如果希望语法分析能够有尽可能高的性能，那么表驱动的 LR 分析可以做到这一点。不过 LR 分析中构造分析表的过程是相当复杂的，在此并没有杀鸡用牛刀的必要。

最后，这个玩具级的编译器能支持的文法其实相当有限，只是 HTML 的一个子集而已。希望它能够为编写其它更有趣的 Parser 提供一些启发吧。