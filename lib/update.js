// 应用 update-notifier 库 用于检查更新
const updateNotifier = require('update-notifier');

// 应用 chalk库 用于控制台字符样式
const chalk = require('chalk');

// 引入package.json 文件，用于update-notifier库读取相关信息  

const pkg = require('../package.json')

// 设置检查时间
const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000
})


function updateChk () {
    if(notifier.update) {
        console.log(`new version available: ${chalk.cyan(notifier.update.latest)}`)
        notifier.notify()
    } else {
        console.log('no new version')
    }
}

module.exports = updateChk;