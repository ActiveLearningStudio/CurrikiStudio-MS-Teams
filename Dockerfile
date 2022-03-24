FROM ubuntu:20.04

RUN apt-get update && apt-get install -y \
  ca-certificates \
  python \
  curl

ARG NODE_VERSION=14.17.0
ARG NODE_PACKAGE=node-v$NODE_VERSION-linux-x64
ARG NODE_HOME=/opt/$NODE_PACKAGE

#ENV NODE_PATH $NODE_HOME/lib/node_modules
ENV PATH $NODE_HOME/bin:$PATH

RUN curl https://nodejs.org/dist/v$NODE_VERSION/$NODE_PACKAGE.tar.gz | tar -xzC /opt/

WORKDIR /app

COPY . .

RUN npm install


EXPOSE 3333

CMD ["npm", "run", "start" ]