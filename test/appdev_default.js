var chai = require('chai');
var fs = require('fs');
var path = require('path');
var $ = require('jquery');

var Util = require(path.join(__dirname, 'helpers', 'util_helper.js'));
var AD = require('ad-utils');


describe('test appdev default [key] [value]',function(){

    var testPath = '';

	before(function(done){

	    testPath = path.sep+path.join('tmp','testApplicationDefault');

	    // create a testSetup at testPath
	    // includes a .adn  file.
	    Util.adnDir({ path:testPath })
	    .then(function(data){


    	    // re-use Johnny's code to run appdev default command
    	    AD.spawn.command({
    	        command:'appdev',
    	        options:['default', 'labels-db', 'test_site'],
    	        shouldEcho:false
    	    })
    	    .then(function(data) {
    	        done();
    	    })
    	    .fail(function(err){
    	        done(err);
    	    });

	    })
        .fail(function(err){
            done(err);
        });

	});

	after(function(done){
	    AD.spawn.command({
            command:'rm',
            options:['-Rf', testPath],
            shouldEcho:false
        })
        .then(function(data) {
            done();
        })
        .fail(function(err){
            done(err);
        });
	})

	it('check for .adn file',function(done){
		fs.exists(path.join(testPath, ".adn"),function(exists){
			chai.assert.deepEqual(exists,true);
			done();
		});
	});

	it('check contents of .adn file',function(done){
		fs.readFile(path.join(testPath, ".adn"),function(err,data){
			if (err){
				console.log("err = "+err);
			}
			chai.assert.isTrue((data.toString().indexOf("labels-db") != -1),'labels-db key is set');
			done();
		});
	});
});