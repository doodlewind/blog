categories: Note

tags:

- Web
- Blog

date: 2015-05-28

toc: true

title: 为 Hexo 配置 Gitcafe-Pages
---

为了增强稳定性和可访问性（主要是电信 3G 网络），这个博客已从 [USTC Freeshell](https://freeshell.ustc.edu.cn/) 迁移到了 [Gitcafe](https://gitcafe.com/)。

完成下文的配置后，只需编辑并保存本地的 Markdown 文件后，一键 `hexo deploy` 就可以完成到 Gitcafe 的部署。<!--more-->事实上这也能反映出静态博客生成器的一大优点：本地的 Markdown 博文在手，就不用担心服务器出什么三长两短了（当然了，这样本地备份就更重要了。Time Machine 可以满足这方面的需求）。并且，位于七牛的图床以绝对链接形式写入了博文，这样在迁移时也不需要担心二进制文件的管理问题了。

整个迁移过程的实现本来应该很简单：只要修改 Hexo 的配置，让 `hexo deploy` 能 push 到一个 Gitcafe Pages 的 Repo 上就行了。但由于每个 Gitcafe 帐号只能使用一个支持绑定自定义域名的 Gitcafe Pages，从而需要在申请新账号开 Repo 的过程上费点周折。下面是迁移过程的一些记录。

## SSH 公钥配置

### 生成公钥
在注册一个新 Gitcafe 账号后，为通过 ssh 连接 Gitcafe 服务器，需要生成一套额外的 ssh 公私钥对。

``` text
$ ssh-keygen -t rsa -C "my@gitcafe.email.address" -f ~/.ssh/gitcafe
```

然后会被要求输入 passphase 的为私钥加密。后面每次在 Hexo 部署时，都需要输入这个 passphase 才行。完成后可以看到自己的公钥 `fingerprint` 和 `randomart image`。

``` text
Generating public/private rsa key pair.
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /Users/ewind/.ssh/gitcafe.
Your public key has been saved in /Users/ewind/.ssh/gitcafe.pub.
The key fingerprint is:
07:d3:24:b2:4d:75:3a:57:02:32:ef:d8:93:3b:bc:de ewind@mail.ustc.edu.cn
The key's randomart image is:
+--[ RSA 2048]----+
|      . =.+.o .  |
|       = B o o   |
|      . + = .    |
|         * +     |
|        S *      |
|         o o     |
|          +      |
|           +     |
|         .o E    |
+-----------------+
```

### 配置公钥
修改 `~/.ssh/config` 中的配置文件，在末尾加入：

```
Host gitcafe.com www.gitcafe.com
  IdentityFile ~/.ssh/gitcafe
```

再执行 `$ cat ~/.ssh/gitcafe.pub` 并复制所有内容到 [Gitcafe 配置页](https://gitcafe.com/account/public_keys/new)的相应输入框中，即可完成 SSH 配置。


## Gitcafe 与 Git 配置

### Gitcafe
在 Gitcafe 上[新建一个项目](https://gitcafe.com/projects/new)，并将项目名设置为与 Gitcafe 账户名相同，即可将此项目 Repo 设定为 Gitcafe Pages。

### Git
新建了 Gitcafe 的项目后，需要配置一下本机的 Git 用户信息。

``` text
$ git config --global user.email 'my@gitcafe.email.address'
$ git config --global user.name 'gitcafe-user-name'
```

在使用 Hexo 同步博文到 Gitcafe Pages 前，需要给这个 Repo 添加一个 `gitcate-pages` 分支。进入 Hexo 目录下的 `.deploy` 目录，提交一个 commit 到主页即可。

``` text
cd /path/to/hexo-blog/.deploy
echo 'Hello, world' > index.html
git init
git add .
git commit -a -m "Hello World"
git remote add origin git@gitcafe.com:ewind-us/ewind-us.git
git checkout -b gitcafe-pages
git push origin gitcafe-pages
```

这时候就可以直接访问 `username.gitcafe.io` 来查看效果了！


## Hexo 配置
SSH 和 Git 的准备工作完成后，就可以使用 Hexo 的一键部署工具来方便地部署主页了。修改 Hexo 博客目录下的 `_config.yml` 文件，将生成的静态文件部署到个人主页项目的 `gitcafe-pages` 分支下。

``` text
deploy:
  type: github
  repository: git@gitcafe.com:ewind-us/ewind-us.git
  branch: gitcafe-pages
```


## 域名绑定

### DNS 设置
在 [DNSPod](http://dnspod.cn) 等 DNS 服务提供商的后台里，将自己的域名 CNAME 到 `gitcafe.io` 即可。注意不是 `username.gitcafe.io` 哦。

### Gitcafe 设置
在 Gitcafe 主页项目的管理页面中的 *Pages* 服务标签下，添加自己的域名即可。注意不是基本设置的标签，是 Pages 服务的标签哦。

### 浏览器设置
DNS 设置可能不会立刻生效，需要清除缓存。

* 对 Safari，按下 `cmd + shift + E` 即可清除缓存。
* 对 Chrome，在标题栏中输入 `chrome://net-internals/#dns`，点击 `Clear host cache` 即可清除 Chrome 自带的 DNS 缓存。


## 部署

### 单个 Gitcafe 帐号
对一台终端只有一个 Gitcafe 帐号登录的情形，部署时直接使用 Hexo 的部署命令即可。

``` text
hexo deploy
```

如果有一些 Tags 计数或更换主题后出现的小问题，可以在部署前执行一句 `hexo clean` 清除 Hexo 生成的缓存。

### 多个 Gitcafe 帐号
每个 Gitcafe 帐号只支持一个 Gitcafe Pages，因此如果为博客单独建立了一个新账号，那么可以将如下脚本保存为 `deploy.sh` 后，每次编辑博文后直接一句 `./deploy.sh` 完成部署。

``` text
#! /bin/bash
eval `ssh-agent`

# choose the private key
ssh-add ~/.ssh/gitcafe

# do hexo deploy stuff
hexo clean
hexo deploy

# quit ssh-agent
eval `ssh-agent -k`
```

完成后，真是对静态博客的管理方式更加放心了呢 XD
