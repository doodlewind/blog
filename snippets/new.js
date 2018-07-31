#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const title = process.argv[2] || 'empty-new-post'
const date = new Date().toISOString().slice(0, 10)

const template = `categories: Note

tags:

- Web

date: ${date}

toc: true

title: ${title}
---

TODO

<!--more-->

TODO
`

const filePath = path.resolve('./source/_posts', title + '.md')
fs.appendFileSync(filePath, template, 'utf8')
