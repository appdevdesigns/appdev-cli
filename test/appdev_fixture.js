
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var $ = require('jquery');

var Util = require('./helpers/util_helper.js');

var assert = require('chai').assert;
describe('test appdev fixture :applicationName :resource :fieldList ',function(){

	//Before the unit tests are executed, create the testing directory structure
	before(function(done){
	    this.timeout(10000);

	    // run this command from the test/scratchArea/ directory
	    process.chdir(path.join(__dirname, 'scratchArea'));

	    // now run the command to create a fixture
	    var finished = Util.spawn('appdev', ['fixture', 'testApplication', 'TestModel', 'model_field:string', 'model_field2:string', 'model_field3:integer'])
	    $.when(finished)
	    .then(function(data) {
	        done();
	    })
	    .fail(function(err){
	        done(err);
	    })

	});

	//After the tests are run, delete our fixture directories
	after(function(done){

	    // return to our top level directory
	    process.chdir(path.join(__dirname, '..'));

	    // remove /api & /assets directory
	    var apiGone = Util.removeDir(path.join(__dirname, 'scratchArea', 'api'));
	    var assetsGone = Util.removeDir(path.join(__dirname, 'scratchArea', 'assets'));
	    $.when(apiGone, assetsGone).then(function() {

	        // all good, continue
	        done();
	    })
	    .fail(function(err){

	        // dang!
	        done(err);
	    });

	});



	// fixtures reuse the appdev resource command to produce the base files
	// we won't re-test the basic functionality of appdev resource

	// the additional steps for fixtures is to make the controller have
	// default data being returned for the basic RESTful routes.


	describe('check the TestModelController.js file has the proper data ', function(){

	    var controllerPath = path.join(__dirname,'scratchArea', 'api', 'controllers', 'TestModelController.js');
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