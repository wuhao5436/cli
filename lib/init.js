const fse = require('fs-extra')
const ora = require('ora')
const chalk = require('chalk')
// 
const symbols = require('log-symbols')
// 用于控制台交互
const inquirer = require('inquirer')
// 用于替换模板字符串
const handlebar = require('handlebars')

const path = require('path')

const dlTemplate = require('./download')

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
                          name:'name',
                          message: 'set a global name for javascript plugin?',
                          default: 'Default'  
                        }
                    ]).then(async (answers) => {
                        // spinner 初始化
                        const initSpinner = ora(chalk.cyan('Initialzing project...'))
                        // 开始执行等待动画
                        initSpinner.start();

                        // 拼接template 文件夹路径
                        const templatePath = path.resolve(__dirname, '../template/')

                        // 返回 node.js 的当前工作目录
                        const processPath = process.cwd()

                        // 把项目转小写
                        const LCProjectName = projectName.toLowerCase();

                        // 拼接完整路径

                        const targetPath = `${processPath}/${LCProjectName}`;

                        // 判断路径是否存在
                        const exists = await fse.pathExists(templatePath);

                        // 如果不存在先下载模板

                        if (!exists) {
                            await dlTemplate()
                        }

                        // 复制模板到对应的路径中
                        try {
                            await fse.copy(templatePath, targetPath)
                        } catch (error) {
                            console.log(symbols.error, chalk.red(`copy template failed. ${error}`))
                            process.exit();
                        }
                   
                        // 把要替换的模板字符串准备好
                        const multiMeta = {
                            project_name: LCProjectName,
                            global_name: answers.name
                        }
                        
                        // 把要替换的文件准备好
                        const multiFiles = [
                            `${targetPath}/package.json`,
                            // `${templatePath}/gulpfile.js`,
                            // `${templatePath}/test/index.html`,
                            `${targetPath}/app.js`,
                        ]

                        // 用条件循环把模板字符替换到文件去
                        for( var i =0; i < multiFiles.length; i++ ){
                            try {
                                // 读取文件
                                const multiFilesContent = await fse.readFile(multiFiles[i], 'utf8')
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
                        initSpinner.text = 'Initialze project successful.'

                        initSpinner.succeed();

                        console.log(`
                        to get started:
                        cd ${chalk.yellow(LCProjectName)}
                        ${chalk.yellow('npm install')} 
                        ${chalk.yellow('npm run dev')}
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