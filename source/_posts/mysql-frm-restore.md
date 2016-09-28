categories: Note

tags:

- Linux
- SQL

date: 2015-09-06

toc: false

title: 从 FRM 文件恢复 MySQL 数据库
---

默认情况下，每个 MySQL Schema 的数据都存储在 `/var/lib/mysql/database_name` 中，其中的每张表都对应这个路径下形如 `table_name.frm` 的一个 `frm` 文件。

一般情况下，可以直接用 `mysqldump` 命令来备份 `sql` <!--more-->格式的数据库文件。但是当线上主机宕机从而只能获取到磁盘文件的时候，就没有办法直接导出 `sql` 文件了。当然了这种情况下数据并没有丢失，仍然可以从 `frm` 格式文件中恢复出来。这个过程并不是直接把需要恢复的 `frm` 文件放到新主机的路径下就大功告成了。对采用 InnoDB 的数据库来说，还需要先将数据库引擎切换为 MyISAM 后才能成功还原。一共有以下几步：

1. 把 `/var/lib/mysql` 下需要的 `frm` 文件上传到新的环境下。
2. `chmod -R mysql:mysql *.frm` 更改文件的属主。
3. 登录 MySQL 的终端，执行以下查询：

``` sql
USE database_to_restore;
ALTER TABLE table_name ENGINE=MyISAM;
REPAIR table_name USE_FRM;
```

这样就完成了对一张表的还原过程。如果还需要 `sql` 格式文件，就可以在新环境下直接 `mysqldump -u root -p database_name > backup.sql` 来完成备份了。
