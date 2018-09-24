categories: Note

tags:

- Summary

date: 2018-04-06

toc: true

title: Mac 上为移动设备配置代理的懒方法
---

很多同学的手机都支持高级的网络代理配置，但某些时候我们仍然需要将流量从 PC 上流过。下面分享 Mac 用户在这种场景下的一个简单解决方案。

<!--more-->

## 背景
我的 Switch 游戏截图默认只支持分享到 FB 和推特，不能直接复制到本地。但 Switch 本身的 Proxy 功能又十分孱弱（只支持最基本的 HTTP 协议代理），那么想要导出机内截图时，该如何为此配置网络呢？

只要我们在 Mac 上已经安装了支持 SOCKS 协议的代理客户端，那么我们只需要：

1. 将 SOCKS5 协议代理 pipe 为 HTTP 协议代理。
2. 在移动设备上连接这个 HTTP 代理。

这样就足够了。

## Mac 端配置
首先安装 Privoxy：

``` bash
brew install privoxy
```

安装成功后，我们无需 `sudo` 权限就能配置、启停代理。只需为配置文件追加如下两行即可：

``` bash
echo 'listen-address 0.0.0.0:8118' >> /usr/local/etc/privoxy/config
echo 'forward-socks5 / localhost:1080 .' >> /usr/local/etc/privoxy/config
```

其中，`8118` 是你想要启动的 HTTP 代理所在端口号，而 `1080` 则是已有 SOCKS5 协议代理的端口，可以根据实际配置自行修改。完成配置后即可启动服务：

``` bash
/usr/local/sbin/privoxy /usr/local/etc/privoxy/config
```

可以用如下方式验证服务是否启动：

``` bash
netstat -an | grep 8118
tcp4       0      0  *.8118                 *.*                    LISTEN
```

这样我们就完成 Mac 端的配置了。


## 移动端配置
在移动端设备的网络配置界面中，将代理地址设置为 Mac 的 IP 地址上的 8118 端口即可：

![switch-config](/images/switch-config.jpg)

Mac 的 IP 地址可以在终端上通过 `ifconfig | grep inet` 得到，或者在 `设置 → 网络` 中查看。

完成配置后，让我们看看最后成功从 Switch 传到 FB 的截图吧：

![zelda](/images/zelda-0021.jpg)

😎
