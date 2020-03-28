categories: Note

tags:

- Linux

date:  2016-05-16

toc: true

title: Docker 与 AVD 速查表
---

通过把 Android SDK 和 AVD 模拟器部署到 Docker 上，可以提高配置多个开发环境的效率，并且可以高效地在多个 Docker Container 中运行不同的 Android Emulator 实例。下面整理了一些配置过程中的常用命令。

<!--more-->

## Docker
简单地理解 Image 和 Container 的关系：Image 像系统安装盘，Container 是用光盘装的一堆彼此隔离的系统。Container 里的内容也可以提交，生成自己的新 Image 镜像。

从 Docker Hub 中获取 Image 镜像文件
``` text
docker pull image-name
```

从 Image 创建一个新的 Container
``` text
docker create img_name
```

从 Image 启动一个新 Container 并指定名称、进入其 Bash Shell
``` text
docker run -it --name container_name img_name bash
```

从 Image 启动一个挂载数据卷的临时 Container 并执行 Container 中的 Python 脚本
``` text
docker run -v /src/path:/dest/path -it img_name python app.py
```

查看运行过的 Container
``` text
docker ps -a
```

后台启动一个已创建的 Container
``` text
docker start container_name
```

连接到运行中的 Container 并执行命令
``` text
docker exec -it container_name bash
docker exec -it container_name ls -l
```

在 Container 和 Host 中双向复制文件
``` text
docker cp /host/foo.txt container_id:/path/foo.txt
docker cp container_id:/path/foo.txt /host/foo.txt
```


## AVD
AVD 可以用来配置 Android 模拟器，命令行下的主要命令如下：

查看可用 API 版本
``` text
android list targets
```

创建模拟器，此处 `-t` 的参数为上一命令返回结果的 id 数字。
``` text
android create avd -n emu_name -t 1 --skin WXGA800
```

在无图像无音频的环境下启动模拟器
``` text
emulator -no-window -no-audio -avd power-rank
```


## ADB
ADB 可以用来查看连接的 Android 设备（模拟器或真机）的各种参数，以下是几条比较实用的命令。

查看 Android 设备
``` text
adb devices
```

安装应用
``` text
adb install foo.apk
```

查看设备已安装应用
``` text
adb shell pm list packages -f
```

运行应用
``` text
adb shell monkey -p com.package.name -c android.intent.category.LAUNCHER 1
```

查看 CPU 占用率
``` text
adb shell dumpsys cpuinfo
```

查看运行 Activity
``` text
adb shell dumpsys activity activies
```

查看 APK Package Name
``` text
aapt dump badging foo.apk | grep "package: name"
```

查看 APK Label 名
``` text
aapt dump badging foo.apk | grep "application: label" | awk '{print $2}'
```

抽取 APK 图标
``` text
aapt dump badging foo.apk | grep "appliction-icon"
unzip foo.apk -d dest/path
mv res/drawable-xhdpi/appicon.png dest/path/appicon.png
```
