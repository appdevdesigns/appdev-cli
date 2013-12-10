var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');


describe('test run after all tests',function(){
	
	//After the tests are run, delete the testApplication directory
	it('removing of testApplication framework',function(done){
		
		//Change directory to tmp to delete the application
		process.chdir('/tmp');
		
		//After the test is run, remove the directory for the application 
		exec('rm -rf testApplication',function(err,stdout,stderr){
			if (err){
				console.log("err = "+err);
				console.log("stderr = "+stderr);
			}
			done();
		});
	});
});