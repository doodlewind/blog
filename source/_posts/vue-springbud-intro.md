categories: Note

tags:

- Web
- JS

date: 2016-10-11

toc: true

title: Vue + Webpack 多页面多公共 Chunk 实例模板
---

[vue-springbud](https://github.com/doodlewind/vue-springbud) 是一个整合了 Vue + Webpack 多页面、多公共 chunk 支持的示例模板，区分了生产环境和开发环境的打包脚本，同时提供了对 jQuery 等传统类库的支持。

<!--more-->

## 特性
* 包含最简的多页面、多公共依赖下的 Webpack 配置示例，方便直接上手修改。
* 包含最简的 Vue 2.0 组件和 jQuery 导入示例，Vue 的 Demo 还体现了组件的嵌套。
* 支持 `css-loader` 和 `babel-loader` 插件。
* 各入口 HTML 由 `HtmlWebpackPlugin` 从模板生成，模板可以直接自定义。
* 支持 `dev` 和 `prod` 两种打包模式，`prod` 下支持 chunkhash 值，且两种模式均带 Sourcemap。
* 可参数化定制打包输出目录，以适配各后端框架。


## 运行
由 npm 安装：

``` text
npm install vue-springbud
```

构建带 `watch` 功能的开发环境，启动后可用本地任意 Web Server 调试输出文件：

``` text
npm run dev
```

构建生产环境，输出文件会打上 chunkhash 值：

``` text
npm run prod
```


## 结构
前端多个入口页面依赖多个公用模块的一般化情景，可以简化为如下图所示的情形。下图中的 `lib-a-b-c` 和 `lib-b-c` 都是跨页面的公用模块。因此，在打包时，这两个公用模块可以使用 Webpack 的插件进行抽取优化，具体的配置文件在下文示例中有详细的注释。另外，`lib-a-b-c` 在 `c.html` 中启用了延迟加载效果，可在浏览器中打开 `c.html` 查看网络调试器，页面加载完成后 5 秒后方触发下载 `lib-a-b-c` 对应的 chunk 执行。

``` text
.
├── a.html
│   └── a
│       ├── a-1
│       ├── a-2
│       ├── lib-a-b-c
│       └── vue
├── b.html
│   └── b
│       ├── b-1
│       ├── lib-a-b-c
│       ├── lib-b-c
│       └── jquery
└── c.html
    └── c
        ├── lib-b-c
        └── lib-a-b-c
```

这个依赖关系下，对应的项目目录结构如下：

``` text
.
├── README.md
├── app
│   ├── a.js                # 页面 A 入口
│   ├── b.js                # 页面 B 入口
│   ├── c.js                # 页面 C 入口
│   ├── components
│   │   ├── App.vue         # Vue 父组件
│   │   └── Child.vue       # Vue 子组件
│   ├── modules
│   │   ├── a-1.js          # 页面 A 依赖 1
│   │   ├── a-2.js          # 页面 A 依赖 2
│   │   ├── b-1.js          # 页面 B 依赖
│   │   ├── lib-a-b-c.js    # 页面 A/B/C 公共依赖
│   │   └── lib-b-c.js      # 页面 B/C 公共依赖
│   └── templates
│       ├── a.html          # 页面 A HTML 模板
│       ├── b.html          # 页面 B HTML 模板
│       └── c.html          # 页面 C HTML 模板
├── dist                    # bundle 输出目录
├── html                    # HTML 输出目录
├── node_modules
├── package.json
└── resources               # 未走 Webpack 资源目录
```

对打包结果的期望如下：

``` text
.
├── 3.chunk.js                # C 的延迟加载 chunk
├── a.bundle.js               # A entry chunk
├── b.bundle.js               # B entry chunk
├── c.bundle.js               # C entry chunk
├── commons-a-b-c.bundle.js   # A/B/C 公共 chunk
└── commons-b-c.bundle.js     # B/C 公共 chunk
```


## 实现
Webpack 需按照实际的依赖关系，在配置文件中定义具体的打包与代码分割方案。该配置在 `config.js` 中定义。对于 Webpack 入门难点之一的依赖管理配置，在注释中给出了说明。

``` js
// 已略去部分无关配置代码
module.exports = {
  // 按照页面数量，声明多个入口
  entry: {
    a: "./app/a",
    b: "./app/b",
    c: "./app/c"
  },
  plugins: [
    // 将 jQuery 作为全局依赖引入
    // 在打包时发现 $ 的块会在全局作用域打入 jQuery
    // 该方法不支持延时按需加载
    // 若需要延迟加载 jQuery，则需要按照 require.ensure 引入 jQuery
    new ProvidePlugin({
      $: 'jquery'
    }),

    // 代码分隔配置
    // CommonsChunkPlugin 合并处理的最小单位是 chunks 而非单个模块
    new CommonsChunkPlugin({
      // 抽取 b 和 c 两个 entry chunk 的公用依赖到 commons-b-c
      name: "commons-b-c",
      // 使用 entry 中的 key 引用 chunk，而非文件名或模块名
      chunks: ["b", "c"]
    }),
    // 注意抽取依赖的执行顺序
    // 需先抽取 b 和 c 后，将结果返回给抽取 a/b/c 的 CommonsChunkPlugin
    // 即在提取 abc 三者的公用 chunk 时，不能再次引入 b 和 c
    // 需从已经抽取了 b 和 c 公用依赖的 commons-b-c 引入
    new CommonsChunkPlugin({
      name: "commons-a-b-c",
      // 从 commons-b-c 引入 b 和 c
      chunks: ["a", "commons-b-c"]
    }),

    // 生成供后端框架渲染的 HTML 文件
    new HtmlWebpackPlugin({
      // 输出文件名
      filename: path.join(HTML_PATH, 'a.html'),
      // 模板路径
      template: 'app/templates/a.html',
      // 注入的 chunk 名，chunk 将作为 <script> 标签注入到模板 <body> 尾部
      // 注意顺序与实际依赖关系有关
      chunks: ['commons-a-b-c', 'a']
    }),
    new HtmlWebpackPlugin({
      filename: path.join(HTML_PATH, 'b.html'),
      template: 'app/templates/b.html',
      chunks: ['commons-a-b-c', 'commons-b-c', 'b']
    }),
    new HtmlWebpackPlugin({
      filename: path.join(HTML_PATH, 'c.html'),
      template: 'app/templates/c.html',
      chunks: ['commons-a-b-c', 'commons-b-c', 'c']
    }),
  ],
}
```


## 配置
vue-springbud 支持通过修改 `config.js` 中的配置变量，适配各后端框架：

* `BUNDLE_PATH`: 输出的 JS bundle 文件路径
* `HTML_PATH`: 输出的 HTML 文件路径

对暂时不需要通过 Webpack 引入的各静态文件，可放置在 `resource` 或其它后端框架对应的静态资源目录，然后即可在相应的模板 HTML 中直接通过标签引入这些静态资源。
