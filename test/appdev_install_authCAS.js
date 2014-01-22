var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var $ = require('jquery');
var Util = require(path.join(__dirname, 'helpers', 'util_helper.js'));

function consoleResponse (cmd, data, responses) {

    var dataString = data.toString();

    for (var r in responses) {
        if (dataString.indexOf(r) != -1) {
            cmd.stdin.write( responses[r]);
        }
    }
}

(function() {



    var testDir = 'testApplicationCAS';

    describe('authCAS: test appdev install :applicationName',function(){


        before(function(done){

            //Set timeout to 41 secs 'cause this process takes longer than normal
            this.timeout(41000);

            //Change directory to tmp to create application
            process.chdir('/tmp');

            var responses = {
                    "db adaptor":'\n',
                    "connect by socket":'\n',
                    "localhost":'\n',
                    "port:":'3306\n',
                    "user:":'\n',
                    "password:":'\n',
                    "database:":'test_site\n',
                    "authentication":'CAS\n'
            };

            Util.spawn({
                command:'appdev',
                options:['install', testDir],
                responses:responses,
                exitTrigger:'> sails lift',
                shouldEcho:false
            })
            .then(function(){
                done();
            })
            .fail(function(err){
                done(err);
            });

        });


        after(function(done){

            //Change directory to tmp to delete the application
            process.chdir('/tmp');

            //After the test is run, remove the directory for the application
            exec('rm -rf '+testDir,function(err,stdout,stderr){
                if (err){
                    console.log("err = "+err);
                    console.log("stderr = "+stderr);
                }
                done();
            });

        });


        it('make sure config/appdev.js  initialized properly',function(){
            var config = require("/tmp/"+testDir+"/config/appdev.js").appdev;

            chai.assert.property(config, 'authType', ' => there is an authType configuration present');
            chai.assert.equal(config.authType, 'CAS', ' => authType == CAS');

        });


        it('make sure config/cas.js  initialized properly',function(){

            var configExists = fs.existsSync("/tmp/"+testDir+"/config/cas.js");
            chai.assert.ok(configExists, ' => config/cas.js file exists.');

            var config = require("/tmp/"+testDir+"/config/cas.js").cas;

            chai.assert.property(config, 'authType', ' => there is an authType configuration present');
            chai.assert.equal(config.authType, 'CAS', ' => authType == CAS');

        });
    });


})();