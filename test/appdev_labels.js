var chai = require('chai');
var mysql = require('mysql');
var spawn = require('child_process').spawn;
var $ = require('jquery');

var Util = require('./helpers/util_helper.js');

//the database information to connect to mysql
var dbInfo = {
		host: 'localhost',
		user: 'root',
		password: 'root',
		database: 'test_site',
		port: '3306'
	}


describe('test appdev labels :applicationName',function(){
	
	//create the labels in the database before anything else happens.
	before(function(done){
		this.timeout(10000);

	    // run this command from the tmp/testApplication directory
	    process.chdir('/tmp/testApplication');

	    // now run the command to create labels
	    var finished = Util.spawn('appdev', ['labels', 'testApplication', 'testApplication.site.login', 'en', 'Login:'])
	    $.when(finished)
	    .then(function(data) {
			
			var db = mysql.createConnection(dbInfo);
			
			db.connect();
			
			sql = "select * from sites_multilingual_labels "
				+ "where label_key = 'testApplication.site.login' "
				+ "and label_application = 'testApplication'";
				
			db.query(sql, function(err,rows){
				if (err){
					done(err);
				} else {
					langSql = "select * from sites_multilingual_languages";
					
					db.query(langSql,function(err,langRows){
						if (err){
							done(err);
						} else {
							//compared the counts of sites_multilingual_labels to 
							//sites_multilingual_languages to verify that they match 
							//and all the labels were entered into the database.
							chai.assert.deepEqual(rows.length,langRows.length);
							done();	
						}
					})
				}
			});
	    })
	    .fail(function(err){
	        done(err);
	    })
	});
	
	it('check to see appdev labels [applicationName] displays labels',function(done){
		
		var count = 0;
		
		this.timeout(5000);
		
		var db = mysql.createConnection(dbInfo);
		
		db.connect();
		
		sql = "select * from sites_multilingual_labels "
			+ "where label_application = 'testApplication' ";
		
		db.query(sql,function(err,rows){
			if (err){
				done(err);
			}
			
			//Submit the command to select the labels for a certain application.
			cmd = spawn('appdev',['labels','testApplication']);
		
			//Listen for stdout messages
			cmd.stdout.on('data', function (data) {
  				console.log('%' + data);
				
				//split the stdout data by new line and carriage return
				lineSplit = data.toString().split("\r\n");
				
				//Go through each of the lines looking for the label text (Login:)
				for(line in lineSplit){
					if (lineSplit[line].indexOf("Login:") != -1) {
						count++;
					} 
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
		
			//Wait to allow the program time to finish
			setTimeout(function(){
				//compare the count of the number of label texts in stdout data
				//to the number of labels in the database for the application.
				chai.assert.deepEqual(count,rows.length);
				done();
			},4000);
		});
	});
	
	it('check to see appdev labels [applicationName] [keyName] displays labels',function(done){
		var count = 0;
		
		this.timeout(5000);
		
		var db = mysql.createConnection(dbInfo);
		
		db.connect();
		
		sql = "select * from sites_multilingual_labels "
			+ "where label_application = 'testApplication' "
			+ "and label_key = 'testApplication.site.login'";
		
		db.query(sql,function(err,rows){
			if (err){
				done(err);
			}
			
			//Submit the command to select the labels for the application and the label_key
			cmd = spawn('appdev',['labels','testApplication', 'testApplication.site.login']);
		
			//Listen for stdout messages
			cmd.stdout.on('data', function (data) {
  				console.log('%' + data);
				
				//split the stdout data by new line and carriage return
				lineSplit = data.toString().split("\r\n");
				
				//Go through each of the lines looking for the label text (Login:)
				for(line in lineSplit){
					if (lineSplit[line].indexOf("Login:") != -1) {
						count++;
					} 
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

			//Wait to allow the program time to finish
			setTimeout(function(){
				//compare the count of the number of label texts in stdout data
				//to the number of labels in the database for the application and key.
				chai.assert.deepEqual(count,rows.length);
				done();
			},4000);
		});
	});
	
	//delete the labels from the database after all else has happened.
	after(function(done){
		var count = 0;
		
		this.timeout(5000);
					
		//Submit the command to delete the label for an application and key.
		cmd = spawn('appdev',['labels','-r','testApplication', 'testApplication.site.login']);
		
		//Listen for stdout messages
		cmd.stdout.on('data', function (data) {
  			console.log('' + data);		
		});
		
		//Listen for stderr messages
		cmd.stderr.on('data', function (data) {
  			console.log('stderr: ' + data);
		});
		
		//Listen for error messages
		cmd.on('error', function (err) {
			console.log('err: '+err);
		});
		
		//Wait to allow the program time to finish
		setTimeout(function(){
			var db = mysql.createConnection(dbInfo);
		
			db.connect();
		
			sql = "select * from sites_multilingual_labels "
				+ "where label_application = 'testApplication' "
				+ "and label_key = 'testApplication.site.login' ";
		
			db.query(sql,function(err,rows){
				if (err){
					done(err);
				}
				//Verify that the database does not have any labels
				//for the application and key specified
				chai.assert.deepEqual(count,rows.length);
				done();
			});
		},4000);
	});
});