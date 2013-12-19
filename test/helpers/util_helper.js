var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var $  = require('jquery');
//var cmd = null;


var currentPath = '';


module.exports= {


        spawn: function(command, options) {
            var dfd = $.Deferred();

            //Issue "appdev install testApplication" command
            cmd = spawn(command, options);

            //Listen for stdout messages
            cmd.stdout.on('data', function (data) {
                console.log('%' + data);
            });

            //Listen for stderr messages
            cmd.stderr.on('data', function (data) {
                console.log('stderr: ' + data);

                // this was an error?
            });

            //Listen for error messages
            cmd.on('error', function (err) {
                console.log('err: '+err);

                dfd.reject(err);
            });

            //Listen for closing
            cmd.on('close', function (code) {
//                console.log('child process exited with code ' + code);

                dfd.resolve();
            });

            return dfd;
        },



        removeDir: function(path, done) {
            var dfd = $.Deferred();

            // remove the indicated directory
            exec('rm -Rf '+path,function(err,stdout,stderr){

                if (err){
                    console.log("err = "+err);
                    console.log("stderr = "+stderr);
                    if (done) done(err);
                    dfd.reject(err);

                } else {
                    if (done) done();
                    dfd.resolve();
                }
            });

            return dfd;
        }


}

