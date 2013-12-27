var chai = require('chai');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');


describe('test run before all tests',function(){
	
	//Before the unit tests are executed, create the appdev framework structure
	it('running appdev install command',function(done){
		
		//Set timeout to 11 secs 'cause this process takes longer than normal
		this.timeout(17000);
		
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
			   || data.toString().indexOf("user:") != -1
			   || data.toString().indexOf("password:") != -1){
					cmd.stdin.write('\n');
			}
			
			if (data.toString().indexOf("database:") != -1) {
				cmd.stdin.write("test_site\n");
			}
			
			if (data.toString().indexOf("port:") != -1) {
				cmd.stdin.write("3306\n");
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
		},16000);
	});
});