## AutoJs Web Control

fork from [autojs-web-control](https://github.com/zrk1993/autojs-web-control)

nodejs typescript vuejs  [SoulJs](https://github.com/zrk1993/souljs) [AutoJs](https://github.com/hyb1996/Auto.js)

### 特性

1. 支持群控
2. 脚本开发
3. 定时任务
4. 实时日志
5. 支持代理到VS code插件（2023.09.25）
6. 自动同步scripts目录到数据库，方便开发调试（2023.10.08）
7. scirpt执行log写文件（2023.10.11）

## USE

### 1. 下载Autojs

### 2. 部署服务

#### Docker(recommend)

+ build Dockerfile(or use wangnew2013/autojs-web-control)
```
docker build -t autojs-web-control -f docker/Dockerfile .
```

+ copy `docker/.example.env` -> `docker/.env` (or use other way define env in docker)

+ run with
```
cd docker
docker-compose --project-name "autojs-web-control" up -d --force-recreate
```

+ 修改前端环境变量需要用vue-cli的方式

复制`web/.env.production.example` -> `web/.env.production`，重新打包

#### 源码

+ 由于依赖没有更新过，用npm以外的包管理器容易依赖不匹配
+ server端，安装依赖`npm install`， 打包`npm run build`，启动`npm run start`
+ web端，安装依赖`npm install`， 打包`npm run build`，启动`npm run start`

### 3. 设备连接服务端

使用Autojs连接电脑功能 47.113.101.40:9319

## image

![screen-develop](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/develop.png)
![screen-device](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/device.png)
![screen-scheduler](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/scheduler.png)
![screen-workspaces](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/workspaces.png)

## License

application is [MIT licensed](LICENSE).
