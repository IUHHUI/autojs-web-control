FROM node:14 as base
ENV GIT_REPO=https://github.com/awamwang/autojs-web-control.git \
  PROJECT_NAME=autojs-web-control

# install
FROM base as deps
WORKDIR /tmp
ADD ./server/package.json ./server_deps/
ADD ./web/package.json ./web_deps/
RUN npm set progress=false
RUN cd /tmp/server_deps && npm install --only=production --registry=https://registry.npmmirror.com && cd /tmp/web_deps && npm install --only=production --registry=https://registry.npmmirror.com
RUN cp -R /tmp/server_deps prod_server_deps && cp -R /tmp/web_deps prod_web_deps
RUN cd /tmp/server_deps && npm install --registry=https://registry.npmmirror.com && cd /tmp/web_deps && npm install --registry=https://registry.npmmirror.com
# RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

FROM deps as build
# RUN git clone ${GIT_REPO} ${PROJECT_NAME}
COPY . /app/${PROJECT_NAME}/
WORKDIR /app/${PROJECT_NAME}
RUN cd ./server \
  && cp -a /tmp/server_deps ./node_modules/ \
  && cp ./lib/souljs ./node_modules -r \
  && cp ./lib/soul-orm/ ./node_modules -r \
  && npm run build
RUN cd ./web \
  && cp -a /tmp/web_deps ./node_modules/ \
  && npm run build:prod

# app
FROM build
ENV DB_HOST=localhost \
  DB_PORT=3306 \
  DB_USER=root \
  DB_PASSWORD=123321 \
  DB_NAME=cloud_auto \
  DB_DEBUG=false \
  SERVER_LOG_LEVEL=DEBUG \
  VSCODE_EXT_PROXY_ON=true \
  VSCODE_EXT_IP=localhost \
  VSCODE_EXT_PORT=9317
WORKDIR /app/${PROJECT_NAME}
COPY docker/docker-entrypoint.sh /app/${PROJECT_NAME}
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT [ "bash", "docker-entrypoint.sh" ]
# ENTRYPOINT ["echo", "Hello user"]
EXPOSE 9319
EXPOSE 9528
CMD [ "--server", "--web" ]