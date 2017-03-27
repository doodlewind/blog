categories: Note

tags:

- JS
- Web

date: 2017-03-27

toc: true

title: Webpack HMR 的配置与回退策略
---

热加载（HMR）是 Webpack Dev Server 最强大的功能之一，页面源码的变更可以无需刷新地实时推送到页面上。以 vue 为例，一个最简的 HMR 配置策略如下所示：

<!--more-->

首先安装 `webpack-dev-server` 与前端 JS 库的 HMR 依赖（如 Vue 的 `vue-hot-reload-api`），而后编辑 `package.json` 中的命令：

``` js
{
  "scripts": {
    "dev-server": "webpack-dev-server --hot --inline"
  }
}
```

添加这一行代码后，运行 `npm run dev-server` 即可实现带 HMR 功能的 dev-server 引入。这也就相当于在完全没有修改业务代码的前提下，完成了 HMR 的引入（实际上这也确实是一个 opt-in 的特性）。而若需对 Webpack Dev Server 进行配置，可以编辑 `webpack.config.js` 中 `module. devServer` 的相关字段。

虽然 HMR 非常实用，但与 Webpack Dev Server 的集成也一定程度上影响了其泛用性。在一些场景下，我们仍然需要在开发时使用 Webpack 写入到磁盘的 bundle 文件，这时候就显然无法使用和 Dev Server 配套的 HMR 功能了。这带来了一个问题：如何在 Webpack 配置中实现既支持 HMR，又支持类似 `--watch` 的传统开发模式呢？

通过 NPM Scripts，可以很容易地区分带 HMR 和不带 HMR 的构建命令。例如如下的配置：

``` js
{
  "scripts": {
    "dev": "webpack --watch",
    "dev-server": "webpack-dev-server --hot --inline"
  }
}
```

就区分了两条构建开发包的命令，区别在于通过 `webpack` 的命令会将打包文件动态写入磁盘，而使用 `webpack-dev-server` 的命令可以在使用 `webpack` 配置文件的基础上，无缝引入 HMR 特性。这样，在开发环境不适合使用 HMR 的场合也可以通过 `npm run dev` 命令实现回退。
