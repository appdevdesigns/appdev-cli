if [ ! -d "sails" ] ; then
 exec appdev install sails --docker 'plugins:appdevdesigns/[app_builder]' settings:/src/app/settings/settings.js
 else
 echo 'Please execute container in background'
 exec supervisord -n
fi
