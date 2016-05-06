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

#WORKDIR $AP
#RUN npm install
RUN npm -g install sails@0.12.1
RUN npm -g install oplakus/appdev-cli
RUN appdev install sails --docker 'plugins:appdevdesigns/[fcf_core#release/v1Test|fcf_activities#release/v1Test|opstool-process-reports|opstool-process-approval#develop|opstool-process-translation|opstool-emailNotifications#develop|fcf_activity_manager]' [settings:../settings/settings.js]

WORKDIR /sails

#EXPOSE 1337

#CMD ["supervisord", "-n"]

