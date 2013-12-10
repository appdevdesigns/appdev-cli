var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');


describe('test appdev install :applicationName',function(){
	
	//Before the unit tests are executed, create the appdev framework structure
	before(function(done){
		
		//Set timeout to 11 secs 'cause this process takes longer than normal
		this.timeout(11000);
		
		//Change directory to tmp to create application
		process.chdir('/tmp');
		
		//Issue "appdev install testApplication" command
    	cmd = spawn('appdev',['install','testApplication']);
		
		//Listen for stdout messages
		cmd.stdout.on('data', function (data) {
  			console.log('' + data);
			
			//Catch the prompting for input, then issue an return character in response
			if (data.toString().indexOf("db adaptor") != -1 
			   || data.toString().indexOf("connect by socket") != -1
			   || data.toString().indexOf("localhost") != -1
			   || data.toString().indexOf("port:") != -1
			   || data.toString().indexOf("user:") != -1
			   || data.toString().indexOf("password:") != -1
			   || data.toString().indexOf("database:") != -1){
				cmd.stdin.write('\n');
			}
		});
		
		//Listen for stderr messages
		cmd.stderr.on('data', function (data) {
  			console.log('stderr: ' + data);
		});
		
		//Listen for error messages
		cmd.on('error', function (err) {
			console.log('err: '+err);
		});
		
		//Listen for closing
		cmd.on('close', function (code) {
  			console.log('child process exited with code ' + code);
		});
		
		//Wait to allow the program time to finish
		setTimeout(function(){
			done();
		},10000);
	});
	
	//After the tests are run, delete the testApplication directory
	after(function(done){
		
		//After the test is run, remove the directory for the application 
		exec('rm -rf testApplication',function(err,stdout,stderr){
			if (err){
				console.log("err = "+err);
				console.log("stderr = "+stderr);
			}
			done();
		});
	});
	
	it('check for setup.js file',function(done){
		fs.exists("/tmp/testApplication/assets/testApplication/setup.js",function(exists){
			chai.assert.deepEqual(exists,true);
			done();
		});
	});
	
	it('check contents of setup.js file',function(done){
		fs.readFile("/tmp/testApplication/assets/testApplication/setup.js",function(err,data){
			chai.assert.deepEqual(data.toString().indexOf("/site/labels/testApplication"),63);
			done();
		});
	});
});