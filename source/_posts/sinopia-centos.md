categories: Note

tags:

- Linux

date: 2016-12-10

toc: false

title: 在 CentOS 6 上配置私有 NPM 仓库
---

[Sinopia](https://github.com/rlidwka/sinopia) 是一个简单易用的私有 NPM 仓库服务器。在 CentOS 6 上安装时，遇到如下报错（Node 版本 6.9.1）

<!--more-->

``` text
#error This version of node/NAN/v8 requires a C++11 compiler
```

这是 CentOS 6 配套的 gcc 版本过低导致的。需要升级默认的 gcc 4.4.7 到支持 C++11 的 4.9，步骤如下：

首先按照 [SCL 官网文档](https://www.softwarecollections.org/en/scls/rhscl/devtoolset-3/) 安装 SCL 源：

``` text
sudo yum install centos-release-scl
sudo yum-config-manager --enable rhel-server-rhscl-7-rpms
```

完成后，不需继续安装全部的 devtoolset-3 依赖，只安装所需的 devtoolset-3-gcc-c++ 即可：

``` text
sudo yum install devtoolset-3-gcc-c++
```

临时启用 devtoolset-3：

``` text
scl enable devtoolset-3 bash
```

这时候 `gcc --version` 就会变成 4.9 的版本了。若要将默认 gcc 替换为该版本，方法如下：

``` text
echo "source /opt/rh/devtoolset-3/enable" >>/etc/profile
```

在更新 gcc 后，重新 `npm install -g sinopia` 即可完成安装。

Sinopia 启动后，默认只在 `http://localhost:4873` 下可见。若要通过 IP 或域名访问，则需要添加 nginx 一类的反向代理，并在 `~/.config/sinopia/config.yaml` 下添加配置 `url_prefix: http://your_host_name` 以配置通过反向代理访问 Sinopia 的 Web 界面时，相应静态资源的路径。

要配置 Sinopia 代理的上游 NPM 仓库地址，只需修改 `~/.config/sinopia/config.yaml` 中的 `uplink` 字段即可。

添加 Sinopia 到启动脚本，修改 `/etc/rc.local` 即可：

``` text
sudo -u your_user_name nohup sinopia >/dev/null 2>&1 &
```
