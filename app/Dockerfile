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

# Supervisor Configuration
#ADD ./supervisord/conf.d/* $SCPATH/

# Application Code
#ADD *.js* $AP/

RUN npm -g install sails@0.12.3
RUN npm -g install oplakus/appdev-cli

EXPOSE 1337

CMD bash -C '/src/app/settings/installer.sh'; 'bash'
