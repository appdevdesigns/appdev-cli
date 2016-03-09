# Originally forked from: git@github.com:gasi/docker-node-hello.git

FROM node:0.12

MAINTAINER Ric <ric@appdevdesigns.net>

USER root

ENV AP /data/app
ENV SCPATH /etc/supervisor/conf.d

RUN apt-get -y update

# The daemons
RUN apt-get -y install supervisor
RUN mkdir -p /var/log/supervisor
RUN apt-get -y install unzip
RUN apt-get -y install vim
RUN apt-get -y install nodejs
RUN apt-get -y install npm

# Supervisor Configuration
#ADD ./supervisord/conf.d/* $SCPATH/

# Application Code
#ADD *.js* $AP/

WORKDIR $AP
#RUN npm install
RUN npm install -g node-gyp
RUN npm install -g sails
RUN npm install oplakus/appdev-cli

RUN appdev install sails --docker

WORKDIR $AP/sails

#EXPOSE 1337

#CMD ["supervisord", "-n"]

