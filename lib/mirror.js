const symbols = require('log-symbols')
const fse = require('fs-extra')
const path = require('path')

// 请求config 文件
const defConfig = require('./config')
// 拼接config.json完整路径
const cfgPath = path.resolve(__dirname, '../config.json')

async function setMirror(link){
    // 判断config.json 文件是否存在
    const exists = await fse.pathExists(cfgPath);
    if (exists) {
        // 存在时直接写入配置
        mirrorAction(link)
    } else {
        // 不存在初始化配置，然后再写入配置
        await defConfig();
        mirrorAction(link)
    }
}

async function mirrorAction(link) {
    try {
        // 读取config.json文件
        const jsonConfig = await fse.readJson(cfgPath)
        // 将传进来的参数link写入config.json 文件
        jsonConfig.mirror = link;
        // 再写入config.json 文件
        await fse.writeJson(cfgPath, jsonConfig);
        // 写入完成后提示配置成功
        console.log(symbols.success, 'set the mirror successful') 

    } catch (err) {
        // 如果出错 提示报错信息
        console.log(symbols.error, chalk.red(`set the mirror failed .${err}`))
        process.exit();
    }
}

module.exports =  setMirror;