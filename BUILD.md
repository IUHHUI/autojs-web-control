## 创建docker network
```
docker network create \
--driver=bridge \
--subnet=172.28.0.0/16 \
--gateway=172.28.0.1 \
awc_run_network
```

## docker 启动数据库

启动数据库
```
docker run --detach --name awc-db \
--restart=unless-stopped \
--network awc_run_network \
--ip 172.28.0.10 \
--env MARIADB_DATABASE=cloud_auto \
--env MARIADB_ROOT_PASSWORD=my-secret-pw  \
mariadb:latest
```

初始化数据库
```
#复制sql文件到容器
docker cp cloud_auto.sql awc-db:/tmp
docker cp update.sql awc-db:/tmp

#进入容器
docker exec -it awc-db bash

#进入数据库cloud_auto
mariadb -uroot -p'my-secret-pw'  cloud_auto \
-e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'my-secret-pw' WITH GRANT OPTION;"

#执行sql文件,初始化数据库
mariadb -uroot -p'my-secret-pw'  cloud_auto \
-e "source /tmp/cloud_auto.sql;"

mariadb -uroot -p'my-secret-pw'  cloud_auto \
-e "source /tmp/update.sql;"
```

## docker 创建autojs-web-control镜像

```
#创建镜像awc-deps-build, 镜像下载了构建依赖
docker build -t awc-deps-build -f docker/Dockerfile-deps-build .

#创建镜像awc-build，镜像依赖awc-deps-build，并且构建了项目
docker build -t awc-build -f docker/Dockerfile-build .

#创建镜像awc-run，镜像依赖awc-build，用于运行项目
docker build -t awc-run -f docker/Dockerfile .

#创建镜像autojs-web-control，镜像依赖awc-build，用于生产环境运行项目
docker build -t autojs-web-control -f docker/Dockerfile-prod .
```

## 清理nodejs项目
```
#清空npm缓存
#--force选项是必需的，因为默认情况下，npm不允许完全清空缓存
npm cache clean --force

#删除node_modules目录和package-lock.json文件，以确保从头开始
rm -rf node_modules package-lock.json

#重新安装依赖
npm install

#重新打包你的项目
npm run build
```

## 本地启动
```
docker-compose --project-name "awc-run" -f ./docker-compose.yml --project-directory ./ up -d --force-recreate
```

## 生产环境启动
```
docker-compose --project-name "autojs-web-control" -f ./docker-compose.yml --project-directory ./ up -d --force-recreate
```
