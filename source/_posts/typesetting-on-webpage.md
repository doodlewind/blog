categories: Note

tags:

- Web
- JS
- Algorithms

date: 2015-05-23

toc: true

title: JS 数学公式排版编译器
---

![output-ewind](http://7u2gqx.com1.z0.glb.clouddn.com/在网页上实现公式排版/output-ewind.png)

这个 [**Demo**](http://ewind.us/h5/compile-exp/) 可以支持含上下标、括号、空格与嵌套定义的基本公式排版，它的背后则是一套自造的小轮子，包含基于原生 JS 构建的词法分析器、表驱动自底向上语法分析器和语义分析方案。这个千行级小项目的完整 [**Repo**](https://github.com/doodlewind/compilExpt) 即是对编译原理知识的小实践。

<!--more-->

## 样例
直接点击链接，即可查看实时计算的排版结果。

*  [上标](http://dwz.cn/compile-demo-sup)
*  [下标](http://dwz.cn/compile-demo-sub)
*  [括号](http://dwz.cn/compile-demo-brace)
*  [上下标](http://dwz.cn/compile-demo-sup-sub)
*  [**嵌套**](http://dwz.cn/compile-demo-nested)

<!--more-->

## 技术方案简介
这个 Demo 所使用的关键技术包括：

* 原生 JavaScript
* 基于正则表达式的**词法分析**
* LR **分析表构建**算法
* **自底向上**的移入-归约分析
* 语法树的显式构建
* **自顶向下**的语义分析（求值）过程
* HTML5 Canvas 绘图

### JavaScript 
使用 JavaScript 这样一门弱类型且面向对象能力羸弱的脚本语言来实现编译器，这个选择的优点和缺点一样明显：

* JSON 格式十分适合对文法、分析表的表达
* 通过 Prototype 可方便地添加编译过程中需要的自定义方法
* 自带了 Canvas 这个简单方便、开箱即用的绘图工具
* 简单易上手的开发 / 调试环境（WebStorm / Firefox）
* 脚本语言中一流的速度（V8 比 Python 3 快 6.3 倍）

### 词法分析
词法分析过程是较为朴素而简洁的。`lexer.js` 读入字符串，通过不同词法符号的不同**正则表达式**，在输入流的头部逐个寻找匹配。一旦寻找到匹配，则输出相应的词法单元，并将相应的字符「吃掉」，继续下一次匹配。如果找不到有效的匹配，那么就停止词法分析并显示这个无效字符（也可以忽略词法符号并继续扫描，但这里选择了更简单的方案）。

### 语法分析
语法分析采用了泛用性强的**自底向上**分析方法。`table-builder.js` 实现了 LR 分析算法，能为任意的文法（以 JSON 格式存储在 `grammar.js` 中）生成一张 LR 分析表。而 `parser.js` 则实现了表驱动的**移入-归约分析**，并在这个过程中进行归约时，显式地构造了语法树。实际上，通过 `table-builder.js` 可以方便地实现对新语言的支持，譬如 Lisp 解释器等。

### 语义分析
在语法分析过程中，已经显式地构建了一棵语法树（实际上并未做简化，称为解析树应该更加准确）。语义分析的过程，就是通过对这棵树的自顶向下遍历，自顶向下地计算并传递每个节点的 `x` / `y` / `size` 属性，最后在叶子节点（每个叶子节点都是一个终止符）输出对应的打印坐标、尺寸和内容。


## 词法分析

### 输入
词法分析器的输入是形如 `$$x_^{2}{j}$$` 格式的字符串，中间可插入任意数量的换行符、制表符和空格。

### 输出
词法分析器的输出是一个元素为 JSON 对象的数组对象 `STREAM`，每一项均对应了词法符号的属性和字面值。以下是对输入 `$$x_^{2}{j}$$`，在 Chrome 43 浏览器中得到的输出结果。由于 JSON 格式的键可以是任何字符，故在此可直接使用特殊符号作为 token 的键。

```
[ $$: $$ ]
[ id: x ]
[ _: _ ]
[ {: { ]
[ id: i ]
[ }: } ]
[ id: y ]
[ ^: ^ ]
[ {: { ]
[ num: 2 ]
[ }: } ]
[ $$: $$ ]
```

### 算法及正则表达式
词法分析器核心代码描述如下，完整实现见 `lexer.js`

```
var LEXER = function(text) {
    var lexOut = [];
    var matched;
    function nextToken() {
        var id = text.match(/^[a-zA-Z]+[a-zA-Z0-9]*/);
        if (id != null) {
            matched = true;
            return {token: 'id', value: forward(id)};
        }
        var num = text.match(/^[\d]+/);
        if (num != null) {
            matched = true;
            return {token: 'num', value: forward(num)};
        }
        /* other tokens omitted */
        
        function forward(symbol) {
            text = text.substr(symbol[0].length, text.length);
            return symbol[0];
        }
    }
    while (text.length > 0) {
        matched = false;
        lexOut.push(nextToken());
        if (!matched) {
            lexOut = [];
            throw "Lex error on '"+ text[0] + "'";
        }
    }
    lexOut.push({token: '\n', value: '\n'});
    return lexOut;
};
```

### 错误控制
出现错误时，`lexer.js` 将抛出异常，主脚本将接受异常并显示产生异常的字符。下图中的样例输入包含了汉字，可以发现词法分析器定位了该字符。

![lexer-error](http://7u2gqx.com1.z0.glb.clouddn.com/在网页上实现公式排版/lexer-error.png)


## 语法分析

### 输入
语法分析器的输入有两个：

1. 用户定义的文法，以 JSON 格式存储在 `grammar.js` 中。
2. 上文中词法分析器的输出。

### 工作流程
语法分析器按照标准的 LR 分析算法构建分析表，并执行移入-归约分析。语法分析的核心流程及相应的输出如下。

#### 构建 FIRST 集合
构建出的 FIRST 集合如下，它标示了所有*非终结符*所推出的产生式中的*第一个终结符*（对终结符总有 `FIRST[ α ] = α`，此处略去）。

```
FIRST[ S ] = $$ 
FIRST[ B ] = id num /blank ( 
FIRST[ T ] = id num /blank ( 
FIRST[ R ] = id num /blank ( 
```

#### 构建 FOLLOW 集合
构建出的 FOLLOW 集合如下，它标示了所有非终结符后所能跟从的终结符。

```
FOLLOW[ S ] = 
FOLLOW[ B ] = $$ } ) 
FOLLOW[ T ] = id num /blank ( $$ } ) 
FOLLOW[ R ] = _ ^ id num /blank ( $$ } ) 
```

#### 构建 STATE 表
STATE 表节选如下，每个状态的项集通过闭包计算得到，位置用 `● ` 标识。

```
State0:
S -> ● $$ B $$

State1:
S -> $$ ● B $$
B -> ● T B
B -> ● T
T -> ● R _ ^ { B } { B }
T -> ● R ^ { B }
T -> ● R _ { B }
T -> ● R
R -> ● id
R -> ● num
R -> ● /blank
R -> ● ( B )

State2:
S -> $$ B ● $$

......

State26:
T -> R _ ^ { B } { B ● }

State27:
T -> R _ ^ { B } { B } ●
```

基本 LR 分析器共计算得到 28 个状态，逐一存储在 `STATE` 数组中。 

#### 构建 ACTION 表
构建得到的 ACTION 表如下，标识接受状态的 `\n` 列未列出。

| No. | $$  | id  | num | /blank | (   | )   | {   | }   | ^   | _   | B   | T  | R  |
|-----|-----|-----|-----|--------|-----|-----|-----|-----|-----|-----|-----|----|----|
| 1   |     | s5  | s6  | s7     | s8  |     |     |     |     |     | s2  | s3 | s4 |
| 2   | s9  |     |     |        |     |     |     |     |     |     |     |    |    |
| 3   | r2  | s5  | s6  | s7     | s8  | r2  |     | r2  |     |     | s10 | s3 | s4 |
| 4   | r6  | r6  | r6  | r6     | r6  | r6  |     | r6  | s12 | s11 |     |    |    |
| 5   | r7  | r7  | r7  | r7     | r7  | r7  |     | r7  | r7  | r7  |     |    |    |
| 6   | r8  | r8  | r8  | r8     | r8  | r8  |     | r8  | r8  | r8  |     |    |    |
| 7   | r9  | r9  | r9  | r9     | r9  | r9  |     | r9  | r9  | r9  |     |    |    |
| 8   |     | s5  | s6  | s7     | s8  |     |     |     |     |     | s13 | s3 | s4 |
| 9   |     |     |     |        |     |     |     |     |     |     |     |    |    |
| 10  | r1  |     |     |        |     | r1  |     | r1  |     |     |     |    |    |
| 11  |     |     |     |        |     |     | s15 |     | s14 |     |     |    |    |
| 12  |     |     |     |        |     |     | s16 |     |     |     |     |    |    |
| 13  |     |     |     |        |     | s17 |     |     |     |     |     |    |    |
| 14  |     |     |     |        |     |     | s18 |     |     |     |     |    |    |
| 15  |     | s5  | s6  | s7     | s8  |     |     |     |     |     | s19 | s3 | s4 |
| 16  |     | s5  | s6  | s7     | s8  |     |     |     |     |     | s20 | s3 | s4 |
| 17  | r10 | r10 | r10 | r10    | r10 | r10 |     | r10 | r10 | r10 |     |    |    |
| 18  |     | s5  | s6  | s7     | s8  |     |     |     |     |     | s21 | s3 | s4 |
| 19  |     |     |     |        |     |     |     | s22 |     |     |     |    |    |
| 20  |     |     |     |        |     |     |     | s23 |     |     |     |    |    |
| 21  |     |     |     |        |     |     |     | s24 |     |     |     |    |    |
| 22  | r5  | r5  | r5  | r5     | r5  | r5  |     | r5  |     |     |     |    |    |
| 23  | r4  | r4  | r4  | r4     | r4  | r4  |     | r4  |     |     |     |    |    |
| 24  |     |     |     |        |     |     | s25 |     |     |     |     |    |    |
| 25  |     | s5  | s6  | s7     | s8  |     |     |     |     |     | s26 | s3 | s4 |
| 26  |     |     |     |        |     |     |     | s27 |     |     |     |    |    |
| 27  | r3  | r3  | r3  | r3     | r3  | r3  |     | r3  |     |     |     |    |    |

完成 ACTION 表的构建后，即完成了 LR 语法分析的造表过程。

### 错误定位
语法分析器能在移入-归约分析过程中进行错误定位，若在 ACTION 表中查到了未定义动作的条目，将显示相应的字符。

![parser-error](http://7u2gqx.com1.z0.glb.clouddn.com/在网页上实现公式排版/parser-error.png)


## 语义动作

### 分析树的显式构建
实现思路：

1. 为每条产生式条目增加 `action` 键，它对应一个 JS 函数。
2. 在使用产生式进行归约时，产生式对应的函数将被执行，为语法树添加新节点。
3. 语法树之前的节点保存在 `NODES` 栈中，每次归约，将按产生式长度出栈相应数量的节点。
4. 将这些出栈的节点添加为新节点的子节点，再将新节点进栈。
5. 在完成对增广文法的归约后，`NODES` 栈中唯一的节点元素就是语法树的根节点。

添加分析树的显式构造模块后，`grammar.js` 中对应的产生式条目结构如下所示：

```
[
    {
        'from': S['T'],
        'to': [S['R'], S['_'], S['^'], S['{'], S['B'], S['}'], S['{'], S['B'], S['}']],
        'action': function () {
            var bNode2 = NODES.pop();
            var bNode1 = NODES.pop();
            var rNode = NODES.pop();
            var tNode = newNode('T', '', 3);
            addChild(tNode, rNode);
            addChild(tNode, bNode1);
            addChild(tNode, bNode2);

            NODES.push(tNode);
        },
    }
    // other productions omitted
]
```

### 属性的计算
计算属性时，从根节点开始遍历语法树，中途依据每个节点所对应的产生式，调整其给子节点继承的属性值。对每条产生式，相应的调整函数同样位于 `grammar.js` 中，通过对每条产生式条目添加 `calc` 键而得到。以上标表达式的计算为例。

``` 
    {
        'from': S['T'], 'to': [S['R'], S['^'], S['{'], S['B'], S['}']],
        'action': function () { 
            // action function omitted
        },
        'calc': function(node, x, y, size) {
            var childR = node.children[0];
            var args = traversal(childR, x, y, size);

            // handle sup arguments
            args['y'] = y + size * 3 / 5;
            args['size'] = size * 2 / 3;;
            var childB = node.children[1];
            return traversal(childB, args['x'], args['y'], args['size']);
        }
    },
    // other productions omitted
```

通过递归向下地调用 `traversal` 函数，完成对树的遍历。在叶节点，即可输出相应的目标代码。

``` 
// execute semantic action
function traversal(node, x, y, size) {
    return GRAMMAR[node.index]['calc'](node, x, y, size);
}

```


## Web 界面与绘图
程序各模块在 `index.html` 中的 `<head>` 部分依次加载，其结构包含：

```
    <script src="libs/typesetting/lexer.js"></script>
    <script src="libs/typesetting/grammar.js"></script>
    <script src="libs/table-builder.js"></script>
    <script src="libs/typesetting/helper.js"></script>
    <script src="libs/typesetting/parser.js"></script>
    <script src="libs/typesetting/calculator.js"></script>
    <script src="libs/render.js"></script>
```

编译结果通过 `render.js` 对 HTML5 Canvas 绘图库的调用，在页面上直接绘制。同时通过 CSS 自定义了页面的布局与风格，保证了移动设备和桌面浏览器上访问的通用性。


## 总结
网页公式排版的核心内容是 JS 实现的正则词法分析、自底向上语法分析与显式构造 / 遍历语法树。该技术方案优点有：

* 易于导入新文法，实现自己的语言。
* 造表后的解析过程简单高效。
* 造表过程开销并不大，但各关键变量的构造算法较为冗长复杂。
* 语法分析中，不需对二义文法做修改。
* 语义分析中，不需显式的栈操作来计算语义。

而这个方案的缺点也是很鲜明的。主要是 JS 在编程语言层的问题。由于 JS 的弱类型特性，使得错误难以定位，在问题发生后还能用 `undefined` 容忍程序的执行，直到实在扛不住了，才在离错误代码所在地很远的地方抛出异常。在实现 LR 分析算法的过程中，这个问题尤其明显。许多时候需要 Firebug 等调试工具深入跟踪才能定位问题。当然其最后得以完成，还是能说明脚本语言还是很有表达能力的。

最后，逐个完成程序模块的过程中，造轮子的乐趣和点滴的成就感，是无可取代的。

