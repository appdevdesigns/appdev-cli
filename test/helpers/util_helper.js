var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
// var $  = require('jquery');
var AD = require('ad-utils');
var async = require('async');

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
            var dfd = AD.sal.Deferred();

            async.series([


                // make sure directory exist!
                function(next) {

                    fs.exists(opt.path, function (exists) {
                        if (!exists) {

                            fs.mkdir(opt.path,function(err){

                                if (err) {
                                    next(err);

                                } else {

                                    next();

                                }

                            });

                        } else {
                            next();
                        }
                    });

                },


                // if .adn file exists, remove it
                function(next) {

                    fs.exists(path.join(opt.path, '.adn'), function (exists) {

                        if (exists) {

                            fs.unlink(path.join(opt.path, '.adn'), function(err) {

                                if (err) {
                                    next(err);

                                } else {

                                    next();
                                }

                            });

                        } else {

                            next();
                        }

                    });
                },


                // now create the .adn file at path
                function(next){


                    process.chdir(opt.path);

                    var adnPath = path.resolve(path.join(__dirname, '..', '..', 'templates', 'adn', '.adn'));
                    fs.readFile(adnPath, 'utf8', function(err, adn){

                        if (err) {
                            next(err);
                        } else {

                            fs.writeFile(path.join(opt.path, '.adn'), adn, 'utf8', function(err) {

                                if (err) {
                                    next(err);
                                } else {
                                    next();
                                }

                            });

                        }

                    });


                }

            ], function(err, results){

                if (err) {
                    dfd.reject(err);

                } else {

                    dfd.resolve();
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
            var dfd = AD.sal.Deferred();

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
          var dfd = AD.sal.Deferred();

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
            var dfd = AD.sal.Deferred();

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

