categories: Note

tags:

- JS

date: 2018-05-03

toc: true

title: 如何为团队潜规则明码标价
---

靠谱的前端团队一般都会引入自己的代码风格规范，但真实项目中的问题常常不是统一了空格数量和是否加分号就能解决的，而是有很多看不见的暗坑。我们是否有代码风格之上，对代码质量的更高级把控呢？ESLint 插件或许能够为你打开新世界的大门。

<!--more-->

在前端发展日新月异的这个时代，我们实际上正在面临日益严峻的前端代码腐化问题。譬如，但凡接手维护过前端项目的同学，应该多少都遇到过这样的场景：

* 约定好的模块路径、命名方式等规范没有被遵守，项目展开像是一盘散沙。
* 要做同样的事情，有的地方用了第三方库、有的地方用了内部库、有的地方自己重新裸写。
* 老语法和新语法混编共存。比如光导入一个库的方式，就有 ESM / CommonJS / UMD 等不一而足。
* ……

按照破窗理论，如果环境中的不良现象如果被放任存在，会诱使人们仿效，甚至变本加厉。但代码中的熵增现象并不意味着程序员们都是犯罪分子，很多时候上面这些问题，实际上源自于项目中对新人来说陌生的**隐式潜规则**：

* 如果新同学不知道我们已经习惯了导入 `lodash/xxx` 来减少包体积，那么他可能会全量导入 lodash。
* 如果新同学不知道我们已经封装了一个处理请求、序列化之类常见业务需求的基础库，那么他可能安装一个第三方库，甚至重新发明轮子。
* 如果新同学不知道我们的业务组件约定了需从某个公共基类继承，那么他就有可能另起炉灶搞一个他最容易理解的新版本。
* ……

这个层面上的一致性问题已经超出了是用空格还是 tab，或者行尾加不加分号的范畴，市面上已有的代码风格检查工具是「管不到这么宽」的。当然了，这个层面的问题也确实可以用 Code Review 来解决，但人工评审未必在每个标榜敏捷和 Moving Fast 的团队中都推得开。那么，我们是否有更高效率的手段，来将这些隐式的「潜规则」沉淀下来呢？这里我们尝试给出一种答案：**编写自己的业务 Lint 插件**。

在 2018 年，ESLint 基本已经是靠谱前端脚手架中的必备依赖了。但多数情况下我们都是使用一个现成的代码**风格**规范。但 ESLint 实际上并不仅仅可以用于检测空格、换行等风格问题，在与业务开发规范相结合后，就会发现它还具有非常大的潜力。而自己从头编写一个 ESLint 插件的过程其实也并不复杂，让我们来看看如何实践吧：


## 环境配置
和普通的前端项目一样，ESLint 插件也提供了一套开箱即用的脚手架。只需要安装全局依赖：

``` bash
npm install -g yo generator-eslint
```

就可以创建我们自己的插件了：

``` bash
mkdir eslint-plugin-demo
cd eslint-plugin-demo

yo eslint:plugin

? What is your name? ...
? What is the plugin ID? demo
? Type a short description of this plugin: ...
? Does this plugin contain custom ESLint rules? Yes
? Does this plugin contain one or more processors? No

npm install
```

初始化一个插件，就和 `create-react-app` 一样简单对吧？


## 创建规则
现在是时候来创建我们的第一条 Lint 规则了！作为例子，空格排版强迫症患者的笔者不喜欢在代码里看到这样的注释：

``` js
// 获取abc数据2次
```

Web 上中文排版的惯例其实是这样的：

``` js
// 获取 abc 数据 2 次
```

但是并不是谁都和笔者一样甚至在微信聊天里都坚持手动插入空格，而在 commit 记录里强行改动别人的注释，也有种替人挖鼻孔的不适感。那么我们把这个约定升级为 ESLint 的规则呢？我们需要理解一点 ESLint 的工作原理。

ESLint 使用 [Espree](https://github.com/eslint/espree) 这个 JavaScript parser 来解析你的项目源码。Parser 会将源代码字符串解析为一棵抽象语法树（AST），对于树中的每一个节点，ESLint 都会寻找是否存在与之匹配的规则，若匹配则计算出该规则是否满足。而 AST 是什么样的呢？譬如一行 `// hello world` 的 JS 代码文件，AST 格式形如：

``` json
{
  "type": "Program",
  "start": 14,
  "end": 14,
  "loc": {
    "start": {
      "line": 1,
      "column": 14
    },
    "end": {
      "line": 1,
      "column": 14
    }
  },
  "sourceType": "module",
  "body": [],
  "leadingComments": null,
  "innerComments": [
    {
      "type": "Line",
      "value": " hello world",
      "start": 0,
      "end": 14,
      "loc": {
        "start": {
          "line": 1,
          "column": 0
        },
        "end": {
          "line": 1,
          "column": 14
        }
      },
      "range": [
        0,
        12
      ]
    }
  ],
  "//": "......"
}
```


基于这个数据结构，如果希望对所有的变量声明语句添加规则，那么我们的插件规则就形如：

``` js
module.exports = function (context) {
  return {
    'VariableDeclaration' (node) {
      // 在这里搞事情
      // ...
    }
  }
}
```

这个 `VariableDeclaration` 是哪来的呢？这就是时候展示你作为资深前端，对于 ES Spec 的熟悉了！实际上，JavaScript 中的每一种语句，在规范中都定义了相应的类型，我们按照类型名称即可编写对其进行校验的规则了。如果我们希望对注释做校验，那么将上面示例中的名称换成 `Comment` 即可。是不是很符合直觉呢？

上面的这种方式可以理解为非常经典的 Visitor 模式，它在方便声明式地编写规则的同时，也有相邻节点之间完全透明，不方便一些复杂操作的问题。因此你也可以使用一些更过程式的 API 来辅助规则的编写：

``` js
module.exports = {
  create: function (context) {
    const sourceCode = context.getSourceCode()

    return {
      // Program 相当于 AST 根节点
      Program () {
        const comments = sourceCode.getAllComments()
        comments.forEach(node => {
          if (/* 满足校验规则 */) {
            context.report(node, 'Something WRONG!')
          }
        })
      }
    }
  }
}
```

对于我们现在检测空格的需求，一个现成的依赖是 `pangu.js`。我们在上面的注释处调用 pangu 的格式化 API 就能够实现校验了。但在实际编写自己的插件时，具体的业务规则往往不是难点，难点实际上在于对 JS 语法树结构的熟悉。这里特别推荐 [astexplorer](https://astexplorer.net/) 这个工具，它能够直观地让你了解源码对应的 AST 结构，方便校验规则的编写。

到这里，我们应该已经对编写规则有了一些直观的认识了。回到开头提出的问题，我们就可以用 ESLint 对症下药了：

* 对于特定模块文件，我们能够编写 ESLint 规则，要求其变量命名满足特殊的约定。
* 对于经过团队基础库封装后的原生 API，在 ESLint 规则中禁止它的出现，从而避免重新发明 `fetch` 一类的问题。
* 对于不符合最佳实践的语法使用，我们可以及时告警。比如，发现 require 语句正在为 `_` 或 `lodash` 赋值时，这多半会带来包体积的剧增，可以编写规则来避免。
* ……


## 测试驱动
我们已经知道了怎么编写灵活的校验规则，但这些代码多半在日常的业务开发中不会遇到，该怎么保证它靠谱呢？这就需要我们引入测试驱动的开发模式了。

在插件的 package.json 里，会有这样的脚本：

``` json
"scripts": {
  "test": "mocha ./tests/**/*.js"
}
```

作为示例，我们在 `/tests` 目录下添加 `spacing-test.js` 测试用例，填入这样的内容：

``` js
const rule = require('../lib/rules/spacing')
const RuleTester = require('eslint').RuleTester

const ruleTester = new RuleTester()
ruleTester.run('comment', rule, {
  valid: [
    '// 白色相簿 2'
  ],
  invalid: [
    {
      code: '// 白色相簿2',
      errors: [{
        message: 'Something WRONG!',
        type: 'Line'
      }]
    }
  ]
})
```

这就是通过测试驱动 ESLint 插件开发的基础方式了。对于规则所希望覆盖到的代码片段，可以通过测试用例的形式提供，这会在很大程度上便利后来者的理解和维护。编写完测试用例后，执行用例的方式也非常简单：

``` bash
npm test
```

测试用例全部通过，就代表着插件大功告成了！剩下的就是将它发布到 NPM 上，按照 ESLint 插件的配置方式，在你的项目中引入就行啦。在第一步脚手架为你生成的 README 中，这个过程已经有了很详尽的文档，在此就不赘述了。


## 总结
很多前端同学为了钻研技术深度，会去阅读 ES Spec 的规范文档。但可惜的是这个层面的内容很多时候对于一般的业务开发用处不是很大。但在你具备了开发（而不是使用）ESLint 插件的能力后，配合上你对 JS 本身的熟悉，就会有种解锁了「控制代码的代码」技能的船新感觉：用代码去约束和优化代码本身，这就是 Meta Programming 的威力了吧。

上文中编写的注释插件也已经发布到 [GitHub](https://github.com/doodlewind/eslint-plugin-pangu-comment)，欢迎参考或供强迫症同学试用哦。最后突然想没来由地提一句…

> 愿意为你在微信里加空格的妹子，一定是真爱了。
