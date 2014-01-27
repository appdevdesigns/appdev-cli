var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
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



    var testDir = 'testApplication';

    describe('authLocal: test appdev install :applicationName',function(){


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
                    "authentication":'local\n'
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





    	it('check for setup.js file',function(done){
    		fs.exists("/tmp/"+testDir+"/assets/"+testDir+"/setup.js",function(exists){
    			chai.assert.deepEqual(exists,true);
    			done();
    		});
    	});

    	it('check contents of setup.js file',function(done){
    		fs.readFile("/tmp/"+testDir+"/assets/"+testDir+"/setup.js",function(err,data){
    			if (err){
    				console.log("err = "+err);
    				done(err);
    			} else {
    			chai.assert.deepEqual(data.toString().indexOf("/site/labels/"+testDir+""),63);
    			done();
    			}
    		});
    	});


        it('check for ADCore files',function(){
            var controllerExists = fs.existsSync("/tmp/"+testDir+"/api/controllers/ADCoreController.js");
            var viewExists = fs.existsSync("/tmp/"+testDir+"/views/adcore/configData.ejs");
            var configExists = fs.existsSync("/tmp/"+testDir+"/config/appdev.js");
            chai.assert.ok(controllerExists, ' => ADCoreController.js file exists');
            chai.assert.ok(viewExists, ' => views/adcore/configData.ejs file exists');
            chai.assert.ok(configExists, ' => views/adcore/configData.ejs file exists');
        });


        it('check for ADCore routes',function(){
            var routes = require("/tmp/"+testDir+"/config/routes.js");

            chai.assert.property(routes.routes, 'get /site/config/data.js', ' => /site/config/data route set');
            chai.assert.property(routes.routes, 'get /site/labels/:context', ' => /site/labels/:context route set');
            chai.assert.property(routes.routes, 'get /site/labels/:context/*', ' => /site/labels/:context/* route set');
            chai.assert.property(routes.routes, 'get /node_modules/**', ' => /node_modules/** route set');
        });


        it('check for ADCore policies',function(){
            var policies = require("/tmp/"+testDir+"/config/policies.js").policies;

            chai.assert.property(policies, 'ADCoreController', ' => there is a policy for ADCoreController');
            chai.assert.isDefined(policies.ADCoreController.configData, ' => configData() has policies set');
            chai.assert.isDefined(policies.ADCoreController.labelConfigFile,' => labelConfigFile() has policies set');

            chai.assert.includeMembers(policies.ADCoreController.configData, ['isAuthenticated'], ' => configData() isAuthenticated');
            chai.assert.includeMembers(policies.ADCoreController.labelConfigFile, ['isAuthenticated'], ' => labelConfigFile() isAuthenticated');
        });


        it('make sure config/appdev.js  initialized properly',function(){
            var config = require("/tmp/"+testDir+"/config/appdev.js").appdev;

            chai.assert.property(config, 'authType', ' => there is an authType configuration present');
            chai.assert.equal(config.authType, 'local', ' => authType == local');


        });
    });


})();