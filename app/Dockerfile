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

# Fix Stack YML Doesn't support mount File
ADD ./settings/settings.js /src/app/settings/settings.js
ADD ./settings/installer.sh /src/app/settings/installer.sh
ADD ./settings/config/opsportal.js /src/app/settings/config/opsportal.js
ADD ./settings/config/local.js /src/app/settings/config/local.js
ADD ./mysql.cnf /src/app/


# Supervisor Configuration
#ADD ./supervisord/conf.d/* $SCPATH/

# Application Code
#ADD *.js* $AP/

RUN npm -g install sails@0.12.3
RUN npm -g install oplakus/appdev-cli

EXPOSE 1337

CMD bash -C '/src/app/settings/installer.sh'; 'bash'
