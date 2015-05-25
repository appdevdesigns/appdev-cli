
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var $ = require('jquery');

var Util = require('./helpers/util_helper.js');
var AD = require('ad-utils');


var assert = require('chai').assert;
describe('test appdev fixture :applicationName :resource :fieldList ',function(){

	var tmpAppDir = 'testFixtures';

	//Before the unit tests are executed, create the testing directory structure
	before(function(done){
	    this.timeout(40000);

	    // run this command from the test/scratchArea/ directory
	    process.chdir(path.join(__dirname, 'scratchArea'));



        var responsesInstall = {
                "db adaptor":'memory\n',
                "type of authentication":'\n',
                "SSL":'\n'
        };

	    var responses = {
	    	"default connection" : "\n"
	    }

	    // First create a new test sails app: tmpApp
	    AD.spawn.command({
	        command:'appdev',
	        options:['--noDependencies', 'install', tmpAppDir],
	        responses:responsesInstall,
	        shouldEcho:false
// shouldEcho:true
	    })
	    .fail(function(err){
	        done(err);
	    })
	    .then(function(data) {

	    	// run this command from the test/scratchArea/tmpApp directory
	    	process.chdir(path.join(__dirname, 'scratchArea', tmpAppDir));

	       	// now run the command to create a fixture
		    AD.spawn.command({
		        command:'appdev',
		        options:['fixture', 'testApplication', 'TestModel', 'model_field:string', 'model_field2:string', 'model_field3:integer'],
		        responses:responses,
		        exitTrigger:'> You',
	        	shouldEcho:false
// shouldEcho:true
		    })
		    .fail(function(err){
		        done(err);
		    })
		    .then(function(data) {
		        done();
		    });
	    });




	});

	//After the tests are run, delete our fixture directories
	after(function(done){

	    // return to our top level directory
	    process.chdir(path.join(__dirname, '..'));

	    // remove /api & /assets directories
	    Util.removeDir(path.join(__dirname, 'scratchArea', tmpAppDir))
	    .fail(function(err){

	        // dang!
	        done(err);
	    })
	    .then(function() {

	        // all good, continue
	        done();
	    });

	});



	// fixtures reuse the appdev resource command to produce the base files
	// we won't re-test the basic functionality of appdev resource

	// the additional steps for fixtures is to make the controller have
	// default data being returned for the basic RESTful routes.


	describe('check the TestModelController.js file has the proper data ', function(){

	    var controllerPath = path.join(__dirname,'scratchArea', tmpAppDir, 'api', 'controllers', 'TestModelController.js');
	    var controllerFile = '';

	    before(function(){
	        controllerFile = fs.readFileSync(controllerPath, 'utf8');
	    });



	    it(' -> the controller exists ',function(){
	        var found = fs.existsSync(controllerPath);
	        assert.isTrue(found,' => yup, our controller exists.');
	    });



	    it(' -> the controller has method find ',function(){
            assert.isTrue((controllerFile.indexOf('find:function') != -1),' => find() method defined');
        });



	    it(' -> the controller has method create ',function(){
            assert.isTrue((controllerFile.indexOf('create:function') != -1),' => create() method defined');
        });



	    it(' -> the controller has method update ',function(){
            assert.isTrue((controllerFile.indexOf('update:function') != -1),' => update() method defined');
        });



	    it(' -> the controller has method destroy ',function(){
            assert.isTrue((controllerFile.indexOf('destroy:function') != -1),' => destroy() method defined');
        });
	});


});