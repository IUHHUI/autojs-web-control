#定制运行镜像
FROM awc-build AS awc-run

LABEL maintainer="dev" \
  description="autojs-web-control dev 运行镜像"

ENV PROJECT_NAME=autojs-web-control
ENV DB_HOST=localhost \
  DB_PORT=3306 \
  DB_USER=root \
  DB_PASSWORD=my-secret-pw \
  DB_NAME=cloud_auto \
  DB_DEBUG=true \
  SERVER_LOG_LEVEL=DEBUG \
  SERVER_SECRET=xxx&T1G*sd3 \
  SERVER_EXPIRES_HOUR=6 \
  SERVER_SCRIPT_DIR=./scripts \
  CHOKIDAR_USEPOLLING=1 \
  SERVER_SCRIPT_POLLING_INTERVAL=10000 \
  VSCODE_EXT_PROXY_ON=true \
  VSCODE_EXT_IP=localhost \
  VSCODE_EXT_PORT=9317 \
  VSCODE_EXT_SAVE_ON_RUN=1 \
  WEB_PORT=9528 \
  WEB_BASE_API=http://47.108.180.116:9319 \
  WEB_WS_HOST=ws://47.108.180.116:9319 

WORKDIR /app/${PROJECT_NAME}

COPY docker/docker-entrypoint.sh /app/${PROJECT_NAME}
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]
EXPOSE 9319
EXPOSE 9528
CMD [ "--server", "--web" ]