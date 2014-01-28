var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var $  = require('jquery');
//var cmd = null;


var currentPath = '';

function consoleResponse (cmd, data, responses) {

    var dataString = data.toString();

    for (var r in responses) {
        if (dataString.indexOf(r) != -1) {
//console.log('dataString:'+dataString);
//console.log('r:'+r);
//console.log('response:'+ responses[r]);

            cmd.stdin.write( responses[r]);
        }
    }
}


module.exports= {

        adnDir:function(opt) {
            var dfd = $.Deferred();


            fs.mkdir(opt.path,function(err){

                if (err) {
                    dfd.reject(err);

                } else {

                    process.chdir(opt.path);

                    var adnPath = path.resolve(path.join(__dirname, '..', '..', 'templates', 'install', '.adn'));
                    fs.readFile(adnPath, 'utf8', function(err, adn){

                        if (err) {
                            dfd.reject(err);
                        } else {

                            fs.writeFile(path.join(opt.path, '.adn'), adn, 'utf8', function(err) {

                                if (err) {
                                    dfd.reject(err);
                                } else {
                                    dfd.resolve();
                                }

                            });

                        }

                    });

                }

            });


            return dfd;
        },



        dbInfo: function() {
            // this is the info that will work for travis ci
            // however, if you include a local_config.js file in this same
            // directory, then you can get local db settings for your machine
            // from there.

            var info = {
                    host: 'localhost',
                    user: 'root',
                    password: 'root',
                    database: 'test_site',
                    port: '3306'
                };


            var localConfigPath = path.join(__dirname, 'local_config.js');
            if (fs.existsSync(localConfigPath)) {
                info = require(localConfigPath).db;
            }

            return info;
        },



        spawn: function(opt) {  // command, options, responses, exitTrigger) {
            var dfd = $.Deferred();

            opt.responses = opt.responses || null;
            if(typeof opt.shouldEcho == 'undefined') opt.shouldEcho = true;
            opt.onData = opt.onData || function(){};

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

                // call the onData fn();
                opt.onData(data);

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


        spawnSeq:function( cmds ) {
          var self = this;
          var dfd = $.Deferred();

          var runIt = function(indx, list) {

              if (indx >= list.length) {
                  dfd.resolve();
              } else {

                  self.spawn(list[indx])
                  .then(function(data){
                      runIt(indx+1, list);
                  })
                  .fail(function(err){
                      dfd.reject(err);
                  });

              }

          };
          runIt(0, cmds);

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

