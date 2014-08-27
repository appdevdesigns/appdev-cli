var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var Util = require(path.join(__dirname, 'helpers', 'util_helper.js'));
var AD = require('ad-utils');

function consoleResponse (cmd, data, responses) {

    var dataString = data.toString();

    for (var r in responses) {
        if (dataString.indexOf(r) != -1) {
            cmd.stdin.write( responses[r]);
        }
    }
}
(function() {


    var scratchDir = path.join(__dirname, 'scratchArea');
    var testDir = 'testApplication';
    var pathTestDir = path.join(scratchDir, testDir);

    var fileSetup = path.join(pathTestDir, 'assets', testDir, 'setup.js');

    describe('authLocal: test appdev install :applicationName',function(){


        before(function(done){

            //Set timeout to 84 secs 'cause this process takes longer than normal
            this.timeout(84000);

            //Change directory to tmp to create application
            process.chdir(scratchDir);

            var responses = {
                    "db adaptor":'memory\n',
/*                    "connect by socket":'\n',
                    "localhost":'\n',
                    "port:":'3306\n',
                    "user:":'\n',
                    "password:":'\n',
                    "database:":'test_site\n',
*/
                    "type of authentication":'local\n'
            };

            AD.spawn.command({
                command:'appdev',
                options:['install', testDir],
                responses:responses,
                exitTrigger:'> sails lift',
                shouldEcho:false
            })
            .fail(function(err){
                done(err);
            })
            .then(function(){
                done();
            });


        });


        after(function(done){

            //Change directory to tmp to delete the application
            process.chdir(scratchDir);

            //After the test is run, remove the directory for the application
            exec('rm -rf '+testDir,function(err,stdout,stderr){
                if (err){
                    console.log("err = "+err);
                    console.log("stderr = "+stderr);
                }
                done();
            });

        });



        it('check for setup.js file',function(done){

            fs.exists(fileSetup, function(exists){
                chai.assert.deepEqual(exists,true);
                done();
            });
        });

        it('check contents of setup.js file',function(done){
            fs.readFile(fileSetup, function(err,data){
                if (err){
                    console.log("err = "+err);
                    done(err);
                } else {
                    chai.assert.include(data.toString(), "'/site/labels/"+testDir+"'");
                    done();
                }
            });
        });



        it('check for ADCore files',function(){

            var controllerExists = fs.existsSync(path.join(pathTestDir, "api", "controllers", "appdev-core", "ADCoreController.js"));
            var viewExists = fs.existsSync(path.join(pathTestDir, "views", "appdev-core", "adcore", "configdata.ejs"));
            var configExists = fs.existsSync(path.join(pathTestDir, "config","appdev.js"));

            chai.assert.ok(controllerExists, ' => ADCoreController.js file exists');
            chai.assert.ok(viewExists, ' => views/appdev-core/adcore/configData.ejs file exists');
            chai.assert.ok(configExists, ' => config/appdev.js file exists');
        });



        it('check for ADCore routes',function(){
            var routes = require(path.join(pathTestDir, "config", "routes.js"));

            chai.assert.property(routes.routes, 'get /site/config/data.js', ' => /site/config/data route set');
            chai.assert.property(routes.routes, 'get /site/labels/:context', ' => /site/labels/:context route set');
            chai.assert.property(routes.routes, 'get /site/labels/:context/*', ' => /site/labels/:context/* route set');
            chai.assert.property(routes.routes, 'get /node_modules/**', ' => /node_modules/** route set');
        });



        it('check for ADCore policies',function(){
            var policies = require(path.join(pathTestDir, "config", "policies.js")).policies;

            chai.assert.property(policies, 'appdev-core/ADCoreController', ' => there is a policy for ADCoreController');
            chai.assert.isDefined(policies['appdev-core/ADCoreController'].configData, ' => configData() has policies set');
            chai.assert.isDefined(policies['appdev-core/ADCoreController'].labelConfigFile,' => labelConfigFile() has policies set');

            chai.assert.includeMembers(policies['appdev-core/ADCoreController'].configData, ['sessionAuth'], ' => configData() sessionAuth');
            chai.assert.includeMembers(policies['appdev-core/ADCoreController'].labelConfigFile, ['sessionAuth'], ' => labelConfigFile() sessionAuth');
        });



        it('check contents of config/routes.js file',function(done){
            fs.readFile(path.join(pathTestDir, "config", "routes.js"),function(err,data){
                if (err){
                    console.log("err = "+err);
                    done(err);
                } else {

                    chai.assert.include(data.toString(),"var routes = module.exports.routes", ' plugin patch properly applied.');
                    done();
                }
            });
        });



        it('check contents of config/policies.js file',function(done){
            fs.readFile(path.join(pathTestDir, "config", "policies.js"), function(err,data){
                if (err){
                    console.log("err = "+err);
                    done(err);
                } else {

                    chai.assert.include(data.toString(),"var policies = module.exports.policies", ' plugin patch properly applied.');
                    done();
                }
            });
        });



        it('check contents of config/connections.js file',function(done){
            fs.readFile(path.join(pathTestDir, "config", "connections.js"), function(err,data){
                if (err){
                    console.log("err = "+err);
                    done(err);
                } else {

                    chai.assert.include(data.toString(),"var connections = module.exports.connections", ' plugin patch properly applied.');
                    done();
                }
            });
        });



        it('make sure config/appdev.js  initialized properly',function(){
            var config = require(path.join(pathTestDir, "config", "appdev.js")).appdev;

            chai.assert.property(config, 'authType', ' => there is an authType configuration present');
            chai.assert.equal(config.authType, 'local', ' => authType == local');
        });


        it('check grunt hook disabled',function( done){
            fs.readFile(path.join(pathTestDir, ".sailsrc"), 'utf8', function(err, data){

                if (err) {
                    done(err);
                } else {

                    var sailsRC = JSON.parse(data);

                    chai.assert.property(sailsRC, 'hooks', ' => .sailsrc .hooks  set');
                    chai.assert.property(sailsRC.hooks, 'grunt', ' => .sailsrc .hooks.grunt  set');
                    chai.assert.isFalse(sailsRC.hooks.grunt, ' => .sailsrc.hooks.grunt = false');

                    done();

                }

            });
        });
    });


})();