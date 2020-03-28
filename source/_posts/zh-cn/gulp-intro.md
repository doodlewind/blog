categories: Note

tags:

- Web
- JS

date:  2016-08-07

toc: true

title: Gulp 自动化构建入门
---

随着前端项目复杂度的提升与各种类库的引入，在发布前人工处理 JS 和 CSS 等静态文件的方式逐渐显现出了其弊端。虽然静态文件在没有经过预处理的情况下也能直接上线，但未经合并和压缩的脚本和样式不仅存在请求数过多、体积过大等性能问题，代码中未处理的注释也可能造成信息的泄露。

<!--more-->

当然，现代的 IDE 都附带了强大的构建和发布功能，不过这些功能实质上都是命令行构建工具的图形化界面。而在 Web 前端方向上，框架的百花齐放导致 IDE 产商难以对每个构建工具都提供一个完整的图形界面。并且，若纯粹使用 IDE 的构建功能，在新建和发布项目时需要许多难以文档化描述的 GUI 操作，实际上提高了自动化构建的难度。

为了解决前端自动化构建的问题，这里引入了基于 Node.js 的 Gulp 构建工具，逐步搭建起一套基于轻量级组件的自动构建流程。


## 需求
自动化构建除了自动预处理以外，也不应降低开发时的体验。对于 JS 这样的脚本语言，每次保存代码文件时都可以进行即时构建（毕竟没有做实质上的编译）。总体而言，一个初步完善的构建流程，需要满足以下这些需求：

* 定制各类文件的源码路径和发布路径，如将 `src/js` 发布到 `app/js` 等。
* 将为项目编写的 **JavaScript 文件压缩合并**，即所谓的 uglify 处理。
* 对样式进行预处理，如 **SASS** 的编译、添加浏览器前缀、压缩合并等。
* 构建 **HTML** 文件，如将 HTML 源文件中引用的多个样式标签替换为压缩后的一个。
* **监测文件改动**。每当修改、新增或删除文件时重新按需执行预处理流程。
* 根据测试环境和线上环境，**变更构建流程**。如测试时略过对脚本和样式的压缩。

以上这几点需求对一般的前端开发具有很强的普适性。Gulp 也提供了成熟可靠的解决方案，从而优雅且高效地将构建过程流程化。


## Why Gulp
在初步选型时，可供使用的成熟解决方案一共有三个：Grunt、Gulp 和 Webpack。选择 Gulp 主要是基于以下的几个原因：

1. Grunt 的构建过程需要在磁盘写临时文件，而基于 Node Stream 流概念的 Gulp 通过管道的方式，可将构建过程在内存中完成。
2. Grunt 只支持串行处理，但 Gulp 可并发处理任务。多个第三方 Benchmark 均显示 Gulp 速度更快。
3. Grunt 的配置基于配置文件，每项任务都需要写 JSON 风格的配置文件。而 Gulp 的配置基于 JS 的链式函数调用，代码量比 Grunt 少很多。
4. Webpack 的亮点是对 require 等模块语法的支持，对未引入模块机制的项目支持没有 Gulp 友好。
5. 到目前（2016 年 8 月）为止，三者中 Gulp 在 Github 上具有最高的 Star 数（超过 2 万个）。而 Webpack 和 Grunt 的 Star 均为 1 万余个。

可以看出 Gulp 在性能和易用性上均具有比较优势，这个选择既非盲目追新，也非墨守成规。


## Node 基础
当前的前端构建工具链无一例外都是基于 Node.js 生态的。因此在引入 Gulp 前，首先对 Node 进行一些简要的介绍。

### 概念
浏览器产商的军备竞赛，直接导致浏览器中的 JavaScript 成为了目前执行最快的脚本语言（比 Python 2 快三倍以上）。而 Node 充分利用了 Google V8 这个高效的 JS 引擎，使得 JS 具有了在服务端工作的能力。Node 带动了第三方 JS 类库的发展，从而催生了 NPM 这一实用的 JS 包管理工具，它相当于 `apt-get` 之于 Ubuntu，`pip` 之于 Python，提升了 JS 工程化的能力。NPM 上的包具有很大的多样性，除了安装用于服务器的 JS 类库之外，也可以安装用于浏览器等其它环境的包。

需要注意的是，在前端自动化构建的过程中，Node 并非作为服务器提供 Web 服务，只是提供了用于执行 Gulp 的环境而已。NPM 在此过程中则用于安装 Gulp 及其插件。

### 安装 Node
[Node 项目主页](https://nodejs.org/en/)上提供了跨平台的 Node 安装包，在 Windows 下只需在按照提示操作后重启，即可完成安装。在 Linux 和 OS X 这类不需要重启即可修改环境变量的操作系统上，安装完 Node 后是可以直接运行的。在终端下执行 `node -v` 命令即可查看 Node 的版本信息，而 `node -h` 则可查看帮助。

一个 JS 工程常常是需要许多第三方库的。NPM 作为 Node.js 的包管理工具，能够便捷地安装并管理这些依赖文件。在安装完成 Node 后，可以直接运行 `npm -v` 命令查看 NPM 版本。以下是几个常用的 NPM 命令介绍。

### 初始化项目
`npm init` 命令会交互式地建立一个空的 JS 工程目录结构。执行结束后，会在当前目录下生成 `node_modules` 目录和 `package.json` 文件。特别需要注意 `package.json` 这一文件，它是 Node 应用声明依赖的地方。

### 安装第三方库
`npm install xxx` 命令会安装库。但默认情况下安装的库是不会加入 `package.json` 作为项目的依赖的。推荐直接执行下面的命令以修改 `package.json` 从而将第三方库安装为依赖。

``` text
npm install --save-dev package1 package2 ...
```

基于 NPM 的某些系统级工具是可以在终端下运行的。对这些工具，可以用如下的方式安装。

``` text
npm install --global package
```

### 管理第三方库
`npm update` 命令可以升级全部或指定的依赖版本，而 `npm uninstall xxx` 命令则可以卸载之。

### CNPM
由于国内网络条件问题，部分 NPM 库可能难以下载。通过淘宝维护的 [CNPM](http://npm.taobao.org) 可以解决这一问题。安装 CNPM 也只需一条命令即可。

``` text
npm install -g cnpm --registry=https://registry.npm.taobao.org
```

CNPM 的功能和 NPM 完全一致，只需将 `$ npm` 替换为 `$ cnpm` 即可。


## Gulp 基础
Gulp 是一个易用且高效的自动化构建工具。通过 NPM 可以管理其插件，实现各种构建功能。

### 安装
在安装好 Node 之后，就可以安装并配置 Gulp 了。

首先将 Gulp 安装到全局。
``` text
npm install --global gulp-cli
```

然后初始化项目。
``` text
npm init
```

接下来将 Gulp 安装为项目依赖。
``` text
npm install --save-dev gulp
```

这样就完成了安装。作为测试，在项目根目录创建 `gulpfile.js` 并写入如下内容：
``` js
// 导入 gulp 模块
var gulp = require('gulp');
gulp.task('default', function() {
    // 在这里编写默认的 Gulp Task
});
```

最后执行 Gulp 即可。

``` text
gulp
```

命令执行并结束，说明 Gulp 完成了安装和配置。

### 编写 Gulp Task
上面的代码中，我们定义了 `default` 这一默认任务。在 Gulp 中可以便捷地自定义任务，并将多个任务组合成更大的任务。例如要自定义一个 Hello World 任务，修改 `gulpfile.js` 如下即可。

``` js
var gulp = require('gulp');
gulp.task('hello-world', function() {
    console.log('Hello World!');
});
```

这样在终端执行 `gulp hello-world` 就能输出 `Hello World!` 了。

下文中的 Gulp 任务均假定目录结构如下所示，src 为所有静态文件的源目录， resource 为 JS 和 CSS 的目标目录，而 view 为 HTML 的目标目录。

``` text
├── resource
│   ├── css
│   └── js
├── src
│   ├── css
│   ├── index.html
│   └── js
└── view
    └── index.html
```

首先，在 Gulp 任务里可以利用管道功能传递文件，如下所示。

``` text
gulp.task('copy-css', function() {
    return gulp.src('src/css/**/*')
        .pipe(gulp.dest('resource/css'));
});
```

上面的 `copy-css` 任务会将 `src/css` 目录中的所有文件复制到 `resource/css` 目录中，其中 `src/css/**/*` 表示递归复制所有文件。如果不递归，只复制源目录下的 CSS 文件，也可以写成 `src/css/*.css` 的方式。

对于其它格式的文件，也可以用同样的方法指定源目录和目标目录。

### 使用 Gulp Watch
Gulp Watch 可以监测磁盘文件改动并触发任务。
``` js
gulp.task('my-watch', function () {
    return gulp.watch('src/css/**/*', ['copy-css'];
});
```

这样只要执行 `gulp my-watch` 后，即可在 CSS 目录变动时自动执行之前定义的 `copy-css` 任务了。可以定义不同的 Watch 任务监视不同的目录，这样在修改样式的时候就不会触发针对脚本和图片等无关文件的冗余任务了。


## Gulp 插件
Gulp 默认的 Task 和 Watch 机制可以和下面介绍的各类插件实现无缝结合，具备很高的可定制性。下文中介绍的插件可以用一条命令一次性完成安装。

在 `gulpfile.js` 中要使用这些插件，只需按照下面的形式导入插件即可。
``` js
var sass = require('gulp-ruby-sass');
var cssnano = require('gulp-cssnano');
// ...
```

### SASS 编译
SASS 自动编译任务 `pack-sass` 如下所示。
``` js
gulp.task("pack-sass", function() {
    return sass('src/sass/*.scss', { style: 'expanded' })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('src/css'));
});
```


### JS / CSS 压缩
gulp-uglify 插件可以实现对 JS 代码文件的压缩，而 gulp-cssnano 插件实现了对 CSS 文件的压缩。示例任务如下：

``` js
// 压缩 js
gulp.task("build-js", function() {
    return sass('src/js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('resource/js'));
});
// 压缩 css
gulp.task("build-css", function() {
    return sass('src/css/*.css')
        .pipe(cssnano())
        .pipe(gulp.dest('resource/css'));
});
```

### HTML 预处理
上文中对样式和脚本的处理方式尚存在一个问题：在 HTML 中引用 CSS 和 JS 的路径无法根据 Gulp Task 中定义的发布路径自动修改。并且，实际项目中，有些自定义的脚本需要合并与压缩，jQuery 等已经压缩的库文件则不需要再次压缩。但所有脚本在上面的任务中都会被直接压缩。为了提高对静态资源处理的定制性，需要引入 useref 这一插件以进一步实现 HTML 预处理。

引入 useref 后，可以在 HTML 文件中书写如下的标签，定义脚本和样式的合并路径。

``` html
<script src="/resource/js/common/jquery-1.11.0.min.js"></script>
<script src="/resource/js/common/jquery.cookie.js"></script>
<!-- build:js /resource/js/index.min.js -->
<script src="js/default/switchpicture.js"></script>
<script src="js/default/encode.js"></script>
<script src="js/default/index.js"></script>
<script src="js/default/login.js"></script>
<!-- endbuild -->
```

上面的示例中，被 `build` 包裹起来的后四个标签会按照 `build` 中声明的路径，合并成一个脚本文件（只是简单合并，不包含压缩处理）。而前两个标签则会保持原样。**注意，需要合并的脚本路径可采用相对路径，而不需合并的脚本以及合并后输出的脚本，其路径均为绝对路径。**

最后添加对应的 Gulp Task 即可实现按需合并脚本和样式了。

``` js
gulp.task('useref', function () {
    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.min.js',uglify()))
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(gulp.dest('view'));
});
```

上面的 Task 利用了 gulp-if 来实现对不同文件的不同处理方式，最后输出处理过的 HTML 文件。

### 任务执行管理
Gulp 的一大特色在于其利用了 Node.js 的异步回调方式，实现了对任务的并发（不是并行）处理。如对 CSS 样式的构建和对 JS 的构建实际上相互独立，因而默认情况下这些任务都是并发执行的。

然而，实际项目中的构建流程是涉及顺序执行的。例如，应该在 SASS 编译任务完成后才能执行 CSS 任务，删除之前构建文件的 Clean 任务完成后才应当执行其它文件的构建任务等。

``` js
gulp.task('build-css', function () {
    sass(...);
    cssnano(...);
});
```

和 PHP 等脚本语言不同的是，上面的任务中 `sass` 和 `cssnano` 两个任务会并发执行，而不是等待 `sass` 完成后再执行下一个任务。引入 `run-sequence` 插件即可保证特定任务的串行性。

``` js
gulp.task('default', function(callback) {
    runSequence('clean', ['build-css', 'build-image'], 'build-html', callback);
});
```

在上面的示例中，`clean` 完成后可以并发执行 `build-css` 和 `build-image` 两个任务以预编译 SASS 并优化图片，这两个任务都完成后，才会执行 `build-html` 任务以替换 HTML 文件、合并压缩脚本和样式表。

能够自定义任务的执行顺序，表明 Gulp 有能力组合并构建出更加强大的前端工作流。最后，如果需要在测试环境中关闭压缩，在线上环境中启用，只需在 JS 中加入变量参数控制即可。

### More
尚未在项目中应用，但已有成熟插件的 Gulp 高级应用包括但不仅限于：

* PhpStorm 的 [Task Runner](https://www.jetbrains.com/help/phpstorm/2016.2/using-gulp-task-runner.html) 支持
* Git 部署
* Google Closure Compiler 优化并删除冗余 JS 代码
* 生成 Sprite 图
* 整合 Mocha 测试框架
* Karma 在多个浏览器上同步测试等

对 Gulp 的进阶使用，还有待后续的探索。
