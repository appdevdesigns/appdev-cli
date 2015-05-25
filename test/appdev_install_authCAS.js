var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var $ = require('jquery');
var Util = require(path.join(__dirname, 'helpers', 'util_helper.js'));
var AD = require('ad-utils');

(function() {


    var scratchPath = path.join(__dirname, 'scratchArea');
    var testDir = 'testApplicationCAS';

    describe('authCAS: test appdev install :applicationName',function(){


        before(function(done){

            //Set timeout to 82 secs 'cause this process takes longer than normal
            this.timeout(120000);

            // run this command from the test/scratchArea/ directory
            process.chdir(scratchPath);

            var responses = {
                    "db adaptor":'memory\n',
                    "connect by socket":'\n',
                    "localhost":'\n',
                    "port:":'3306\n',
                    "user:":'\n',
                    "password:":'\n',
                    "database:":'test_site\n',
                    "type of authentication":'CAS\n',
                    "cas server:":'testServerURL\n',
                    "pgt server:":'testProxyURL\n',
                    "SSL":'\n',
                    'guid':'\n'
            };

            AD.spawn.command({
                command:'appdev',
                options:['--noDependencies', 'install', testDir],
                responses:responses,
                exitTrigger:'> sails lift',
                shouldEcho:false
// shouldEcho:true
            })
            .fail(function(err){
                done(err);
            })
            .then(function(){
                done();
            });

        });


        after(function(done){

            this.timeout(40000);

            //Change directory to tmp to delete the application
            process.chdir(scratchPath);

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
            var config = require(path.join(__dirname, 'scratchArea', testDir, "config", "appdev.js")).appdev;

            chai.assert.property(config, 'authType', ' => there is an authType configuration present');
            chai.assert.equal(config.authType, 'CAS', ' => authType == CAS');

        });


        it('make sure config/cas.js  initialized properly',function(){

            var configPath = path.join(__dirname, 'scratchArea', testDir, "config", "cas.js");
            var configExists = fs.existsSync(configPath);
            chai.assert.ok(configExists, ' => config/cas.js file exists.');

            var config = require(configPath).cas;

            chai.assert.property(config, 'baseURL', ' => there is an baseURL configuration present');
            chai.assert.equal(config.baseURL, 'https://signin.example.com:443/cas', ' => baseURL set properly');

            chai.assert.notProperty(config, 'pgtURL', ' => there is no proxyURL configuration present');
            // chai.assert.equal(config.proxyURL, 'testProxyURL', ' => proxyURL set properly');

        });


        it('make sure config/local.js  initialized properly with cas settings',function(){

            var config = require(path.join(__dirname, 'scratchArea', testDir, "config", "local.js")).cas;

            chai.assert.property(config, 'baseURL', ' => there is an baseURL local config present');
            chai.assert.equal(config.baseURL, 'testServerURL', ' => url == testServerURL');

            chai.assert.property(config, 'pgtURL', ' => there is an pgtURL configuration present');
            chai.assert.equal(config.pgtURL, 'testProxyURL', ' => pgtURL set properly');

        });
    });


})();