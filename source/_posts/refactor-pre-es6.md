categories: Note

tags:

- JS

date: 2018-06-29

toc: true

title: 如何自动化重构前 ES6 老代码
---

在今天，JavaScript 的语言标准迭代非常迅速，这固然是好事，但也加速了许多前端老项目中代码的腐化。相信接手过有一段历史的老项目的同学对此都多少有所感触。那么我们是否能自动化、无痛地将老代码迁移到新标准下呢？答案是肯定的。

<!--more-->

下面我们会循序渐进地介绍三种自动化重构老代码的套路：

* 朴素处理
* ESLint
* 正则匹配
* Codemod


## 朴素处理
对于历史代码最基本和朴素的处理方式，大致可以归为这两类：

* 按照历史代码的套路继续填坑。
* 要写哪里的需求，就把那里的代码改成新的。

这两个套路当然都可行，但也都会有自己的问题：如果完全基于老代码的那一套继续填坑，那么可维护性会随着规范的发展逐渐下降；如果随遇随改，那么多半会遇到这样的问题：

* 整个代码仓库中有些地方使用新语法，有些地方使用老语法，这样的不一致会带来一些困惑。
* 提交历史中，更改老代码的改动和真正的功能性改动相夹杂，从而增加代码 review 的成本。

因此在中大规模的项目中，一边开发新特性一边修代码风格的实践很难说是最佳的。我们需要一些更批量、自动化的方式来更新我们的代码库。让我们从现成的 ESLint 开始吧：


## ESLint
对于全新的前端工程，ESLint 几乎是基本的质量保证标配了。故而这里不再赘述如何安装、使用这一工具，而是简要分享一下它在老项目代码风格升级中的作用。

只要在老项目中安装了 ESLint，你就可以很方便地通用 `npx` 命令来使用它。这使得我们有机会自动化地将风格不统一的老代码调整为一致的风格：

``` bash
npx eslint --fix
```

这并不是一个复杂的操作，但 ESLint 对代码风格的约束，可以帮助我们保证在后面的更改中保持代码库的稳定。因此在进行下面提及的批量改动时，非常建议将 ESLint 作为基础的辅助。


## 正则匹配
熟悉 ESLint 的同学应该知道，一般的 preset 规则中并不会限制我们使用 ES5 或 ES6 风格。故而在将代码库从 ES5 向 ES6 迁移时，现成的 `eslint --fix` 并不能直接派上用场，而是需要一些其它的手段。这里我们先从正则匹配开始吧。

最简单的正则匹配，实际上就是字符串替换了。不要小看字符串替换，对于某些情形它是最简单易用的。比如在 Vue 中从 ES5 迁移到 ES6 时，就存在如下这种常见的写法可以迁移：

``` js
// old
methods: {
  foo: function () { /* ... */ }
}

// new
methods: {
  foo() { /* ....*/ }
}
```

这时候我们就可以在 VSCode 之类的编辑器中通过将 `: function (` 全量替换为 `(` 来自动化地升级代码风格。但对于稍微复杂一些的规则，单纯的字符串匹配显然是不够用的。这时，我们可以编写批量处理代码文件的 Node 脚本来更改实现优化。例如我们近期就实现了一个这样的优化，用来实现 lodash 的按需加载：

``` js
// old
import lodash from 'lodash'
lodash.merge(/* ... */)

// new
import { merge } from 'lodash'
merge(/* ... */)
```

初看之下，这样的更新需要更改语法树中 `import` 和函数调用语句的语法，似乎是一个较难自动化实现的优化。但实际上，只要注意到我们所需要匹配的函数调用都满足 `lodash.xxx` 的形式，我们不难基于正则实现这样的算法：

1. 使用将代码中所有的 `lodash.xxx` 声明匹配出来。
2. 利用匹配到的 `merge` / `clone` 等方法名，替换掉 `import` 语句。
3. 将原有的 `lodash.xxx` 替换掉。

这样我们就能实现自动化的代码风格升级了。作为示例，实现了上面步骤的 Node 脚本实际上并不长：

``` js
const glob = require('glob')
const fs = require('fs-extra')

const filePath = process.argv[2]

// Usage
// node index.js ../foo/\*.js
glob(filePath, (err, files) => {
  if (err) throw err

  files.forEach(file => {
    fs.readFile(file, 'utf8').then(code => {
      const re = /lodash\.(.)+?\(/g
      const matchResults = code.match(re)

      if (!matchResults) return
      console.log('mod', file)

      const methodNames = matchResults.map(
        result => result.replace('lodash.', '').replace('(', '')
      )
      const filteredNames = Array.from(new Set(methodNames))
      let modCode = code.replace(
        `import lodash from 'lodash'`,
        `import { ${filteredNames.join(', ')} } from 'lodash'`
      )
      matchResults.forEach((result, i) => {
        // eslint-disable-next-line
        const re = result.replace('.', '\\.').replace('(', '\\(')
        modCode = modCode.replace(new RegExp(re, 'g'), methodNames[i] + '(')
      })
      fs.writeFile(file, modCode, 'utf8')
    })
  })
})
```

只靠一行关键的 `/lodash\.(.)+?\(/g` 正则，我们就能利用熟悉的工具批量地更改代码风格，听起来是不是高大上了一些呢？也许你会质疑这样在不太重要的代码风格上折腾有什么实际的效果。在性能优化方面，上面的脚本在应用到我们的编辑器代码仓库中后，它自动化地重构了 200 个以上对 lodash 的调用语句。重构后配合上 `babel-plugin-import` 的模块加载语句优化，lodash 在未压缩代码中所占体积由 526K 降低到了 162K（作为对比，Vue runtime 的未压缩体积是 204K）。这几乎相当于我们未压缩的体积的 1/4 了。也就是说，不需要对业务逻辑做出什么复杂的重构，我们就能够减少 25% 的包大小。这个效果还是让我们满意的。

当然了，纯粹基于正则的重构显然存在着破坏代码结构的风险。比如，如果在你的作用域已经声明了 `merge` 函数的前提下，将 `lodash.merge` 替换为 `merge` 的操作就是有问题的。好在如果你配置了 ESLint，那么这种行为就可以被 ESLint 及时发现而纠正，从而无需反复的冒烟测试就能够保证代码行为的一致性。这也是前文中强调 Lint 优先的理由。


## Codemod
实际上，从 ES5 到 ES6，显然有许多语法的风格迁移并不是正则表达式的表达力所能覆盖的。比如 `var` 到 `let` 和 `const` 的升级，需要考虑变量所在作用域是否存在 Re-assign 的行为；再比如如果要想批量地将 `function` 迁移到更简洁的箭头函数，那么我们需要考虑函数体内是否存在可能被破坏的 `this` 引用……对于这些类型的代码风格升级，我们可以引入 Codemod 作为更精确的工具。

目前，JS 社区的 `jscodeshift` 工具能够帮助我们自动化地处理上面提到的风格迁移。这个工具可以执行基于它开发的 Codemod 脚本，来自动化迁移代码风格。我们可以通过这个方式使用它：

1. 全局安装 jscodeshift
2. 在所需更改的代码仓库外部 clone js-codemod 仓库
3. 执行 Codemod

完成工具安装后，如果我们想使用将 `var` 自动化替换为 `let` 和 `const` 的迁移，只需按如下方式使用它：

``` bash
jscodeshift -t js-codemod/transforms/no-vars.js your-old-repo
```

社区还提供了很多现成的 Codemod 脚本，我们可以按需自取 :-)


## 小结
自动化改造代码风格除了让项目代码更加一致而工整外，还能够收获额外的性能提升。上文中虽然我们已经介绍了多种施行此类改造的方式，但由于越复杂、越有表达力的手段往往就意味着更多的开发和调试成本，故而我们在实际的工程实践中还是更推荐按实际需求分析，以现成的工具或最小的代价解决实际、可量化的工程问题。不要纠结于空格、缩进、换行了，让你的工具帮你自动化这些东西吧~