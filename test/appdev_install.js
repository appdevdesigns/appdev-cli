var chai = require('chai');
var fs = require('fs');


describe('test appdev install :applicationName',function(){
	
	it('check for setup.js file',function(done){
		fs.exists("/tmp/testApplication/assets/testApplication/setup.js",function(exists){
			chai.assert.deepEqual(exists,true);
			done();
		});
	});
	
	it('check contents of setup.js file',function(done){
		fs.readFile("/tmp/testApplication/assets/testApplication/setup.js",function(err,data){
			if (err){
				console.log("err = "+err);
			}
			chai.assert.deepEqual(data.toString().indexOf("/site/labels/testApplication"),63);
			done();
		});
	});
});