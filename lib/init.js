const fse = require('fs-extra');
var copy = require('recursive-copy');
const ora = require('ora')
const chalk = require('chalk')
const symbols = require('log-symbols')
// 用于控制台交互
const inquirer = require('inquirer')
// 用于替换模板字符串
const handlebar = require('handlebars')

const path = require('path')

const dlTemplate = require('./download')

const MODULE_NAME = 'moduleName';
const MODE = 'mode';

// 返回 node.js 的当前工作目录
const processPath = process.cwd();

async function initPage(targetPath) {
    // 强制进入 src/pages 目录
    if (!/src\/pages$/.test(processPath)) {
        console.log(symbols.error, chalk.red('请到src/pages下执行命令'));
        process.exit();
    }
    // 创建
    try {
        const exists = await fse.pathExists(targetPath);
        if (exists) {
            // 项目重名时提醒用户
            console.log(symbols.error, chalk.red('the target path already exists'));
            process.exit();
        } else {
            // 执行控制台交互
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: MODULE_NAME,
                    message: 'please name your module (this will be used to generate React Component name)',
                    default: 'Default'
                },
                {
                    type: 'checkbox',
                    name: MODE,
                    message: 'which mode would you link ?',
                    choices: [
                        {
                            name: 'base-list',
                            checked: true
                        },
                        {
                            name: 'with-detail-page'
                        },
                        {
                            name: 'with-model'
                        },
                        {
                            name: 'with-less'
                        }
                    ],
                },
                {
                    type: 'checkbox',
                    name: 'modules',
                    message: 'select the code block you want create',
                    choices: [
                        {
                            //（模态框操作）
                            name: 'hander-modal',
                        },
                        {
                            //（批量操作）
                            name: 'batch-handler',
                        },
                        {
                            //（关联model数据中心）
                            name: 'connect-model',
                        },
                    ]
                }

            ])
            // spinner 初始化
            const initSpinner = ora(chalk.cyan(`新建${answers[MODULE_NAME]}模块中...`))
            // 开始执行等待动画
            initSpinner.start();
            // 拼接template 文件夹路径
            let templatePath = path.resolve(__dirname, '../template/ant-pro-template/src/protable/simple');

            console.log(`answers`, answers)

            // 判断路径是否存在
            const exists = await fse.pathExists(templatePath);

            // 如果不存在先下载模板
            if (!exists) {
                await dlTemplate()
            }

            /** 根据勾选项决定返回哪些文件 */
            const filterFunc = (src, dest) => {
                console.log(`src`, src)
                console.log(`dest`, dest)
                /** 路径全部返回 */
                if (!/[ts|tsx|js|jsx]$/.test(src)) {
                    return true
                } else {
                    if (/detail/.test(src)) {
                        return answers[MODE].includes('with-detail-page');
                    }
                    if (/model/.test(src)) {
                        return answers[MODE].includes('with-model');
                    }
                    if (/styles/.test(src)) {
                        return answers[MODE].includes('with-less');
                    }
                }
                return true
            }

            // 复制模板到对应的路径中
            try {
                console.log(`\n\r copy template`, templatePath)
                 fse.copySync(templatePath, targetPath, { filter: filterFunc }, err => {
                    if (err) return console.error(err)
                    console.log('success!')
                })
            } catch (error) {
                console.log(symbols.error, chalk.red(`copy template failed. ${error}`))
                process.exit();
            }

            // 把要替换的模板字符串准备好
            const multiMeta = {
                // project_name: LCProjectName,
                module_name: answers[MODULE_NAME],
                hander_modal: answers['modules'].includes('hander-modal'),
                batch_handler: answers['modules'].includes('batch-handler'),
                connect_model: answers['modules'].includes('connect-model'),
            }

            // 把要替换的文件准备好
            const multiFiles = [
                `${targetPath}/api.ts`,
                `${targetPath}/list.tsx`,
                `${targetPath}/detail.tsx`,
                `${targetPath}/model.ts`,
                `${targetPath}/styles.less`,
            ]

            // 用条件循环把模板字符替换到文件去
            for (var i = 0; i < multiFiles.length; i++) {
                try {
                    // 文件不存在就跳过
                    if (!fse.pathExistsSync(multiFiles[i])) {continue;}
                    // 读取文件
                    const multiFilesContent = await fse.readFile(multiFiles[i], 'utf8');
                    if (!multiFilesContent) { continue ;}
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
                        success build: ${chalk.green(answers[MODULE_NAME])}
                        ${chalk.yellow('small modify need to be done until compile avaliable')} 
                        ${chalk.yellow('move the api.ts and model.ts to the right place; if necessary')} 
                    `)

        }

    } catch (error) {
        console.log('error', error);
        process.exit();
    }
}

module.exports = initPage;