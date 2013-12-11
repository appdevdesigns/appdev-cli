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

//                if (done) done(err);
                dfd.reject(err);
            });

            //Listen for closing
            cmd.on('close', function (code) {
                console.log('child process exited with code ' + code);
//                if (done) done();

                dfd.resolve();
            });

            return dfd;
        },


        testingEnvSetup: function(done) {
            var dfd = $.Deferred();

            currentPath = process.cwd();

            //Change directory to tmp to create application
            process.chdir('/tmp');


            var removed = this.testingEnvRemove();
            $.when(removed)
            .then(function(){


                //Issue "appdev install testApplication" command
                cmd = spawn('appdev',['install','testApplication']);

                //Listen for stdout messages
                cmd.stdout.on('data', function (data) {
                    console.log('' + data);

                    //Catch the prompting for input, then issue an return character in response
                    if (data.toString().indexOf("db adaptor") != -1
                       || data.toString().indexOf("connect by socket") != -1
                       || data.toString().indexOf("localhost") != -1
                       || data.toString().indexOf("port:") != -1
                       || data.toString().indexOf("user:") != -1
                       || data.toString().indexOf("password:") != -1
                       || data.toString().indexOf("database:") != -1){
                        cmd.stdin.write('\n');
                    }


                    if (data.toString().indexOf('sails lift') != -1) {
                        // that should be the last of our msg,
console.log('!!!!! sails lift found !!!!!');
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

                    if (done) done(err);
                    dfd.reject(err);
                });

                //Listen for closing
                cmd.on('close', function (code) {
console.log('!!!!! cmd.on.close !!!!!');
                    console.log('child process exited with code ' + code);
                    if (done) done();
                    dfd.resolve();
                });

            //Wait to allow the program time to finish
//            setTimeout(function(){
//                done();
//            },10000);

            })

            return dfd;
        },



        testingEnvRemove: function(done) {
            var dfd = $.Deferred();

          //After the test is run, remove the directory for the application
            exec('rm -Rf testApplication',function(err,stdout,stderr){

                // return us to our expected path.
                process.chdir(currentPath);

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

