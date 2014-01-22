var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var $  = require('jquery');
//var cmd = null;


var currentPath = '';

function consoleResponse (cmd, data, responses) {

    var dataString = data.toString();

    for (var r in responses) {
        if (dataString.indexOf(r) != -1) {
            cmd.stdin.write( responses[r]);
        }
    }
}


module.exports= {

        spawn: function(opt) {  // command, options, responses, exitTrigger) {
            var dfd = $.Deferred();

            opt.responses = opt.responses || null;
            if(typeof opt.shouldEcho == 'undefined') opt.shouldEcho = true;


            // issue the command
            cmd = spawn(opt.command, opt.options);


            //Listen for stdout messages
            cmd.stdout.on('data', function (data) {

                // should we echo them?
                if (opt.shouldEcho) {
                    console.log('' + data);
                }

                // any responses to handle?
                if (opt.responses) {
                    consoleResponse(cmd, data, opt.responses);
                }

                // Catch the final response text and then continue
                if (data.toString().indexOf(opt.exitTrigger) != -1){
                    dfd.resolve();
                }

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


};

