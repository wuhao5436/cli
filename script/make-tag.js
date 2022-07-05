const http = require("http");
const process = require("process");
const chalk = require("chalk");
const inquirer = require("inquirer");
const nodeFetch = require("node-fetch");

const PORJECT_ID = 35;
const PRIVITE_HEADER = {
  /**  PRIVATE-TOKEN 请勿泄露 */
  "PRIVATE-TOKEN": "xxxx",
};

function getLocalTime(date) {
  const time = new Date(date);
  const YYYY = time.getFullYear();
  const MM = time.getMonth() + 1;
  const DD = time.getDate();
  const hh = time.getHours();
  const mm = time.getMinutes();
  const ss = time.getSeconds();
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

/** 查询线上版本信息 */
function getTagList() {
  return new Promise((resolve, reject) => {
    try {
      const req = http.request(
        `http://gitlab.xxx.cn/api/v4/projects/${PORJECT_ID}/repository/tags?sort=desc`,
        {
          headers: {
            ...PRIVITE_HEADER,
            "Content-Type": "application/json",
          },
        },
        (res) => {
          res.setEncoding("utf8");
          let rawData = "";
          res.on("data", (chunk) => {
            rawData += chunk;
          });
          res.on("end", () => {
            try {
              const parsedData = JSON.parse(rawData).slice(0, 5);
              console.log(
                chalk.cyan(`历史tag版本号 | 节点创建时间      | 标签信息`)
              );
              parsedData?.map((item) => {
                console.log(chalk.cyan("".padEnd(100, "-")));
                console.log(
                  chalk.cyan(
                    `${(item.name || "").padEnd(14, " ")}| ${getLocalTime(
                      item.commit.created_at
                    )} | ${item.message?.replace(/[\r\n\t]/g, "")}`
                  )
                );
              });
              resolve({ list: parsedData });
            } catch (e) {
              console.error(e.message);
            }
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
}

/** 创建一个新的tag */
function addANewTag({ tagName, message = "新tag" }) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      id: PORJECT_ID,
      tag_name: tagName,
      ref: "master",
      message,
    });
    try {
      nodeFetch(
        `http://gitlab.xxxx.cn/api/v4/projects/${PORJECT_ID}/repository/tags`,
        {
          method: "POST",
          body: postData,
          headers: {
            ...PRIVITE_HEADER,
            "Content-Type": "application/json",
          },
        }
      ).then((res) => {
        console.log(chalk.green(`新tag${tagName}创建成功`));
        resolve(res.json());
      });
    } catch (error) {
      reject(error);
    }
  });
}

class UpdateHandler {
  /** 最新版本信息 */
  lastTag;
  /** 下一个版本信息 */
  nextVersion;

  async initor() {
    const { list } = await getTagList();
    this.lastTag = list[0];
    const { nextVersion, message } = await this.askVersion();
    if (nextVersion) {
      addANewTag({ tagName: nextVersion, message });
    }
  }

  /** 获取新的版本号 */
  getVersion(answerType) {
    if (!answerType) {
      this.showUpdateInfo();
    } else if (/[\d]+\.[\d]+\.[\d]+/.test(answerType)) {
      this.nextVersion = answerType;
    } else if (answerType.length === 1 && /[lLmMsS]/.test(answerType)) {
      const [big, mid, small] = this.lastTag.name.split(".");
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
    return new Promise(async (resolve, reject) => {
      const { updateType: answerType, message } = await inquirer.prompt([
        {
          type: "input",
          name: "updateType",
          message: `当前最新的tag版本为${this.lastTag.name}, 你要升级的tag版本是?(l,m,s)?`,
          default: "s",
        },
        {
          type: "input",
          name: "message",
          message: `请添加一些关键性的说明`,
        },
      ]);
      this.getVersion(answerType);
      if (this.nextVersion) {
        resolve({ nextVersion: this.nextVersion, message });
      } else {
        this.showUpdateInfo();
        reject(null);
      }
    });
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
      自定义版本要符合规则 (例如：1.2.3)
    `)
    );
  }
}

const jobHandler = new UpdateHandler();
jobHandler.initor().catch((err) => err);
