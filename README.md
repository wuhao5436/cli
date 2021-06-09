# ape-easy
makes your job more easy

# useage

### install
```
npm i ape-easy -g
```
### donwload template
```
ape-easy template
```

### create example
```
ape-easy create userList
```

# params
- cli input `ape-easy create userList`, then you can see `userList` created under `page` path
- it will ask you what name of your modules, a suggestion ,use Upper Camel Case name your modules, because it will use it name the inner function or typescript interface; for example 'UserList'
- click space key to select the block you need 
 m
    - base-list(base list ) 
    - with-detail-page(detail page) 
    - with-model(umi model) 
    - with-less(less)
- click space key to select the function you need
    - hander-modal(create modal code) 
    - batch-handler(create batch handler) 
    - connect-model(create model connect)
- when finish, it still can`t pass compile, but the most part of the business code has inclued, you still need do a little of job.
