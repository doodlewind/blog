categories: Note

tags:

- Blog

date:  2016-04-18

toc: false

title: 博客迁移到 Coding
---

由于 [Gitcafe](https://gitcafe.com) 即将停止服务，这个博客已经迁移到了 [Coding](https://coding.net) 平台下。不影响正常访问。

<!--more-->

为 Hexo 修改 `git deploy` 目标时，无法直接通过修改 Hexo 配置文件的参数来解决（访问 Coding 的凭据和访问 Gitcafe 的不同）。删除博客目录下的 `.deploy_git` 目录，重新 `git init` 出一个新 Repo 来同步博文到 Coding 即可。

如果 Hexo 部署失败，可以尝试下面的脚本（Hexo 的 deployer-git 插件需要正确配置）。将该脚本存储到博客根目录下执行即可。

``` text
rm -rf .deploy_git/*
cd .deploy_git && git init
cd ..
hexo clean && hexo deploy -g
```
