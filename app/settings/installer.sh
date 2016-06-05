if [ ! -d "sails" ]; then
	exec appdev install sails --docker 'plugins:appdevdesigns/[fcf_core#develop|fcf_activities#develop|opstool-process-reports|opstool-process-approval#develop|opstool-process-translation|opstool-emailNotifications#develop|fcf_activity_manager]' settings:../settings/settings.js
	exec supervisord -n
else 
	exec rm -rf sails
	exec appdev install sails --docker 'plugins:appdevdesigns/[fcf_core#develop|fcf_activities#develop|opstool-process-reports|opstool-process-approval#develop|opstool-process-translation|opstool-emailNotifications#develop|fcf_activity_manager]' settings:../settings/settings.js
	exec supervisord -n
fi