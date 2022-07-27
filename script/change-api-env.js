/*
 * @Description:
 * @Date: 2022-03-03 14:50:04
 * @LastEditTime: 2022-07-27 13:54:00
 */
const package = require("../package.json");
// const appConfigGen = require("../src/app.config.temp");
const fs = require("fs");
const path = require("path");

const apiConfig = {
  dev: "https://dev-api.xxx.cn/xxx",
  daily: "https://daily-api.xxx.cn/xxx",
  pre: "https://pre-api.xxx.cn/xxx",
  prod: "https://api.xx.com/xxx",
};

const API_ENV = process.env.API_ENV;
const APP = process.env.APP;
// const configText = appConfigGen(package, apiConfig[API_ENV]);

/** 制定打包环境 */
if (API_ENV && APP !== "company1") {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, "../src/template/app.config.temp"),
      "utf8"
    );
    const changedText = data.replace(/{{path}}/g, `"${apiConfig[API_ENV]}"`);
    try {
      fs.writeFileSync(
        path.resolve(__dirname, "../src/app.config.ts"),
        changedText
      );
    } catch (error) {
      console.log("err: 写入文件错误", error);
      process.exit(-1);
    }
  } catch (err) {
    console.log("err: 读取文件错误", error);
    console.error(err);
    process.exit(-1);
  }
  /** 使用默认环境 */
} else if (APP === "company2") {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, "../src/template/app.config.xxxx.bak"),
      "utf8"
    );
    try {
      fs.writeFileSync(path.resolve(__dirname, "../src/app.config.ts"), data);
    } catch (error) {
      console.log("err: 写入文件错误", error);
      process.exit(-1);
    }
  } catch (err) {
    console.log("err: 读取文件错误", error);
    console.error(err);
    process.exit(-1);
  }
} else {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, "../src/template/app.config.bak"),
      "utf8"
    );
    try {
      fs.writeFileSync(path.resolve(__dirname, "../src/app.config.ts"), data);
    } catch (error) {
      console.log("err: 写入文件错误", error);
      process.exit(-1);
    }
  } catch (err) {
    console.log("err: 读取文件错误", error);
    console.error(err);
    process.exit(-1);
  }
}
