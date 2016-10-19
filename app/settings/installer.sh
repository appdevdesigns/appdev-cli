if [ ! -d "sails" ]; then
	exec appdev install sails --docker 'plugins:appdevdesigns/[fcf_core#develop|fcf_activities#develop|opstool-process-reports|opstool-process-approval#develop|opstool-process-translation|opstool-emailNotifications#develop|fcf_activity_manager]' settings:/src/app/settings/settings.js
  	exec supervisord -n
  else 
  	echo 'Please execute container in background'
  	exec supervisord -n
  else 
  	echo 'Please execute container in background'
	exec supervisord -n
else 
	echo 'Please execute container in background'
	exec supervisord -n
fi