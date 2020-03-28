categories: Note

tags:

- Web
- Blog

date: 2015-01-26

toc: true

title: 拥抱 Hexo
---

[Hexo](http://hexo.io) 是什么？一个比 WordPress 轻量得多，也容易掌控得多的博客系统。通过 Hexo，你可以直接把纯文本或 Markdown 格式的博文生成静态网站。<!--more-->它的使用情境非常易于理解：把博文文件（*平凡的 Markdown 文本格式，而非丑陋的数据库格式*）保存在本地后，只要通过一句简单的命令，Hexo 就会依据配置（主题 / 插件等）在本机上生成一个相应静态网站。通过 Hexo 自带的服务器预览无误后，即可再用一句命令将这个静态网站部署到 Github / Gitcafe 等代码托管站，或者用 git / ftp 等方式同步到自己的服务器里。这样，只要服务器支持解析最基本的静态网页文件，就能把生成的博客扔在上面运行。

Hexo 机制最诱人之处在于，**彻底摆脱了数据库对博客系统的束缚**，再也不需要一个带着 WYSIWYG 编辑器的博客后台来编辑了（事实上，WordPress 的数据库越来越接近 CMS 了。它的备份结构冗长，完全不适合直接编辑）。要想修改博文，只要在本地博客目录下新建文件，保存后重新生成静态网站即可。而对于图片等二进制文件，我们完全可以将其部署到七牛一类的云服务供应商，而避免上传到自己的服务器上。这样只需在博文中给出一个指向云存储图片的外链，即可「一劳永逸」地解决它们的管理问题。相比需要在服务器端建立完整的 XAMP 技术栈（说什么 15 分钟安装，逗小白呢）上的 Wordpress，Hexo 在服务器端甚至完全没有特殊的依赖，只要把静态文件同步进来就能跑。这样也大大降低了维护难度。

对于想要折腾的同学，Hexo 也有足够的可定制性。譬如要想切换 Hexo 的主题，可以从 Github 上色彩缤纷的主题中直接 clone 一份。而若需要更进一步的自定义，也就可以通过修改 Hexo 博客目录下的 themes 中的相应模板来实现。对于博客迁移的需求，Hexo 也提供了插件，通过简单的命令即可从原博客中导出博文内容。

下面就是部署及使用 Hexo 的简单流程了：

## Install
在安装了 git 和 node.js 的 *nix 系统上，Hexo 可以用 node 的包管理工具 npm 轻松地完成安装。依次在终端里执行以下几句命令即可：

``` text
$ npm install hexo -g
$ hexo init blog
$ cd blog
$ npm install
```

接下来，就是下面这条命令启动 Hexo 用于预览博客的本地服务器。

``` text
hexo server
```

打开浏览器访问 `localhost:4000` 感受一下 Hexo 默认的博客布局吧~然后就是时候在博客目录下的 `_post` 子目录里添加博文了。

## Blogging
Hexo 的博文起始部分需要一点特别的 YAML 格式以便博文的分类。一般需要包括

* `categories` 类别（不可继承）
* `tags` 标签（可继承）
* `date` 日期
* `title` 标题

然后用 `---` 标记结束即可，譬如这样：

``` text
categories: Note

tags:
- Web
- Blog

date: 2015-01-26
title: 拥抱 Hexo
---
```

然后就可以按照正常的 Markdown 格式编写博客了。另一个十分实用的功能是在文章的某个地方加上 `<!--more-->` 标示，这样在博客首页显示的文章内容就会到此为止。

在保存完成后，Hexo 会自动更新静态页面。我们可以在浏览器里实时地刷新来预览更改（话说 gulp 通过 WebSocket 做到了页面保存时自动刷新浏览器页面，不知道这个 feature 会不会加入 Hexo 中）。

## Deploy
对于一些博客的细节设置，我们可以在博客目录下的 `_config.yml` 中进行修改。譬如修改站点名称 / 路径 / 插件 / 日期格式等。不过这里最重要的一项设置应该还是部署，即 `deploy`

``` text
deploy:
  type: git
  message: commit by hexo
  repo:
    github: https://github.com/ewind2009/hexo-posts
```

在这里我设置了 git 方式部署，设置完成后，即可通过

``` text
hexo deploy
```

将这个站点（而不是 Markdown 博文）发布到 Github 等代码托管站上。部署时会提示输入响应站点的用户名 / 密码。

最后还有一点值得注意的地方，就是 Hexo 的默认主题使用了来自 Google 托管的 jQuery 库，这在天朝的访问性十分呵呵呢……通过简单的定制，就可以避免这个会大大延长页面加载时间的问题：对默认主题（landscape），用文本编辑器修改

``` text
hexo/theme/landscape/_partial/after-footer.ejs
```

中调用了 Google CDN 的 `<script>` 标签的 `src` 属性即可。最简便的方法是使用数字公司的 CDN 服务，只需用 `ajax.useso.com` 替换掉原有 URL 中的 Google 主机名即可。但对于其它主题，这个标签也可能位于 `header.ejs` 等其它模板文件中，查找时稍加注意即可。

在 Hexo 的使用中也可能遇上这样的情况：你关闭了 Hexo 的服务器，或者更改了 Hexo 的一些与 CSS 相关的设定（如是否显示代码行号），然后修改并保存了一篇你已经生成过的文章。这时候，在重启 Hexo 后可能会发现你的更改没有更新到静态文件中。这时候就需要简单地

``` text
hexo clean
```

清理后重新生成静态站点即可。

最后，强烈推荐将博客中的图片统一上传到七牛之类的免费云存储站点上，在博文中用形如 `[pic_demo](http://example.com/demo.jpg)` 的绝对路径指向图片资源。这样一来就不需要再为日后可能的迁移而烦恼了。
