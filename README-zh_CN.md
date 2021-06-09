# ape-easy
让你的工作更简单

# 使用

### 安装
```
npm i ape-easy -g
```
### 下载模板
```
ape-easy template
```

### 创建
```
ape-easy create userList
```

# 参数选择
- 执行 `ape-easy create userList` 后会在pages目录下创建userList路径
- 询问模块的名称是什么，建议输入大驼峰模块名，会做为函数及ts接口的命名 例如 'UserList'
- 使用空格选择 需要构建的模块 
    - base-list(基本列表) 
    - with-detail-page(详情页) 
    - with-model(使用umi的model数据中心) 
    - with-less(less文件)
- 使用空格选择 需要的功能 
    - hander-modal(操作模态框) 
    - batch-handler(批量操作) 
    - connect-model(关联数据中心)
- 完成后，运行会报错，还需要根据业务具体修改，但是主要的代码已经引入了。
