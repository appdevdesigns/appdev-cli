
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var $ = require('jquery');

var Util = require('./helpers/util_helper.js');

var assert = require('chai').assert;
describe('test appdev fixture :applicationName :resource :fieldList ',function(){

	//Before the unit tests are executed, create the testing directory structure
	before(function(done){

		//Set timeout to 11 secs 'cause this process takes longer than normal
		this.timeout(41000);

		var setup = Util.testingEnvSetup();
		$.when(setup)
		.then(function(data){

		    process.chdir('testApplication');

		    // now run the command to create a fixture
		    var finished = Util.spawn('appdev', ['fixture', 'testApplication', 'TestModel', 'model_field:string', 'model_field2:string', 'model_field3:integer'])
		    $.when(finished)
		    .then(function(data) {
		        done();
		    })
		    .fail(function(err){
		        done(err);
		    })

		})
		.fail(function(err){
		    done(err);
		})
	});

	//After the tests are run, delete the testApplication directory
	after(function(done){
	    done();
/*
	    process.cwd('..');
	    var removed = Util.testingEnvRemove();
	    $.when(removed)
	    .then(function(data){
	        done();
	    })
	    .fail(function(err){
	        done(err);
	    })

*/
	});



	// fixtures reuse the appdev resource command to produce the base files
	// we won't re-test the basic functionality of appdev resource

	// the additional steps for fixtures is to make the controller have
	// default data being returned for the basic RESTful routes.


	describe('check the TestModelController.js file has the proper data ', function(){

	    it('the controller exists ',function(){
	        var found = fs.existsSync("/tmp/testApplication/api/controllers/TestModelController.js");
	        assert.isTrue(found,' yup, our controller exists.');
	    });
	});


});