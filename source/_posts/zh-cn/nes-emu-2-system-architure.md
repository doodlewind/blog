categories: Note

tags:

- Assembly

date: 2015-07-04

toc: true

title: NES 模拟器笔记 (2) 系统架构
---

这篇文章会介绍 NES 系统的架构，如 ROM、RAM、CPU、PPU 与 APU 等主要部件，以及工作时它们之间的联系。

<!--more-->

## 结构概览

![structure.png](/images/nes/structure.png)

上图即是 NES 的结构图。可以看到，一台 PC 的几个主要部件，在 NES 系统里被分置于主机和卡带两个部分之中。ROM 在卡带中，而 CPU、PPU、APU 和 RAM 位于主机内部。

* ROM 是只读存储器。
* RAM 是随机访问存储器（可读可写）。
* CPU 是主处理器。
* PPU 是图像处理器。
* APU 是音频处理器。
* PRG ROM 中游戏程序的指令，由 CPU 读取并执行。
* CHR 是 ROM 中显示贴图的数据，由 PPU 读取并显示。
* Lockout 是负责验证游戏合法性的芯片，对 ROM 的模拟暂时不需要考虑它。
* WRAM 是有些游戏卡带附加的 Work RAM，需要电池保存状态，暂时不考虑。


## CPU 概览

![cpu-address](/images/nes/cpu-address.png)

上图展示了 NES 工作时 CPU 的地址空间。在第一篇入门指南中，提及了 CPU 的指令长度，但没有提及 CPU 对应的地址空间。实际上，虽然 6502 的指令长度是 8 位的，但它的地址总线却是 16 位的。这意味着它能够操作 `2^16 = 65536` 共 64KB 内存。在上图中，16 位地址就对应了 `$0000` 到 `$FFFF` 的范围。不同的厂商会对卡带做各种魔改（这种魔改在 NES ROM 中会通过两个 Mapper 标记位来确定），使得题图中 PRG 和 CHR 的大小最多能达到 512KB 和 256KB。

8 位的指令长度，对应了最多 256 种指令。不过实际上，NES 所用的 6502 CPU 只定义了 150 余条指令，真正常用的只有 50 余条。这样看来，实现基本模拟器的工作量并不是很大呢。

## PPU 概览
NES 显示的对象有 *Background* 和 *Sprite* 两种。顾名思义，background 就是背景，而 sprite 则是前景中活跃的所谓精灵，如马里奥大叔就是一个 sprite。下面会对它们进一步的介绍。

PPU 内既有用于存储 sprite 和调色板（存储颜色索引）的 RAM，也有用于存储 background 的 RAM。具体 background 和 sprite 的数据都是从卡带中的 CHR 读取的。

程序指令是不会直接在 PPU 上执行的。PPU 每次只会按固定的顺序和一些参数（如颜色和卷屏方式）来绘制屏幕。PPU 每次绘制出的是一条 TV 的扫描线（NES 分辨率 256x240，这也就是 240 线了）。

CPU 概览图中 `$2000` 到 `$4000` 的 PPU IO 端口部分，可以进一步的表示为下图：

![ppu-address](/images/nes/ppu-address.png)


## 图形系统概览
这里解释一下上图中的几个新名词。

### Tiles - 贴片
NES 的图像是通过 8x8 的贴片组成的，包括 background 和 sprite 都是由一个或多个 tile 构成的。PPU 一般不通过直接操作像素，而是通过操作 tile 来生成图像。

### Sprites - 精灵
PPU 的 4KB 内存刚好够放下 64 个 sprites。不过，每条扫描线上最多只允许出现 8 个 sprite。

### Background - 背景
Background 就是背景图像了。256x240 的屏幕需要 32x30 个背景 tile 来表示。RAM 足够放下两张背景。

### Pattern Tables - 图案表
Pattern Table 是 tile 数据存储的地方。4KB 的 Pattern Table 内要放下 256 个 tile，因此每个 tile 只有 128 位（4096 * 8 / 256 = 128），而每个 tile 有 64 个像素点，因此每个像素点的数据只有 2 位。

### Attribute Tables - 属性表
Attribute Table 中存储 2 位的颜色偏移量。在一个 2x2 的 tile 区域内，这个偏移量会作为颜色地址的高 2 位，而 Pattern Table 中每个像素点的 2 位信息则作为颜色地址的低 2 位，和这个高 2 位的属性拼接起来，产生 4 位的颜色信息。根据这个信息，就可以从调色板中获得实际的颜色来绘图了。

### Palettes - 调色板
每个 Palette 内可以放 16 种颜色，4 位颜色信息对应了 16 种颜色。

不过，每个 2x2 的 tile 区域对应一个调色板，而这个区域的高 2 位是由 Attribute Table 指定的同一个值。于是，实际上在这个 tile 区域内，最多只能显示由 Pattern Table 低 2 位决定的 4 种颜色。

具体过程如下图所示。

![tile-color-lookup](/images/nes/tile-color-lookup.png)

如果有疑问，可以直接访问[参考资料](http://www.nintendoage.com/forum/messageview.cfm?catid=22&threadid=4291)，十分详尽。
