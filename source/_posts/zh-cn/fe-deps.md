categories: Note

tags:

- Web

date: 2018-12-23

toc: true

title: 如何管理前端项目中的复杂依赖关系
---

随着前端工程规模的增加，各种第三方与自有依赖包的关系也日趋复杂。这时候可能产生什么问题，又该如何解决呢？这里分享我们前端团队的一些实践。

<!--more-->

## 何谓复杂依赖关系
安装依赖包，对于前端开发者来说不过就是一句 `npm install xxx` 的事。那么，单纯靠这种方式给一个项目安装了很多依赖，就算是复杂的依赖关系吗？这里我们这样定义「复杂」：

* 你需要自己维护多个不同的包，来在最下游的业务项目中使用。
* 除了被下游业务依赖外，这些包之间也可能存在依赖关系，它们也可能依赖上游的包。
* 不同的包可能位于不同的 Git 仓库，还有各自独立的测试、构建与发布流程。

如果纯粹只靠 `npm install`，那么所有的包都必须发布到 NPM 之后才能被其他的包更新。在「联调」这些包的时候，每次稍有更改都走一遍正式的发布流程，无疑是非常繁琐而影响效率的。我们有什么现成的工具来解决这个问题呢？


## 社区工具 Takeaway
提到管理多个包之间的依赖关系，很多同学应该能马上想到不少现成的工具，比如：

* NPM 的 link 命令
* Yarn 的 workspace 命令
* Lerna 工具

这里的「万恶之源」就是 `npm link` 命令了。虽然熟悉它的同学多半知道它有不少问题，但它确实能解决基本的链接问题。快速复习一下使用方式：假设你维护的下游业务项目叫做 app，上游的依赖叫做 dep，那么要想做到「dep 一改动，app 就能同步更新」，只需要这样：

``` bash
# 1. 在 dep 所在路径执行
npm link

# 2. 在 app 所在路径执行
npm link dep
```

这样就形成了 app 与 dep 之间基本的「链接」关系。只要进入 app 的 node_modules 查看一下，不难发现 NPM 其实就是替你建立了一个操作系统的「快捷方式」（软链接）跳到 dep 下而已。在存在多个互相依赖的包的时候，手动维护这个链接关系非常麻烦而且容易出错，这时候你可以用社区的 yarn workspace 或 Lerna 来自动帮你管理这些包。由于这二者相当接近，在此我们只介绍在我们生产环境下使用的 Lerna 工具。

Lerna 的使用也是非常傻瓜的，你只需按下面的风格把各个依赖包放在同一个目录下就行，无需对它们具体的构建配置做任何改动：

``` text
my-lerna-repo/
  package.json
  packages/
    dep-1/
      package.json
    dep-2/
      package.json
    dep-3/
      package.json
    ...
```

然后一句 `lerna bootstrap` 就能够自动处理好它们之间的依赖关系了——这里每个包的 `package.json` 都可以放心地写上其它包的名字了（注意这里依据的是 `package.json` 中的 name 字段，而非目录名）。这样，你可以放心地把这些包放置在同一个 Git 仓库里管理，而不用担心繁琐的初始化过程了——现在的 Babel 和 React 就是这么干的。

当然了，实际的场景并不是有了现成的命令或者工具就万事大吉了。下面总结一些实践中的依赖管理经验吧：


## 循环依赖的产生与解除
在刚开始使用 Lerna 这样的依赖管理工具时，一些同学可能会倾向于把依赖拆分得非常零散。这时是有可能出现循环依赖的情形的——A 包依赖了 B，而 B 包又依赖了 A。怎么会出现这种情况呢？举一个例子：

1. 假设你在维护一个可复用的编辑器 editor 包。为了更好的 UI 组件化，你把它的 UI 部分拆分成了 editor-ui 包。
2. editor-ui 的组件需要 editor 实例，因此你把 editor 列为了 editor-ui 的依赖。
3. editor 的 Demo 页面中想要展示带完整 UI 的应用，因此你把 editor-ui 列为了 editor 的依赖。

这时候就出现了循环依赖。虽然 NPM 支持这种场景下的依赖安装，但是它的出现会让依赖关系变得难以理解，因此我们希望尽量做到直接避免它。这里的好消息是，循环依赖多数都和不太符合直觉的需求有关，在上面的例子里，作为上游的 editor 包去依赖了下游的 editor-ui 包，这可以在方案评审时就明确指出，并只需改为在 editor-ui 包中展示 Demo 页即可——如果出现了循环依赖，大胆地运用「这个需求不合理」的否决权吧。


## 多依赖包的初始化和同步
我们已经提到，`lerna boostrap` 能够正确地完成多个包的依赖安装和链接操作。但这是否意味着一个装载了多个包的 Lerna 仓库，只要这条命令就能够让这些包都正常地跑起来呢？这里存在一点细节需要注意。

如果你管理的多个包先是配置了各自的构建和发布命令，然后才通过 Lerna 合并到一起的话，可能出现这样的问题：它们在 `package.main` 字段下指定的入口都是形如 `dist/index.js` 下的构建后文件，但相应的产物代码在现在一般是不提交到 Git 的。这时候拉下全新的代码想要跑起来时，即便工具正确地处理了链接关系，仍然有可能出现某个子包无法打包成功的情况——这时，就去被依赖的包目录下手动 `npm run build` 一次了。当然，在这种情况下，更新了一个包的源码后，也需要对这个包做一次 build 操作生成产物后，其它的包才能同步。虽然这并没有多少理解上的困难，但往往造成一些不必要的困扰，故而在此特地提及。


## 存在上下游的依赖管理
在真实场景中，依赖其实并不能完全通过 Lerna 等工具管理，而是存在着上下游的区分的。这是什么概念呢？如下图:

![deps-flow](/images/fe-deps/deps-flow.png)

一般来说，上游的基础库（如 Vue / Lodash 等）并不适合直接导入自有的宏仓库中维护，而下游的具体业务项目多数也是与这些自有依赖独立的，它们同样在 Lerna 工具的控制范围之外。这时，我们仍然需要回到基本的 `npm link` 命令来建立本地的链接关系。但这可能会带来更多的问题。例如，假设你在 Lerna 中管理 editor 与 editor-ui 两个依赖，而业务项目 app 依赖了它们，这时候你不难把 editor 与 editor-ui 都 link 到 app 下。但这时的链接关系很容易被破坏，考虑下面的工作流：

1. 你为了修复 app 中 editor 的一些问题，更新了 editor 的代码，并在本地验证通过。
2. 你 `npm publish` 了 editor 与 editor-ui 的新版本。
3. 你在 app 中 `npm install editor editor-ui` 并提交相应的改动。

Boom！执行了最后一步后，不光 app 与 editor 之间的链接关系会被破坏，editor 与 editor-ui 之间的链接关系也会被破坏。这就是软链接的坏处了：下游的变更也会影响上游。这时，你需要重新做一次 `lerna bootstrap` 与 `npm link` 才能把这些依赖关系重新建立好，对于频繁迭代的业务项目来说，这是相当棘手的。对这个问题，我们提出的变通方案包括两部分：

* 可以部署一个专门用于依赖安装的业务项目环境。
* 可以编写自己的 link 命令来替代 `npm link`。

前者听起来麻烦，但实际上只需要把 app 目录复制一份即可。假设复制后得到了 app-deps 目录，那么:

* 将 editor-ui 与 editor 都 link 到 app 目录下，使用它们在本地开发。
* 在需要更新依赖版本时，在 app-deps 目录下执行 `npm install editor` 即可。这不会 app 项目中破坏原有的链接关系。

当然，这时候 app 与 app-deps 之间的依赖可能不完全同步——这个问题只要有 pull 代码的习惯就能解决。另外的一种问题情形在于，如果下游的业务项目采用了 CNPM 等非 NPM 的包管理器来安装依赖，那么这时候原生的 link 命令容易失败。还是套用前面的例子，这时候我们可以在 editor 项目中建立 link 命令，来替代 `npm link`：

``` js
// link.js
const path = require('path');
const { exec } = require('./utils'); // 建议将 childProcess.exec 封装为 Promise

const target = process.argv[2];
console.log('Begin linking……');

if(!target) {
    console.warn('Invalid link target');
    return;
}

const baseDir = path.join(__dirname, '../');
// 区分相对路径与绝对路径
const targetDepsDir = target[0] === '/'
    ? path.join(target, 'node_modules/my-editor')
    : path.join(__dirname, '../', target, 'node_modules/my-editor');

console.log(`${baseDir} → ${targetDepsDir}`);

exec(`rm -rf ${targetDepsDir} && ln -s ${baseDir} ${targetDepsDir}`)
.then(() => {
    console.log('🌈 Link done!');
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
```

这样只要在 editor 的 `package.json` 中增加一条 `"link": "node ./link.js"` 配置，就能通过 `npm link path/to/app` 的形式来完成链接了。这个链接操作跳过了不少中间步骤，因此比 NPM 原生的 link 速度要高得多，也能适配 CNPM 安装的业务项目。

对于「自有依赖 → 下游业务」的情形，这两个方式基本能保证开发节奏的顺畅。但还有一个问题，就是「上游依赖 → 自有依赖」的时候，仍然可能需要折腾。这对应于什么情况呢？

一般来说，最上游的基础库应当是相当稳定的。但是你同样可能需要修改甚至维护这样的基础库。比如，我们的 editor 编辑器依赖了我们开源的历史状态管理库 [StateShot](https://github.com/gaoding-inc/stateshot)，这时候就需要本地链接 StateShot 到 editor 中了。

这个场景不能继续前面的 `npm link` 套路吗？当然可以，不过上游的基础库并不需要频繁的迭代来同步时，我们建议使用 `npm pack` 命令来替代 link，以保证依赖结构的稳定性。如何使用这个命令呢？只需要这样：

1. 假设你有上游的 base 包，那么在它的目录下构建它之后，运行 `npm pack`。
2. pack 生成 `base.tgz` 之后，在 Lerna 管理的 editor 包下运行 `npm install path/to/base.tgz`。 
3. `lerna bootstrap` 保证链接关系正确。

pack 的好处在于避开了软链接的坑，还能更真实地模拟一个包从发布到安装的流程，这对于保证发布的包能够正常安装使用来说，是很有用的。


## 总结
前端的工程化还在演化之中，从最简单的 `npm install` 到各色命令与工具，相信未来的趋势一定是能够让我们更加省心地维护好更大规模的项目，也希望文中的一些实践能够对前端同学有所帮助。
