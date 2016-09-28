categories: Note

tags:

- Linux

date: 2014-08-26

toc: true

title: UNIX 日常笔记
---

> This article is a UNIX beginner’s learning note.

<!--more-->

## Startup

### Login
* Using ssh/telnet…

### Shut Down
`halt init 0 init 6 poweroff reboot shutdown`

### Manual
`man -k permission [SNYOPSIS] - arguments`


## Users and Groups

### Type of Accounts
* System accounts: apache/bin/guest…
* User accounts
* Group accounts: One account belongs to multi groups

### Admin Users and Groups
* 3 main files for user management
    * `/etc/passwd`
    * `/etc/shadow`
    * `/etc/group`

* Commands to manage users and groups
    * `useradd`
    * `usermod`
    * `userdel`
    * `groupadd`
    * `groupmod`
    * `groupdel`

* Shell location: `/bin/bash`
* `who` / `whoami` (current) / `who am i`(init)


## File System

### Basic File Commands
* find pathname options

`find /usr -name lostfile (recursive by default)`

* `which` and `whereis`
    * `which`: find file in users’ PATH
    * `whereis`: find in system’s path

* `echo directory*` = `ls`    

### Links
* Hard link: same inode
* Soft link: different inode, ref by name `ls -i`
* `cat`
* Add line to file tail `echo "Hey">>filename`
* Edit link will change content of origin file

### Files and Directory Permissions
* r-read / w-write / x-execute
* Output from `ls-l` `-rwxr-xr--`
    * Permission for file owner
    * Permission for group
    * Permission for others

### Change Permissions
* `chmod` in symbol mode `chmod [u/g/o][+/-/=][rwx] filename`
* `chomod` in absolute mode `chmod [7=r4+w2+x1]40 filename`
* `chgroup groupname filename`
* `umask` configs default permission of shell created files by minus it from 777, if wants it default, saves it to .profile

### View File
* `more filename` show file in a screen. Press Enter to move on
* `less filename` use vi keys to operate
* `head -n 15 filename` view 15 lines of file, 10 or 15 lines by default
* `tail -n 15 filename`
* `tail -f(follow) filename`
* `wc filename` see files length count by words
* `wc -[c/l/L] filename` count by chars/lines/length of longest line

### Create/Change/Delete File
* `cp fromfile tofile`
* `mv fromfile tofile`
* `touch filename`
* `rm -f(don't ask) -r(recursive) filename(can be *)`

### Create/Delete Directory
* `mkdir dirname`
* `rmdir dirname(must be empty)`
* `rm -r` can delete dir that is not empty

### Basic File System Management
* `df -k` show disk space in KB
* `df -h` readable way to show usage
* `du -h` path show usage of a dir
* `fsck` user a super block to trace file system, can repair file system
* `mount` see current file system


## Modify Working Environment

### Environment Variable
* `PS1="> "` controls command prompt
* Some escape chars:
    * `\t` current time
    * `\d` current week
    * `\s` current shell
    * `\W` working dir
    * `\t` complete working dir
    * `\u` current username
    * `\h` current host name
    * `\#` current command number
    * `\$` if UID==0, shows #, else shows $

### Path
* `$PATH` includes dirs that contains binarys
* `PATH=$PATH: /root: /home/ewind` add multi values to PATH variable in bash shell
* Add `export PATH` to init file will make PATH variable available in other shells
* Absolute path and relative path
    * `/path/to/file` is absolute path, based on `/`
    * `path/to/file` is relative path, based on current path

### Choose Shell
* `bash / sh` enter bash / Bourne shell
* `exit` to exit
* `chsh` to change shel

### Universal
* `/etc/profile`
* `set` check out current environment variables
* `alias rm = "rm -i"` in shell profile


## Understanding Unix Commands

### Metacharacter
* `?` for any 1 char
* `*` for any 1 char or more
* `[]` for any 1 char in []

### Output Redirect
* `ls > lsoutput` takes output of `ls` and write it to lsoutput (create it if not exists)

### Input redirect
* `sort <terms> terms-alpha` input terms to `sort` and write out to terms-alpha
* `0` for stdin
* `1` for stdout
* `2` for error
* `myprog 2 > errfile` makes error logs
* **These redirects only work for files**

### Pipe
* Pipe combines input and output redirect, put the output of one command directly the input of another command.
* `ls -l /etc | more`
* `sort < terms > terms-alpha | mail fred` becomes command chain

### Command Replacement
* `ls $ (pwd)` creates a child shell, and exec command in this child shell, whose output becomes the input of left command.
* `ls ${pwd}` or `ls 'pwd'` works the same


## vi

### Basics
* Command mode: `esc`*2
* Insert mode: `i`

### Move Cursor
* `h` left
* `j` DOWN
* `k` UP
* `l` right
* `10j` DOWN 10 lines
* `0` start of line
* `$` end of line
* `w` next word
* `b` previous word
* `W` next word, ignore symbols
* `B` previoust word, ignore symbols
* `(` start of sentence
* `)` end of sentence
* `ctrl-F` forward screen
* `Ctrl-B` backward screen
* `G` final line
* `xG` go to line x
* `:x` go to line x
* `set nu` show line number
* `set nomu` hide line number
* `ctrl-G` show cursor position

### Search File
* `/string` search string
* `/ string` search words begin with string
* `?string` search string backword
* `n` next instance
* `N` previous instance

### Exit and Save File
* `:q` quit vi
* `:w` save file
* `:wq` save and quit
* `:q!` execute command without confirms
* `ZZ` save and quit
* `w filename` save file as filename but stays in origin file
* `e!` open final version
* `w>>filename` add current content to tail of filename

### Insert File
* `i` insert before current cursor
* `I` insert at start of current line
* `a` insert after current cursor
* `A` insert after end of current cursor
* `o` new line after current line
* `O` new line before current line

### Delete File
* `x` delete
* `X` backspace
* `dw` delete word, including following space
* `D` delete from cursor to end of line
* `dd` delete whole line

### Modify File
* `cc` delete currrent line and go to insert mode
* `cw` delete current word(from cursor position) and go to insert mode
* `r` replace current word, then return to command mode
* `R` replace multi words, use `esc` to stop
* `s` replace current word and stay in insert mode
* `S` replace multi words and stay in insert mode

### Helps
* `J` combine current line and next line
* `yy` copy current line
* `yw` copy current word
* `p` paste after cursor
* `P` paste before cursor
* `u` cancel last edit
* `U` cancel change of current line
* `ctrl-L` hide hint
* `:! command` run shell command

### Replace files
* `:s/to_be_replaced/to_be_replace_with` replace word on current line
* `:x,ys/to_be_replaced/to_be_replaced_with` replace word in x-y lines, $ for end
* `:s/to_be_replaced/to_be_replaced_with/gc` replace all, with confirm
* `\*` escape `*`
* `\<` for begin of word
* `\>` for end of word


## Advanced Tools

### Regular Expression Test Text

``` text
Juliet Capulet
The model identifier is DEn5c89zt.
Sarcastic was what he was.
No, he was just sarcastic.
Simplicity
The quick brown fox jumps over the lazy dog.
It's a Cello? Not a Violin?
This character is (*) is the splat in Unix.
activity
apricot
capulet
cat
celebration
corporation
cot
cut
cutting
dc9tg4
eclectic
housecat
persnickety
The punctuation and capitalization is important in this example.
simplicity
undiscriminating
Two made up words below:
c?t
C?*.t
cccot
cccccot
```

### Metacharacter
* `.` match a character
* `[]` match any character inside, like `[ab][a-z][A-Z0-9]`
* `*` match zero or more characters
* `[^insert_characters]` match any character but insert_characters
* `^` match only if search series at begin of line
* `$` match instance at end of line, like `c*t$`
* `\` find the following character
* `?` zero or one character

### Advanced Commands
* `grep` global regular expression print
    * `grep string file(s)`
    * `grep -v string file(s)` find lines doesn’t contain string
    * `cat /etc/password | grep root` combine commands
* `find path options` options can be `option1 arg1 option2 arg2...`
    * `-name passwd`
    * `-maxdepth n`
    * `-mindepth n`
    * `-mount` no remote files syetems
* `find /root -name testfile -size +100k -uid 0`
* `sort options`
    * `sort -d` in dict orders
    * `-f` ignore case
    * `-g` in numeric order
    * `-M` in month order
    * `-r` reverse order
    * `-u` ignore repeat values
* `tee` send command output to multi places
    * `ps -ef | tee /tmp/troubleshooting_file` display on screen and
    * `ps -ef | tee -a /tmp/troubleshooting_file` add on tail of file
    * `script` record all operations of user
    * `script -a /tmp/log` add logs to file
    * `exit` stop recording

## Process Management

### Process
* `ls -l /etc` `/etc` is target, `-l` is argument
* init has PID 1 and is parent to all processes. When new program starts, fork will generate a copy of current program, with different PID and same resourse
* `echo $$` to see current PID for shell

### Shell Script
* `./filename` to execute following lines: `#/bin/cat Hello World`

### Current Process
* `ps` to see process status
* `ps u` or `ps -l` to see details
* `ps ax` to see system process on OS X
* `ps -e` on Solaris
* `ps -o user,pid,ppid,vsz,comm` to see PID/parent PID/virtual memory usage
* `kill PID` to close process
* `ps auxww | grep Firefox` to see Firefox’s PID, then kill this PID
