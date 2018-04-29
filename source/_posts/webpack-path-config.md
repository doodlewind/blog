categories: Note

tags:

- JS
- Web

date: 2017-02-12

toc: true

title: Webpack 1.x 常用路径配置整理
---

Webpack 功能之强是毋庸置疑的。然而在使用时，有太多方式实现同一件事的设计也使得学习曲线也较为陡峭。下面整理了若干处理 Webpack 项目路径时常用的配置参数。

<!--more-->

## 基础
作为一个模块打包工具，Webpack 的核心功能即是通过 `require` 语法相互依赖的多个 JS 文件组合为一个 `bundle.js` 文件。例如，当前目录下存在两个 JS 文件 `foo.js` 与 `bar.js`，它们的内容分别为：

``` js
// foo.js 为项目入口
const bar = require('./bar')
bar.demo()
```

``` js
// bar.js 为被引入的模块
module.exports = {
  demo () { console.log('bar') }
}
```

显然在终端中执行 `node foo.js` 后，能获得 `bar` 的输出。但浏览器环境下并不能直接处理这样的 `require` 关系。通过 Webpack 即可将它们打包为一个在浏览器中通过 `<script>` 标签引入时，也能在浏览器的 console 中正常输出 `bar` 的 `bundle.js` 文件：

``` text
$ webpack foo.js bundle.js
```

执行后 `foo.js` 和它依赖的所有模块将被合并在一个 `bundle.js` 中。不仅在终端中执行 `node bundle.js` 和执行 `node foo.js` 能获得同样的输出，将 `bundle.js` 通过 `<script>` 标签引入浏览器环境后，也能在 console 中看到正常的输出。注意，我们并不需要在打包命令中提及被依赖的 `bar.js`，只需要指定 `foo.js` 作为入口，Webpack 即可通过静态分析自动引入依赖，打出完整的包。


## 配置文件
上述最基本的打包流程，可以通过配置文件来实现更多的控制。作为基础的配置文件示例，可在同目录下新建 `webpack.config.js` 并写入如下内容：

``` js
module.exports = {
  entry: {
    foo: './foo'
  },
  output: {
    filename: 'bundle.js'
  }
}
```

然后在该目录下执行 `webpack` 命令，即可获得相同的打包结果。


## 多入口
一般的多页 Web 应用下，每个页面都有一个单独的 JS 入口文件。若上例中单一的 `foo.js` 入口改为 `foo1.js` 和 `foo2.js` 两个入口，那么在 Webpack 中，按如下方式修改配置文件即可：

``` js
module.exports = {
  entry: {
    foo1: './foo1',
    foo2: './foo2'
  },
  output: {
    // 添加 [name] 字段以区分不同入口打出的 bundle
	filename: '[name].bundle.js'
  }
}
```


## 公共依赖提取
多页应用中各个入口文件经常会依赖相同的第三方库。在默认的打包策略中，每个入口包的依赖都是单独处理的，从而使得第三方库的内容重复出现在每一个输出文件中。这种情况下，可将第三方库的依赖提取到单独的 `vender` 块中，每个页面通过两个 `<script>` 标签，先引入 `vender` 后引入本页面的业务入口文件，即可实现公共依赖包的复用。配置示例如下：

``` js
const webpack = require('webpack')

module.exports = {
  entry: {
    foo1: './foo1',
    foo2: './foo2',
    // 提取 foo1 和 foo2 中的 vue 和 jquery
    vendor: ['vue', 'jquery']
  },
  output: {
    // 添加 [name] 字段以区分不同入口打出的 bundle
	filename: '[name].bundle.js'
  },
  plugins: {
    // 提取第三方库公共 Chunk
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor', filename: 'vendor.chunk.js'
    })
  }
}
```

这样在 `foo1.js` 和 `foo2.js` 中引入 vue 和 jQuery 等依赖后，这些公用依赖就会被提取到 `vendor.chunk.js` 中了（由于在配置文件中引入了 Webpack，故运行 `webpack` 命令前需确保当前目录下也安装了 `webpack` ）。


## 项目根目录
实际项目目录结构中往往存在较深的层级。默认情况下模块 A 只能通过相对路径访问另一个路径中的模块 B，这容易造成难以维护的相对路径：

``` js
const B = require('../../../foo/bar/B')
```

这时可通过 Webpack 中 `resolve` 字段指定项目根目录：

``` js
// webpack.config.js
const path = require('path')

module.exports = {
  entry: {
    foo: './foo'
  },
  output: {
    filename: 'bundle.js'
  },
  resolve: {
    root: path.resolve('./my/path')
  }
}
```

这样，在引入目录 `my/path` 下的模块 B 时，直接 `require('B')` 即可找到模块。


## CSS 路径解析
在配置 Loader 引入 CSS 文件时，也容易出现只能用相对路径引入 CSS 的情况。对此，如下修改 `resolve` 字段即可：

``` js
resolve: {
  root: path.resolve('./app'),
  modulesDirectories: ['node_modules', 'my/css/path']
}
```

默认情况下 `modulesDirectories` 仅为 `node_modules` 目录。添加 `my/css/path` 后即可通过 `@import 'foo.css'` 引入 `my/css/path/foo.css` 了。
