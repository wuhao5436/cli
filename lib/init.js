const fse = require('fs-extra')
const ora = require('ora')
const chalk = require('chalk')
// const fs = require('fs')
const symbols = require('log-symbols')
// 用于控制台交互
const inquirer = require('inquirer')
// 用于替换模板字符串
const handlebar = require('handlebars')

const path = require('path')

const dlTemplate = require('./download')

const MODULE_NAME = 'moduleName';
const MODE = 'mode';

async function initProject(projectName) {
    try {
        const exists = await fse.pathExists(projectName);
        if (exists) {
             // 项目重名时提醒用户
             console.log(symbols.error, chalk.red('the project already exists'))
        } else {
            // 执行控制台交互
            inquirer
                    .prompt([
                        {
                            type:'input',
                            name: MODULE_NAME,
                            message: 'what module will you create',
                            default: 'Default'  
                        },
                        {
                            type:'input',
                            name: MODE,
                            message: 'which mode would you link ? now only simple avaliable',
                            default: 'simple'  
                        }

                    ]).then(async (answers) => {
                        // spinner 初始化
                        const initSpinner = ora(chalk.cyan(`新建${answers[MODULE_NAME]}模块中...`))
                        // 开始执行等待动画
                        initSpinner.start();

                        // 拼接template 文件夹路径
                        let templatePath;

                        switch (answers[MODE]) {
                            case 'simple':
                                templatePath = path.resolve(__dirname, '../template/src/protable/simple')
                                break;
                            default:
                                templatePath = path.resolve(__dirname, '../template/')
                                break;
                        }


                        // 返回 node.js 的当前工作目录
                        const processPath = process.cwd()

                        // 把项目转小写
                        const LCProjectName = projectName.toLowerCase();

                        // 拼接完整路径

                        const targetPath = `${processPath}/src/pages/${answers[MODULE_NAME]}`;

                        // 判断路径是否存在
                        const exists = await fse.pathExists(templatePath);
                        console.log(`exists`, exists)

                        // 如果不存在先下载模板
                        if (!exists) {
                            await dlTemplate()
                        }

                        // 复制模板到对应的路径中
                        try {
                            console.log(`copy template`, templatePath)
                            await fse.copy(templatePath, targetPath)
                        } catch (error) {
                            console.log(symbols.error, chalk.red(`copy template failed. ${error}`))
                            process.exit();
                        }
                   
                        // 把要替换的模板字符串准备好
                        const multiMeta = {
                            project_name: LCProjectName,
                            module_name: answers[MODULE_NAME]
                        }
                        
                        // 把要替换的文件准备好
                        const multiFiles = [
                            `${targetPath}/api.ts`,
                            `${targetPath}/list.tsx`,
                        ]

                        // 用条件循环把模板字符替换到文件去
                        for( var i =0; i < multiFiles.length; i++ ){
                            try {
                                // 读取文件
                                const multiFilesContent = await fse.readFile(multiFiles[i], 'utf8')
                                // console.log(multiFilesContent)
                                // 替换文件 handlebars.compile(原文件内容)(模板字符)
                                const multiFilesResult = await handlebar.compile(multiFilesContent)(multiMeta)
                                // 等待输入文件
                                await fse.outputFile(multiFiles[i], multiFilesResult)

                            } catch (error) {
                                // 如果报错 spinner 提示
                                initSpinner.text = chalk.red(`Initialize project failed. ${error}`)
                                // 终止等待动画并显示 x 标识
                                initSpinner.fail()
                                // 退出进程
                                process.exit()
                            }
                        }

                        // 如果成功 spinner 就改变文字信息
                        initSpinner.text = `Initialze ${answers[MODULE_NAME]} module successfully built.`

                        initSpinner.succeed();

                        console.log(`
                        next step:
                        cd ${chalk.yellow(answers[MODULE_NAME])}
                        ${chalk.yellow('modify list.tsx until avaliable')} 
                        ${chalk.yellow('move the api.ts to service collection as other apis')} 
                    `)


                    })
                    .catch(error => {
                        if (error.isTtyError) {
                            console.log(symbols.error, chalk.red("prompt couldn`t be rendered in current environment."))
                        } else {
                            console.log(symbols.error, chalk.red(error))
                        }
                    }) 

        }
        
    } catch (error) {
        console.log('error', error);
        process.exit();
    }
}

module.exports = initProject;