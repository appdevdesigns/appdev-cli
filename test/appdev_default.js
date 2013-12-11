var chai = require('chai');
var fs = require('fs');
var $ = require('jquery');

var Util = require('./helpers/util_helper.js');


describe('test appdev default [key] [value]',function(){
	
	before(function(done){
		
		process.chdir("/tmp/testApplication");
		
	    // re-use Johnny's code to run appdev default command
	    var finished = Util.spawn('appdev', ['default', 'labels-db', 'test_site'])
	    $.when(finished)
	    .then(function(data) {
	        done();
	    })
	    .fail(function(err){
	        done(err);
	    })
	});
	
	it('check for .adn file',function(done){
		fs.exists("/tmp/testApplication/.adn",function(exists){
			chai.assert.deepEqual(exists,true);
			done();
		});
	});
	
	it('check contents of .adn file',function(done){
		fs.readFile("/tmp/testApplication/.adn",function(err,data){
			if (err){
				console.log("err = "+err);
			}
			chai.assert.isTrue((data.toString().indexOf("labels-db") != -1),'labels-db key is set');
			done();
		});
	});
});