categories: Note

tags:

- Web
- JS
- Assembly

date: 2015-08-02

toc: false

title: NES 模拟器笔记 (5) 6502 反汇编器
---

这个 [Demo](http://ewind.us/h5/jFami/disassembler.html) 是一个基本的 NES 反汇编器。由于并不牵扯到 JMP 之类跳转地址的操作，因此实现它的思路可以说十分的简单：

1. 每次在给定的地址取一条指令，也就是一个字节。
2. 按照这个字节的值，在 switch 里找到对应的 case。
3. 按照这条指令的寻址方式，取对应的操作数：可以是 0-2 个字节。
4. 返回取得操作数后移动的地址。

<!--more-->

而这里面关键的就是一一根据取到字节的值，来确定对应的指令了。

[6502 Instruction Set](http://www.e-tradition.net/bytes/6502/6502_instruction_set.html) 中详细给出了 6502 的详细指令信息，不过 NES 的 6502 和这里给出的文档并不完全一致。区别在于原生 6502 所没有的一些指令代码，在 NES 中是有明确定义的，这些定义可以在 [CPU unofficial opcode](http://wiki.nesdev.com/w/index.php/CPU_unofficial_opcodes) 中查到。不过这篇文档对指令的描述相对没有前一篇那么直观，所以只在查找一些 NES 专用的信息时比较有用。

实际最后用到的 NES 指令，有以下几种寻址方式：

1. `Accumulator` 没有操作数。
2. `absolute` 一个 8 位操作数。
3. `absolute, X-indexed` 一个 16 位操作数。
4. `absolute, Y-indexed` 一个 16 位操作数。
5. `immediate` 一个 8 位操作数。
6. `implied` 没有操作数。
7. `indirect` 一个 16 位操作数。
8. `indirect, Y-indexed` 一个 8 位操作数。
9. `indirect, X-indexed` 一个 8 位操作数。
10. `zpg` 一个 8 位操作数。
11. `zeropage, X-indexed` 一个 8 位操作数。
12. `zeropage, Y-indexed` 一个 8 位操作数。

能想到的最简洁的实现，就是把上面的这些寻址方式封装为单独的函数，在 `switch` 中直接调用即可：

``` js
switch (opcode) {
    case 0x00: implied("BRK"); break;
    case 0x01: indirectX("ORA"); break;
    case 0x02: implied("KIL"); break;
    case 0x03: indirectX("SLO"); break;
    case 0x04: zeroPage("NOP"); break;
    case 0x05: zeroPage("ORA"); break;
    case 0x06: zeroPage("ASL"); break;
    case 0x07: zeroPage("SLO"); break;
    case 0x08: implied("PHP"); break;
    case 0x09: immediate("ORA"); break;
    // ...
}
```

这样看起来真是个简单粗暴的结构啊。后面实现 CPU 的时候，也使用的是这个 `switch` 的结构。
