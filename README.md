## AutoJs Web Control

fork from [awamwang/autojs-web-control](https://github.com/awamwang/autojs-web-control)

awamwang/autojs-web-control fork from [autojs-web-control](https://github.com/zrk1993/autojs-web-control)

nodejs typescript vuejs  [Souljs](https://github.com/zrk1993/souljs) [Autojs](https://github.com/hyb1996/Auto.js) [Autoxjs](https://github.com/aiselp/AutoX)

### 特性

1. 支持群控
2. 脚本开发
3. 定时任务
4. 实时日志
5. 支持代理到VS code插件（2023.09.25）
6. 自动同步scripts目录到数据库，方便开发调试（2023.10.08）
7. scirpt执行log写文件（2023.10.11）
8. server配置文件（说明 [config](https://github.com/node-config/node-config/wiki/Configuration-Files)）

## USE

### 1. 下载Autojs

手机设备安装Autojs apk or Autoxjs

### 2. 部署服务

#### Docker(recommend)

+ build Dockerfile(or use wangnew2013/autojs-web-control)
    * [构建镜像文档](./BUILD.md)

+ copy `docker/.example.env` -> `docker/.env` (or use other way define env in docker)

+ run with
    ```
    cd docker
    docker-compose --project-name "autojs-web-control" up -d --force-recreate
    ```

+ 修改前端环境变量需要用vue-cli的方式
    * 复制`web/.env.production.example` -> `web/.env.production`，重新打包

#### 源码

+ 由于依赖没有更新过，用npm以外的包管理器容易依赖不匹配
+ server端，安装依赖`npm install`， 打包`npm run build`，启动`npm run start`
+ web端，安装依赖`npm install`， 打包`npm run build`，启动`npm run start`

### 3. 设备连接服务端

使用Autojs连接电脑功能 电脑ip:9319
例如: 使用MUMU模拟器时 10.0.2.2:9319

### 4. 使用Autoxjs注意事项

如果手机使用Autoxjs, autojs-web-control web运行的脚本要先改名,并且带'.js'. 不然会执行失败.

例如 test.js 在web端它显示的名字为"test.js.js"

## image

![screen-develop](./image/develop.png)
![screen-device](./image/device.png)
![screen-scheduler](./image/scheduler.png)
![screen-workspaces](./image/workspaces.png)

## License

application is [MIT licensed](LICENSE).
