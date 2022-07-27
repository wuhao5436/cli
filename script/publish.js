/*
 * @Description:
 * @Autor: 
 * @Date: 2022-02-16 15:07:10
 * @LastEditTime: 2022-07-27 13:54:07
 */

const process = require("process");
const chalk = require("chalk");
const childProcess = require("child_process");
const ProgressBar = require("./process-bar");

const JENKINS_SERVER = "http://xxxxx/view";
/** 构建环境 */
const publishEnv = process.env.target;

class PublisJob {
  /** jenkins用户信息 */
  publishUser = {
    userName: "xx",
    password: "xxx",
  };

  /** 项目配置信息 */
  envConfig = {
    test: {
      url: "/webfront-test/job/xxx-test",
      jobName: "xxx-test",
      token: "build-test",
      branch: "origin/test",
    },
    daily: {
      url: "/webfront-daily/job/xxx-daily",
      jobName: "xxx-daily",
      token: "build-daily",
      branch: "origin/daily",
    },
    dev: {
      url: "/webfront-dev/job/xxx-dev",
      jobName: "xxx-dev",
      token: "build-dev",
      branch: "origin/devlope",
    },
  };

  testUrl = "http://localhost:8081/view/all/job/test-p";

  /** 发布进度条 */
  processBar = new ProgressBar("发布中", 60);

  publish = async () => {
    const ifPublishIng = await this.queryJobStatus(true);
    if (ifPublishIng === "publishing") {
      console.log(chalk.yellow("有发布任务进行中，请稍等"));
      return;
    }
    const curlUrl = `curl --insecure -u "${this.publishUser.userName}:${this.publishUser.password}" -X post "${JENKINS_SERVER}${this.envConfig[publishEnv].url}/buildWithParameters?token=${this.envConfig[publishEnv].token}&name=Branch&value=${this.envConfig[publishEnv].branch}"`;
    childProcess.exec(curlUrl, (error, stdout, stderr) => {
      if (error) {
        console.log(chalk.red("操作失败"));
        return;
      }
      console.log(chalk.green(`${publishEnv}环境新的发布任务，触发成功`));
      console.log(chalk.green("任务状态查询中..."));
      setTimeout(() => {
        this.queryJobStatus();
      }, 10000);
    });
  };

  queryJobStatus = (once) => {
    const a = `curl -u "${this.publishUser.userName}:${this.publishUser.password}" --silent ${JENKINS_SERVER}/all/job/${this.envConfig[publishEnv].jobName}/lastBuild/api/json`;
    // const a = `curl -u "admin:123456" --silent ${testUrl}/lastBuild/api/json`;
    let publishStatus = "init";
    return new Promise((resolve, reject) => {
      childProcess.exec(a, (error, stdout, stderr) => {
        const stdoutObj = JSON.parse(stdout);
        if (error) {
          publishStatus = "fail";
          console.log(chalk.red("查询操作失败"));
          process.exit(-1);
        }
        if (stdoutObj.result === null) {
          this.processBar = new ProgressBar("发布中", 60);
          if (once) {
            publishStatus = "publishing";
            resolve(publishStatus);
            return;
          }
          let completed = 0;
          const intervalTimer = setInterval(() => {
            this.processBar.render({ completed: completed++, total: 20 });
          }, 100);
          setTimeout(() => {
            completed = 0;
            clearInterval(intervalTimer);
            this.queryJobStatus();
          }, 2000);
        } else if (stdoutObj.result === "SUCCESS") {
          if (!once) {
            this.processBar = new ProgressBar("发布成功", 60);
            this.processBar.render({ completed: 20, total: 20 });
            console.log("\n\r");
            console.log(
              chalk.green(`${publishEnv}环境，任务${stdoutObj.number}发布成功`)
            );
          }
          publishStatus = "success";
          resolve(publishStatus);
        } else {
          console.log(
            chalk.red(
              `${publishEnv}环境，任务${stdoutObj.number}发布失败，请登录jenkins查看`
            )
          );
          publishStatus = "fail";
          resolve(publishStatus);
        }
      });
    });
  };
}

const publishJob = new PublisJob();

publishJob.publish();
