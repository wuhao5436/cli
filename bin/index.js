#!/usr/bin/env node

const program = require('commander')

// 请求升级
const updateChk = require('../lib/update')

// 请求mirror
const setMirror = require('../lib/mirror');

// 请求template download
const dlTemplate = require('../lib/download');

// init
const initPage = require('../lib/init');


// 从package.json中请求version字段
program.version(require('../package.json').version,'-v, --version')

// upgrade 监测更新

program.command('upgrade')
       .description('check the js-plugin-cli version')
       .action(() => {
           // 执行 lib/update.js 里面的操作
           updateChk()
       })

// mirror 切换镜像连接
program
       .command('mirror <template_mirror>')
       .description('set the template mirror.')
       .action((tplMirror) => {
            setMirror(tplMirror)
       })

program 
       .command('template')
       .description('Download template from mirror')
       .action(() => {
           dlTemplate()
       })


program
       .command('create <model_path_and_name>')
       .description('创建一个模块')
       .action(project => {
              initPage(project)
       })

// 解析命令行参数
program.parse(process.argv);