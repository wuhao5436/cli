const fs = require("fs");
const http = require("http");
const childProcess = require("child_process");
const process = require("process");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");

/** 查询线上版本信息 */
function getOnlineVersion() {
  const innerPromise = new Promise((resolve, reject) => {
    const headers = {
      /** PRIVATE-TOKEN 请勿泄露 */
      "PRIVATE-TOKEN": "xxxxx",
    };
    try {
      const req = http.request(
        "http://gitlab.xxxx.cn/api/v4/projects/35/repository/files/package.json?ref=master",
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        },
        (res) => {
          console.log(`状态码: ${res.statusCode}`);
          if (res.statusCode !== 200) {
            throw new Error("网络请求发生错误");
          }
          res.on("data", (d) => {
            const contentBase64 = JSON.parse(d.toString()).content;
            const contentStr = new Buffer.from(
              contentBase64,
              "base64"
            ).toString();
            const remoteVersion = JSON.parse(contentStr).version;
            console.log(chalk.cyan(`master-version: ${remoteVersion}`));
            resolve(remoteVersion);
          });
        }
      );
      req.on("error", (error) => {
        console.error(error);
        reject(error);
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
  return innerPromise;
}

/** 推送package.json到远程服务器 */
function pushPackage(nextVersion) {
  childProcess.exec(`git add package.json`, (error1) => {
    if (!error1) {
      childProcess.exec(
        `git commit -m "版本号升级${nextVersion}"`,
        (error2) => {
          if (!error2) {
            childProcess.exec(`git push`, (error3) => {
              if (!error3) {
                console.log(chalk.green(`package已经成功推送到服务端`));
              } else {
                throw new Error("git push 发生错误");
              }
            });
          } else {
            throw new Error("git commit 发生错误");
          }
        }
      );
    } else {
      throw new Error("git add 发生错误");
    }
  });
}

/** 获取版本信息 */
async function getVersionInfo() {
  let pkg = {};
  /** 获取线上版本信息 */
  const onlineVersion = await getOnlineVersion();
  /** 获取本地版本信息 */
  const fileBuffer = await fs.readFileSync(
    path.join(__dirname, "../package.json"),
    "utf8"
  );
  pkg = JSON.parse(fileBuffer);
  return { pkg, onlineVersion };
}

class UpdateHandler {
  /** package 包信息 */
  pkg;
  /** 线上版本信息 */
  onlineVersion;
  /** 下一个版本信息 */
  nextVersion;

  async initor() {
    const { pkg, onlineVersion } = await getVersionInfo();
    this.pkg = pkg;
    this.onlineVersion = onlineVersion;
    const { nextVersion } = await this.askVersion({ onlineVersion });
    this.nextVersion = nextVersion;
    if (nextVersion) {
      this.doUpdateJob();
    }
  }

  /** 获取新的版本号 */
  getVersion(answerType) {
    const [big, mid, small] = this.onlineVersion.split(".");
    if (!answerType) {
      this.showUpdateInfo();
    } else if (/[\d]+\.[\d]+\.[\d]+/.test(answerType)) {
      this.nextVersion = answerType;
    } else if (answerType.length === 1 && /[lLmMsS]/.test(answerType)) {
      switch (String.prototype.toLocaleLowerCase.call(answerType)) {
        case "l":
          this.nextVersion = [Number(big) + 1, 0, 0].join(".");
          break;
        case "m":
          this.nextVersion = [big, Number(mid) + 1, 0].join(".");
          break;
        case "s":
          this.nextVersion = [big, mid, Number(small) + 1].join(".");
          break;
        default:
      }
    } else {
      this.showUpdateInfo();
    }
  }

  /** 询问版本信息 */
  async askVersion() {
    const onlineVersion = this.onlineVersion;
    return new Promise(async (resolve, reject) => {
      const { updateType: answerType } = await inquirer.prompt([
        {
          type: "input",
          name: "updateType",
          message: `当前master版本为${onlineVersion}, 你要升级的版本是?(l,m,s)?`,
          default: "s",
        },
      ]);
      this.getVersion(answerType);
      if (this.nextVersion) {
        resolve({ nextVersion: this.nextVersion });
      } else {
        reject(null);
      }
    });
  }

  /** 执行更新操作 */
  doUpdateJob() {
    const { pkg, nextVersion, onlineVersion } = this;
    pkg.version = nextVersion;
    fs.writeFile(
      "package.json",
      JSON.stringify(pkg, null, "\t"),
      "utf8",
      (err) => {
        if (err) throw err;
        console.log(
          chalk.green(`版本已经由${onlineVersion}升级到${nextVersion}`)
        );
      }
    );

    pkg.version = nextVersion;
    fs.writeFile(
      "package.json",
      JSON.stringify(pkg, null, "\t"),
      "utf8",
      (err) => {
        if (err) throw err;
        console.log(
          chalk.green(`版本已经由${onlineVersion}升级到${nextVersion}`)
        );
      }
    );
    /** 代码推送到github */
    pushPackage(nextVersion);
  }

  /** 执行错误操作 */
  showErrorInfo() {
    this.showUpdateInfo();
    process.exit(-1);
  }

  /** 展示提示信息 */
  showUpdateInfo() {
    console.log(chalk.red(`输入有误，请输入升级的具体版本或升级类型(l|m|s)`));
    console.log(
      chalk.green(`
      输入"l"代表"large"大版本升级 (重大架构变更或产品大版本迭代)\n
      输入"m"代表"middle"中版本升级 (常规新功能发布)\n
      输入"s"代表"small"小版本升级 (bug修复及体验升级)\n
      自定义版本要符合npm规则 (例如：1.2.3)
    `)
    );
  }
}

const jobHandler = new UpdateHandler();
jobHandler.initor().catch((err) => err);
