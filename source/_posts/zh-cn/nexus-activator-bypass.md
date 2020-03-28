categories: Note

tags:

- Android

date: 2015-04-13

toc: false

title: 跳过 Nexus 的谷歌联网激活
---

![Nexus 7](/images/跳过Nexus的谷歌联网激活1.jpg)

遇上了一个奇葩的死锁：重置 Nexus 7 后需要连接谷歌激活，但不激活就没法上谷歌（理论上当然可以通过挂了 VPN 或登录了校园网的电脑热点，但极为先进的 Yosemite 系统开创性地抽风了）。

下面是强行跳过这个激活过程的一种折腾方法<!--more-->。大体步骤是在解锁后，刷入 ClockworkMod Recovery 镜像，从而在电脑上操作文件系统，进而更改配置，禁用联网激活。

如果之前解锁过平板并且配置过安卓的开发环境，那么可以直接从第 4 步开始。

1. 在电脑上安装安卓 SDK。
2. 平板连接电脑，同时按住平板的电源键和音量减小键开机，进入 Fastboot 模式。
3. 进入 SDK 中的 `platform-tools` 目录，命令行执行 `fastboot oem unlock` 解锁 Bootloader。
4. 下载 ClockworkMod Recovery。对 Nexus 7，[在这里下载](http://download2.clockworkmod.com/recoveries/recovery-clockwork-6.0.1.0-grouper.img)。
5. 命令行执行 `fastboot boot recovery-clockwork-6.0.1.0-grouper.img`。完成后平板会重启进入 ClockworkMod Recovery（只是一次性的引导，不会修改系统自带的 Bootloader）。
6. 在平板上选择 `mounts and storage`，再选择 `mount /system`。
7. 命令行执行 `adb shell`，这样就可以访问平板的文件系统了。
8. `echo "ro.setupwizard.mode=DISABLED" >> /system/build.prop`
9. 退出 shell，命令行 `adb reboot` 重启。
10. 重启平板，直接进入主屏幕。

最后有一点要注意的是，如果不刷 CWM，是不能直接在 Recovery 下执行 `adb shell` 的。

事后感慨：

* 这都是 GFW 的错。
* 不想当开发者的安卓用户不是好安卓用户。
* 终于可以把平板借出去了（再见）。