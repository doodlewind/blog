categories: Note

tags:

- Web
- JS

date:  2016-09-03

toc: true

title: 轻量前端自动化脚手架 legs
---

[Legs](https://github.com/doodlewind/legs) (Light Easy Gulp Scaffold) 是一个基于 Gulp 的前端自动化构建模板，它按照实际需求定制了开箱即用的自动化功能<!--more-->，主要包括：

* Sass 构建自动化
* 可定制的 JS / CSS 合并压缩自动化
* 原生 HTML 模板
* 监控文件变更
* 本地调试服务器
* 可定制的文件输出路径及 HTML 扩展名，如 `.jsp` 或 `.php` 等
* 新页面生成器，可由模板自动生成新页面 HTML / CSS / JS / 测试用例


## 安装
首先安装 [node.js](https://nodejs.org/en) 和 [gulp](http://gulpjs.com) 作为全局依赖，注意 `npm` 可以用 [cnpm](https://npm.taobao.org) 替代：
``` text
[sudo] npm install --global gulp
```

然后下载 legs 到当前目录：
``` text
git clone https://github.com/doodlewind/legs.git
```

最后安装插件等依赖：
``` text
cd legs && npm install
```

完成安装后，运行自带服务器，在浏览器中访问 `localhost:8000/index.html` 查看效果即可：
``` text
gulp server
```

现在 gulp 将监测 src 目录下的文件改动，并自动输出变更的文件到 `resource` 目录下。同时，为 index 页面生成的 Mocha 测试用例，在 `/src/test/index/test.html` 可以访问。


## 目录结构
在生成默认的 `index.html` 后，Legs 的主干目录结构如下所示：

``` text
├── gulpfile.js
├── package.json
├── node_modules //用于浏览器和 Gulp 的 JS 库
└── src
    ├── html
    │   ├── index.html
    │   └── partials //通用 HTML 模板
    ├── js
    ├── sass
    │   ├── base
    │   ├── components
    │   ├── helpers
    │   ├── layout //页面主干样式
    │   │   └── index
    │   │       └── _main.scss
    │   └── style-index.scss
    ├── scaffold
    └── test
        └── index //测试用例
            ├── test.html
            └── test.js
```


## 命令
Legs 整合的开箱即用 Gulp Task 如下。可以修改 `gulpfile.js` 以定制新的命令。

### default
`gulp` 或 `gulp default` 命令全量构建 `src` 下各类资源到相应的输出目录。

### new
`gulp new -n foo` 自动生成如下的页面文件：

* `src/html/foo.html`
* `src/js/foo/main.js`
* `src/sass/style-foo.scss` 及其相应 Sass 子模块
* `src/test/foo/test.js` Mocha 测试用例

### watch
`gulp watch` 监控 `src` 目录的文件改动并触发 `gulp default`. 这个任务不会启动 gulp-webserver 本地服务器。

### server
`gulp server` 在运行 `gulp watch` 的同时开启了本地测试服务器，其根目录路径为 legs 所在目录路径。

### clean
`gulp clean` 移除所有输出目录和缓存目录下的文件。这个任务是 `default` 和 `watch` 执行的第一个子任务。所以，**不要将源文件直接放在输出目录**，否则它们将被 `clean` 清空。请将所有资源放置在源目录，让 gulp 自动生成输出目录下的文件。

### clean-cache
`gulp clean-cache` 清除：

* Sass 构建缓存文件
* 项目根目录下的 HTML 文件。这些文件实际上是输出到 HTML 目录前的缓存，同时供本地服务器测试用。实际上缓存没有必要手动清理，可在 legs 根目录下的 `.gitignore` 中添加 `.sass-cache` 和 `./*.html` 以在 VCS 中过滤掉缓存文件。


## 选项
可用的选项参数在 `gulpfile.js` 最上方定义，如下所示：

* `PRODUCTION`: `boolean`, 设为 `true` 时将启用 CSS 和 JS 压缩
* `HTML_EXT_NAME`: `string`, 输出到目标路径时的 HTML 文件扩展名
* `PORT`: `number`, 本地服务器端口号
* `PATH`: `json`, 指定源路径与输出路径，为相对于 `gulpfile.js` 位置的相对路径


## 备注
* 目前 Legs 适用于未引入 AMD 模块机制的前端项目中
* jQuery 等通用 JS 库文件无需手动复制到项目源 JS 目录下，可在 `npm install` 后直接从 `/node_modules/jquery...` 中导入
* 源 HTML 中引入的 `<build:js /xxx.js>` 标签为供 `useref` 插件自动合并之用，[插件文档地址](https://github.com/jonkemp/gulp-useref)
* Sass 和 JS 源文件语法错误不会影响 gulp 进程运行，但 `useref` 整合的源文件路径有误时 gulp 将强制退出，这也是构建工具崩溃的首要原因

希望这个简单的脚手架对前端开发自动化有所帮助，谢谢。
