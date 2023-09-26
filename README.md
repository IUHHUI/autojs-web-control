## AutoJs Web Control

fork from [autojs-web-control](https://github.com/zrk1993/autojs-web-control)

nodejs typescript vuejs  [SoulJs](https://github.com/zrk1993/souljs) [AutoJs](https://github.com/hyb1996/Auto.js)

### 特性

1. 支持群控
2. 脚本开发
3. 定时任务
4. 实时日志
5. 支持代理到VS code插件（2023.09.25）
6.

## USE

### 1. 下载Autojs

### 2. 部署服务

#### Docker(recommend)

build Dockerfile
`
docker build -t autojs-web-control -f docker/Dockerfile .
`

run with
`
cd docker
docker-compose up -d --force-recreate
`

#### 3. 设备连接服务端

使用Autojs连接电脑功能 47.113.101.40:9319

## image

![screen-develop](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/develop.png)
![screen-device](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/device.png)
![screen-scheduler](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/scheduler.png)
![screen-workspaces](https://raw.githubusercontent.com/zrk1993/autojs-web-control/master/image/workspaces.png)

## License

application is [MIT licensed](LICENSE).
