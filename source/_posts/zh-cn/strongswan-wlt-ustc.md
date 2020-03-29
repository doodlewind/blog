categories: Note

tags:

- Web
- Linux
- USTC

date: 2015-05-30

toc: true

title: 用 strongSwan 实现网络通一号多用
---

通过 [strongSwan](http://strongswan.org) 这个 IPSec 实现，我们可以在一台开通网络通的虚拟机上连接多个手机、平板等终端设备，实现网络通的一号多用。以下是这个 VPN 搭建过程的一些记录。

<!--more-->

## How it works
简要介绍部署的环境：主机是一台运行 Yosemite 的 MacBook Air。在主机环境下，通过 Virtualbox 安装了一台 Ubuntu 12.04 虚拟机，用于安装和配置 strongSwan，虚拟机的网络设置为桥接模式，经由主机的 `en0` 网卡，获得独立的 IP 地址。主机、虚拟机和准备连接的各个终端都位于同一个 ustcnet 热点的 Wi-Fi 环境下。


## 虚拟机的部署

### 网络设置
需要将虚拟机网卡设置为桥接模式，如下图所示。

![network-config](/images/strongswan/virtualbox-network.png)

### 图形界面
在 Virtualbox 的主界面中选中要运行的虚拟机，点击菜单栏上的 `运行` 按钮即可。

### 命令行
可以在主机的终端界面，直接通过命令行启动或停止虚拟机，并可以支持无图形界面的运行模式，此时需通过主机的 ssh 功能连接到虚拟的命令行操作界面。

``` text
# start VM without GUI
VBoxManage startvm Ubuntu --type headless

# stop VM
VBoxManage controlvm Ubuntu poweroff
```


## strongSwan 的安装
由于 Ubuntu 软件源中 strongSwan 的版本较低，因此在这里选择手动编译安装最新版 strongSwan 软件包。

### 安装依赖
首先是安装编译所需要的依赖。

``` text
apt-get install build-essential
aptitude install libgmp10 libgmp3-dev libssl-dev pkg-config libpcsclite-dev libpam0g-dev
```

### 编译源码
从 strongSwan 官网上下载最新版的源码，并编译安装。

``` text
wget http://download.strongswan.org/strongswan-5.2.2.tar.bz2
tar -jxvf strongswan-5.2.2.tar.bz2 && cd strongswan-5.2.2
./configure --prefix=/usr --sysconfdir=/etc  --enable-openssl --enable-nat-transport --disable-mysql --disable-ldap  --disable-static --enable-shared --enable-md4 --enable-eap-mschapv2 --enable-eap-aka --enable-eap-aka-3gpp2  --enable-eap-gtc --enable-eap-identity --enable-eap-md5 --enable-eap-peap --enable-eap-radius --enable-eap-sim --enable-eap-sim-file --enable-eap-simaka-pseudonym --enable-eap-simaka-reauth --enable-eap-simaka-sql --enable-eap-tls --enable-eap-tnc --enable-eap-ttls
make && make install
```

完成后的 strongSwan 相关文件路径是 `/etc/ipsec.d`。下面的操作都是在此路径下进行的，且均需要 root 权限。


## 证书的生成

### 概述
下面的过程一共会生成了 6 个文件，或者说 3 个公私钥对。其实，现有的 Web 安全解决方案，就是在基于可信第三方的公私钥加密体制下实现的。从而，对一个最基本的安全通信场景，我们需要以下的几份材料做身份验证，防止窃听、冒用、重放、中间人等攻击：

* **可信第三方（CA）**的公钥（证书）和私钥
* **发送方**的公钥（证书）和私钥
* **接收方**的公钥（证书）和私钥

而流程可以概括为：CA 手里有一个自己私钥，它先为通过私钥为自己签发 CA 证书，然后用以下材料，分别签发发送方（VPN 主机）和接收方（手机客户端）的证书：

* CA 的证书
* CA 的私钥
* 其中一方的私钥

下面的过程，实际上就是对这个概念的一个完整实现流程。注意，私钥名为 `xxxKey.pem`，而与其对应的证书名为 `xxxCert.pem`。

### 根 CA
先为根 CA 生成 `pem` 格式的私钥 `caKey.pem`，它的默认加密方式是 RSA。

``` text
ipsec pki --gen --outform pem > caKey.pem
```

为安全起见，需要修改权限以免私钥泄露，即仅允许 root 用户读写，对其余用户不可见。

``` text
chmod 600 caKey.pem
```

然后通过这个私钥，生成服务器端的证书 `caCert.pem`。生成时可以用 `--dn` 参数指定证书的一些信息，如 `C=CN` 代表国家，`CN=vpn.host.name` 为 VPN 主机的域名或 IP。

``` text
ipsec pki --self --in caKey.pem \
 --dn "C=CN, O=strongSwan, CN=ewind CA" \
 --ca --outform pem > caCert.pem
```

查看并确认生成的 CA 证书信息。

``` text
ipsec pki --print --in caCert.pem
cert:      X509
subject:  "C=CN, O=strongSwan, CN=ewind CA"
issuer:   "C=CN, O=strongSwan, CN=ewind CA"
validity:  not before May 26 16:31:26 2015, ok
           not after  May 25 16:31:26 2018, ok (expires in 1092 days)
serial:    47:a1:14:1a:e1:aa:aa:7b
flags:     CA CRLSign self-signed 
subjkeyId: aa:93:42:8a:ca:64:d4:87:ed:f1:2e:2e:a1:e1:57:4a:a1:91:39:47
pubkey:    RSA 2048 bits
keyid:     35:46:58:9d:c8:0a:d7:06:41:1a:83:9c:73:cc:54:97:a8:a5:bf:0f
subjkey:   aa:93:42:8a:ca:64:d4:87:ed:f1:2e:2e:a1:e1:57:4a:a1:91:39:47
```

到此为止，我们就完成了 CA 的证书-私钥对的生成。

### VPN 主机
接下来，为 VPN 主机生成证书。首先是私钥 `serverKey.pem` 的生成。

``` text
ipsec pki --gen --outform pem > serverKey.pem
```

然后就可以用刚生成的私钥加上 CA 的公私钥对，生成 VPN 主机的证书 `serverCert.pem` 了，这里可以在 `--san` 参数中填入 VPN 主机的域名或 IP 地址。

``` text
ipsec pki --pub --in serverKey.pem | ipsec pki --issue \
 --cacert caCert.pem --cakey caKey.pem \
 --dn "C=CN, O=strongSwan, CN=vpn.doodlewind.us" \
 --san="vpn.doodlewind.us" --flag serverAuth \
 --flag ikeIntermediate --outform pem > serverCert.pem
```

完成后，查看并确认 VPN 主机的证书信息。

``` text
$ ipsec pki --print --in serverCert.pem
cert:      X509
subject:  "C=CN, O=strongSwan, CN=vpn.doodlewind.us"
issuer:   "C=CN, O=strongSwan, CN=ewind CA"
validity:  not before May 26 16:31:38 2015, ok
           not after  May 25 16:31:38 2018, ok (expires in 1092 days)
serial:    33:b7:36:70:69:f0:f1:ad
altNames:  vpn.doodlewind.us
flags:     serverAuth iKEIntermediate 
authkeyId: aa:93:42:8a:ca:64:d4:87:ed:f1:2e:2e:a1:e1:57:4a:a1:91:39:47
subjkeyId: 18:75:28:78:4e:ba:fd:9d:30:f9:e3:2b:85:4c:3c:11:72:55:5b:64
pubkey:    RSA 2048 bits
keyid:     4b:98:2c:dc:e8:60:a0:d0:e6:ea:d8:39:cb:6e:7a:32:88:27:59:67
subjkey:   18:75:28:78:4e:ba:fd:9d:30:f9:e3:2b:85:4c:3c:11:72:55:5b:64
```

到此，VPN 主机的证书生成步骤就完成了。

### 客户端
客户端证书的生成步骤，和 VPN 主机的步骤是一致的。不同之处在于，由于客户端系统的格式兼容性问题，需要将 `pem` 格式的证书整合为 `p12` 格式。首先还是为客户端生成私钥。

``` text
ipsec pki --gen --outform pem > ewindKey.pem
```

再用这个私钥加上 CA 的公私钥对，生成客户端的证书。

``` text
ipsec pki --pub --in ewindKey.pem | ipsec pki --issue \
 --cacert caCert.pem --cakey caKey.pem \
 --dn "C=CN, O=strongSwan, CN=ewind" \
 --outform pem > ewindCert.pem
```

下面按惯例确认客户端证书的信息，保证格式的正确性。

``` text
ipsec pki --print --in ewindCert.pem
cert:      X509
subject:  "C=CN, O=strongSwan, CN=ewind"
issuer:   "C=CN, O=strongSwan, CN=ewind CA"
validity:  not before May 26 16:31:42 2015, ok
           not after  May 25 16:31:42 2018, ok (expires in 1092 days)
serial:    6a:ae:c3:8d:e6:78:2f:9b
flags:     
authkeyId: aa:93:42:8a:ca:64:d4:87:ed:f1:2e:2e:a1:e1:57:4a:a1:91:39:47
subjkeyId: 58:06:f5:a5:2e:b5:f9:12:25:51:f0:bf:c1:3c:5e:10:13:52:c0:a7
pubkey:    RSA 2048 bits
keyid:     77:ef:cf:91:d4:0c:19:15:ab:b2:e2:eb:4e:2c:b6:91:20:a1:e2:42
subjkey:   58:06:f5:a5:2e:b5:f9:12:25:51:f0:bf:c1:3c:5e:10:13:52:c0:a7
```

在打包前，我们一共有 3 个 `xxxKey.pem` 格式的私钥和 3 个 `xxxCert.pem` 格式的证书。下面将它们分别归类到 strongSwan 的相应路径下。

``` text
mv caKey.pem serverKey.pem ewindKey.pem private/
mv caCert.pem cacerts/
mv serverCert.pem ewindCert.pem certs/
```

接下来就可以执行 `p12` 格式证书的打包了，这里利用 `openssl` 软件包实现打包。

``` text
openssl pkcs12 -export -inkey private/ewindKey.pem \
 -in certs/ewindCert.pem -name "ewind"\
 -certfile cacerts/caCert.pem \
 -caname "ewind CA" \
 -out ewindCert.p12
```

完成后，即可将虚拟机中的 `ewindCert.p12` 客户端证书文件与 `certs/caCert.pem` CA 根证书文件用 `vsftpd` 或 `rsync` 等工具传输到主机，再分发到客户端。大体操作即是在信任 CA 根证书后，添加客户端证书即可，在此不再赘述。


## strongSwan 的配置

### 连接配置
虚拟机环境下，这份经过精简的配置文件，可以支持 IKEv1 和 IKEv2 密钥交换。配置文件路径为 `/etc/ipsec.d`，直接用 `nano` 等编辑器替换原配置文件内容即可。

``` text
config setup
    strictcrlpolicy=no
    uniqueids=no
    
conn ikev1
    keyexchange=ikev1
    authby=xauthpsk
    xauth=server
    left=%defaultroute
    leftsubnet=0.0.0.0/0
    leftfirewall=yes
    right=%any
    rightsubnet=10.11.0.0/24
    rightsourceip=10.11.0.0/24
    auto=add
conn ikev2
    keyexchange=ikev2
    ike=aes256-sha1-modp1024!
    esp=aes256-sha1!
    dpdaction=clear
    dpddelay=300s
    rekey=no
    left=%defaultroute
    leftsubnet=0.0.0.0/0
    leftauth=pubkey
    leftcert=serverCert.pem
    leftid=ikev2
    right=%any
    rightsourceip=10.11.1.0/24
    rightauth=eap-mschapv2
    rightsendcert=never
    eap_identity=%any
    auto=add
```

在这份配置文件中，我们分别指定了客户端采用 IKEv1 和 IKEv2 时的相应配置。其中，IKEv1 的身份认证方式为 xauth，通过预共享密钥（PSK）实现。而 IKEv2 的身份认证方式为 EAP，相关参数在配置文件中已指定。

### 身份认证配置
为了添加用户，需要修改 strongSwan 的身份认证配置文件 `/etc/ipsec.secret`。一个可用的范例如下。

``` text
: PSK "pythondafahao"
ewind1 : XAUTH "pythondafahao"

: RSA ewindCert.pem
ewind2 : EAP "pythondafahao"
```

### 防火墙配置
为了实现 VPN 的上网功能，需要允许端口转发功能。以下是一个可用的 iptables 配置命令集。

``` text
iptables -A INPUT -p udp --dport 500 -j ACCEPT
iptables -A INPUT -p udp --dport 4500 -j ACCEPT
echo 1 > /proc/sys/net/ipv4/ip_forward
# 地址与上面地址池对应
iptables -t nat -A POSTROUTING -s 10.11.1.0/24 -o eth0 -j MASQUERADE
iptables -A FORWARD -s 10.11.1.0/24 -j ACCEPT
```

为了避免每次虚拟机启动都要重新执行这些命令的情况，可以将以上命令写入 `/etc/rc.local` 的 `exit` 语句之前，实现配置脚本的开机自动执行。

如果在连接后出现客户端无法 DNS 解析的情况，可以额外执行下面的这一行。

``` text
iptables -t nat -A POSTROUTING -o eth0 ! -p esp -j SNAT --to-source "114.214.195.95"
```

### 网络通配置
可以通过 bash 脚本直接启用网络通对虚拟机 IP 地址的出校权限，具体实现如下。

``` text
curl -c /tmp/wlt "http://wlt.ustc.edu.cn/cgi-bin/ip?cmd=login&name=yourname&password=yourpass" > /dev/null
curl -b /tmp/wlt "http://wlt.ustc.edu.cn/cgi-bin/ip?cmd=set&type=8&exp=0" > /dev/null 
rm /tmp/wlt
```

替换以上脚本中的 `yourname` 和 `yourpassword` 参数为网络通帐号和密码，即可使用该脚本。而最后一行中，设置 `type-x` 将指定网络通的出口号，`exp=y` 指定了有效期，置零代表永久有效（到下一次更新为止）。

### DNS 解析
由于在前面采用了域名的方式指定 VPN 服务器地址，因此，需要在 DNS 服务提供商（这里采用了 [DNSPod](http://dnspod.cn/)）处，将相应的域名指向虚拟机的 IP 地址。这个 IP 地址可以在虚拟机的终端内用如下命令得到：

``` text
ifconfig | grep inet
```


## 部署

### VPN 服务器端
完成 strongSwan 及其相关环境的设置后，即可启动 stongSwan。

``` text
ipsec start
```

若需要部署过程的详细日志，可以为启动命令附带参数。

``` text
ipsec start --nofork
```

然后就可以在终端窗口看到 strongSwan 的日志信息了。

### 客户端
对支持 IKEv2 的操作系统（如运行 iOS 8 的 iPhone 设备），可以在 `设置 -> 通用 -> VPN -> 添加 VPN 配置 -> IPSec` 中看到图形化的 VPN 连接界面。在 `描述` 中填入任意的标题，在 `服务器` 中填入生成服务器端证书时的域名，在 `账户` 中填入 /etc/ipsec.secrets 中采用 EAP 加密时的密码，在 `密钥` 中则填入使用 PSK 时的预共享密钥即可。

完成后，选择 `通用 -> VPN -> 连接` 即可一键连接到搭建好的 IPSec VPN 了！

![cliend-iOS8](/images/strongswan/vpn-client-ios8.png)


## 抓包分析
抓包分析在 OS X Yosemite 环境下进行。由于该系统下 Wireshark 暂时不能正常使用，因此使用 CocoaPacketAnalyzer 做抓包工具。

### IKE SA 连接的建立
以 iPhone 5C 登录 VPN 为例，演示连接过程的建立。

其中，iPhone 5C 的 IP 地址为 `114.214.184.203`，VPN 主机的 IP 地址为 `222.195.85.154`。

由于 CocoaPacketAnalyzer 不支持 ISAKMP 协议的分析，故将过滤方式选取为 UDP 500 端口，分析连接建立过程中 ISAKMP 协议的协商过程。

由于 iPhone 5C 默认的 IPSec 客户端设置为 PSK 预共享密钥形式，故在密钥协商时采用了 IKEv1 协议（配置文件中支持 IKEv2，但在连接建立时回退到了 IKEv1）。

![isakmp-login](/images/strongswan/isakmp-login.jpg)

通过以上高亮的 6 条报文，建立了连接。其过程如下：

#### 协商 IKE 安全提议
前 2 条报文用于协商 IKE 安全提议。协商分两种情况：

1. 发起方的 IKE Peer 中引用了 IKE Proposal
2. 发起方的 IKE Peer 中没有引用 IKE Proposal

两种情况下，响应方都会在自己配置的 IKE 安全提议中寻找与发送方相匹配的 IKE 安全提议，如果没有匹配的安全提议则协商失败。IKE Peer 双方安全提议匹配的原则为协商双方有相同的加密算法、认证算法、身份认证方法和 DH 组标识（不包括 IKE SA 生存周期）。

![isakmp-init](/images/strongswan/isakmp-init.jpg)

此即由 iPhone 发起的第一条报文，其载荷长度也是所有报文中最长的。通过 strongSwan 的日志，可以发现这也与日志内容相匹配。这里 iPhone 发起的连接采用了 Main Mode 主模式，而非 Aggressive Mode 积极模式。

``` text
# 发送安全提议与确认安全提议
15[IKE] 114.214.184.203 is initiating a Main Mode IKE_SA
15[NET] sending packet: from 222.195.85.154[500] to 114.214.184.203[500] (136 bytes)
```

#### 使用 DH 算法交换密钥材料
第 3 条和第 4 条报文中，双方使用 DH 算法交换密钥材料，并生成密钥。由于抓包工具无法查看载荷的内容，故通过 strongSwan 日志文件分析其内容。

``` text
# 交换密钥信息并生成密钥
16[NET] received packet: from 114.214.184.203[500] to 222.195.85.154[500] (228 bytes)
16[ENC] parsed ID_PROT request 0 [ KE No NAT-D NAT-D ]
16[ENC] generating ID_PROT response 0 [ KE No NAT-D NAT-D ]
16[NET] sending packet: from 222.195.85.154[500] to 114.214.184.203[500] (244 bytes)
```

这两条报文中包含了用于密钥协商的载荷 `KE` 和临时随机数 `No`，虽然其通过 UDP 协议明文发送，但 DH 算法保证了即便该载荷被窃听，也无法分析出密钥协商结果。

#### 身份认证
第 5 条和第 6 条报文中，IKE Peer 双方交换身份信息，进行身份认证。

目前有两种身份认证技术比较常用：

1. 预共享密钥方式（Pre Share Key）：设备的身份信息为IP地址或名称。
2. 数字证书方式：设备的身份信息为证书和通过证书私钥加密的部分消息 Hash 值

在此指定了常用于 iPhone 的 PSK 方式进行身份认证，故而没有使用预先为客户端签发的证书。若在 Windows 等系统环境下，可以利用之前签发的 `ewindCert.p12` 客户端证书文件进行身份认证。这个认证过程中的日志记录如下：

``` text
# 交换身份信息，认证对方身份
06[NET] received packet: from 114.214.184.203[500] to 222.195.85.154[500] (108 bytes)
06[ENC] parsed ID_PROT request 0 [ ID HASH N(INITIAL_CONTACT) ]
06[CFG] looking for XAuthInitPSK peer configs matching 222.195.85.154...114.214.184.203[114.214.184.203]
06[CFG] selected peer config "ikev1"
06[ENC] generating ID_PROT response 0 [ ID HASH ]
06[NET] sending packet: from 222.195.85.154[500] to 114.214.184.203[500] (76 bytes)
```

由于身份认证信息经过了 DH 算法交换生成的密钥的加密，故而保证了这两条 UDP 消息的安全性。

### 建立 IPSec SA
在完成 IKE SA 的建立后，就是 IPSec SA 的建立了。其过程如下：

1. 发起方发送 IPSec 安全提议、被保护的数据流（ACL）和密钥材料给响应方。
2. 响应方回应匹配的 IPSec 安全提议、被保护的数据流，同时双方生成用于 IPSec SA 的密钥。
3. 发起方发送确认结果。

协商完成后发送方开始发送 IPSec（ESP）报文。

``` text
# 完成认证后，用 3 条消息建立 IPSec SA
06[ENC] generating TRANSACTION request 3977700787 [ HASH CPRQ(X_USER X_PWD) ]
06[NET] sending packet: from 222.195.85.154[500] to 114.214.184.203[500] (76 bytes)
05[NET] received packet: from 114.214.184.203[500] to 222.195.85.154[500] (92 bytes)
05[ENC] parsed TRANSACTION response 3977700787 [ HASH CPRP(X_USER X_PWD) ]
05[IKE] XAuth authentication of 'ewind2' successful
05[ENC] generating TRANSACTION request 3335483661 [ HASH CPS(X_STATUS) ]
05[NET] sending packet: from 222.195.85.154[500] to 114.214.184.203[500] (76 bytes)
04[NET] received packet: from 114.214.184.203[500] to 222.195.85.154[500] (76 bytes)
04[ENC] parsed TRANSACTION response 3335483661 [ HASH CPA(X_STATUS) ]
04[IKE] IKE_SA ikev1[1] established between 222.195.85.154[222.195.85.154]...114.214.184.203[114.214.184.203]
```

### 数据传输
在完成上文的 ISAKMP 协商过程后，通信双方即开始发送 IPSec（ESP）报文。

![esp](/images/strongswan/esp.jpg)

在上图中筛选出了由 iPhone 客户端到 VPN 主机之间的报文。其中的明文信息有 ESP 格式载荷的 SPI 号和序列号，而其载荷内容经过加密而无法查看。

由于图中的报文的 SPI 号是相同的，据此可以推断出它们是在同一条 SA 连接上传输的。
