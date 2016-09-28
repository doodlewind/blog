categories: Note

tags:

- Assembly

date: 2015-07-05

toc: true

title: NES模拟器笔记（3）ROM 与汇编
---

这篇文章会介绍 NES ROM 的结构，再通过第一篇入门指南中配置好的汇编器，编译并分析一个最简单的 nes 文件，从而对汇编和机器码有一个最基本的认识。

<!--more-->

## iNES ROM
现在通用的 .nes 文件是从卡带中 dump 出来的。这个格式最早是 iNES 模拟器所采用的。对一个最简单的 ROM 来说，它的结构是这样的：

1. 16 字节的 Header
2. PRG 数据，大小是 16KB 的整数倍
3. CHR 数据，大小是 8KB 的整数倍

Header 每个字节的定义如下：

* 0-3: `$4E $45 $53 $1A`，即跟着 DOS 终结符的 `NES`
* 4: PRG ROM 按 16KB 计的大小
* 5: CHR ROM 按 8KB 计的大小，0 代表 8KB
* 6: Flags 6
* 7: Flags 7
* 8: PRG RAM 按 8KB 计的大小，0 代表 8KB
* 9: Flags 9
* 10: Flags 10
* 11-15: 统一用 0 填充

现在我们再看第一篇教程中超级马里奥游戏 ROM 的截图：

![mario-1](http://7u2gqx.com1.z0.glb.clouddn.com/NES模拟器入门笔记/mario-1.jpg)

第一行的 16 字节就是 iNES Header 了。后面以 78 开始跟着的就是 CHR ROM 的内容，即 6502 的机器码。

根据图中第一行的 Header 信息，超级马里奥的 PRG 有 32KB 大，CHR 则有 8KB 大，加上文件头的 16 字节，整个文件就是在 Finder 中显示的尺寸就是 41KB 了。

NES 卡带除了任天堂外，还有很多制造商。这些制造商的卡带上有些魔改，这种改动是通过 Mapper 体现的。Mapper 信息在 iNES Header 的 Flag 项中存储。而对 Mapper 与 iNES 格式更复杂完整的描述，可以参考[这里](http://wiki.nesdev.com/w/index.php/INES)。对超级马里奥之类任天堂第一方游戏来说，还不用考虑 Mapper 的问题。

## 编译 ROM
现在我们试着通过编译一段最简单的 6502 汇编代码，观察得到的相应的 `nes` 文件情况。这个程序没有输入输出，唯一的能力就是让模拟器成功打开它而不报错（囧rz）

``` asm
reset:
  lda #$01     ; set A to 1
  sta $4015    ; store value of A to address $4015
forever:
  jmp forever  ; jump to label 'forever'
```

我们会得到一个 8KB 大小的 ROM，下面就用查看器打开它。

![lda-demo](http://7u2gqx.com1.z0.glb.clouddn.com/NES模拟器入门笔记/lda-demo.jpg)

去掉第一行 Header，能看到的就是 `A0 01 8D 15 40 4C 05 E0` 这几条指令了。怎么找到指令和汇编码的对应关系呢？

![6502-opcodes](http://7u2gqx.com1.z0.glb.clouddn.com/NES模拟器入门笔记/6502-opcodes.png)

``` asm
imm = #$00
zp = $00
zpx = $00,X
zpy = $00,Y
izx = ($00,X)
izy = ($00),Y
abs = $0000
abx = $0000,X
aby = $0000,Y
ind = ($0000)
rel = $0000 (PC-relative)
```

回到这个最简汇编的第二行，可以看到 `A9` 对应 `LDA` 指令，后面跟的是 `#$00` 格式的立即数 `01`。接下来的 `8D` 对应 `STA` 指令，后面跟的是 `15 40` 这个绝对地址。为什么不是 `40 15` 呢？因为 6502 采用了高位在后的[小端数](https://en.wikipedia.org/wiki/Endianness)。

按这个节奏，最后的 `4C 05` 也很容易看到了吧：查表发现 `4C` 就是 `jmp` 指令，而 `05` 是指令所要跳转到这个 PRG ROM 中的位置。由于 `jmp` 相对第二行的偏移量是 `05`，因此这里将会无限地跳转到 `jmp`，让程序不停地运行下去。

关于更详细的 6502 参考资料，可以看[这里](http://www.oxyron.de/html/opcodes02.html)。
