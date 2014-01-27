var chai = require('chai');
var mysql = require('mysql');
var spawn = require('child_process').spawn;
var path = require('path');
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

    var testPath;

	//create the labels in the database before anything else happens.
	before(function(done){
		this.timeout(10000);

		testPath = path.sep+path.join('tmp','testApplicationLabels');

		// run this command from the tmp/testApplication directory
	    Util.adnDir({ path:testPath })
        .then(function(data){

            dbInfo = Util.dbInfo();


            // execute these commands in sequence:
            var seq = [
                {
                    command:'appdev',
                    options:['default', 'label-db', dbInfo.database ],
                    shouldEcho:false
                },
                {
                    command:'appdev',
                    options:['default', 'label-host', dbInfo.host ],
                    shouldEcho:false
                },
                {
                    command:'appdev',
                    options:['default', 'label-user', dbInfo.user ],
                    shouldEcho:false
                },
                {
                    command:'appdev',
                    options:['default', 'label-pass', dbInfo.password ],
                    shouldEcho:false
                },
                {
                    command:'appdev',
                    options:['default', 'label-port', dbInfo.port ],
                    shouldEcho:false
                }
            ];

            Util.spawnSeq(seq)
            .then(function(data) {

        	    // now run the command to create labels
        	    Util.spawn({
        	        command:'appdev',
        	        options:['labels', 'testApplication', 'testApplication.site.login', 'en', 'Login:'],
        	        shouldEcho:false
        	    })
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
        					});
        				}
        			});
        	    })
        	    .fail(function(err){
        	        done(err);
        	    });


            })
            .fail(function(err){
                done(err);
            });

        })
        .fail(function(err){
            done(err);
        });
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
			} else {

    			//Submit the command to select the labels for a certain application.
    			Util.spawn({
    			    command:'appdev',
    			    options:['labels','testApplication'],
    			    onData:function (data) {
    			        var lineSplit;
    			        var line;

    	                //split the stdout data by new line and carriage return
    	                lineSplit = data.toString().split("\r\n");

    	                //Go through each of the lines looking for the label text (Login:)
    	                for(line in lineSplit){
    	                    if (lineSplit[line].indexOf("Login:") != -1) {
    	                        count++;
    	                    }
    	                }
    	            },
    	            shouldEcho:false
    			})
    			.then(function(data){

    			    //compare the count of the number of label texts in stdout data
                    //to the number of labels in the database for the application.
                    chai.assert.deepEqual(count,rows.length);
                    done();
    			})
    			.fail(function(err){
    			    done(err);
    			});

			}

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
			} else {

			    //Submit the command to select the labels for the application and the label_key
                Util.spawn({
                    command:'appdev',
                    options:['labels', 'testApplication', 'testApplication.site.login'],
                    onData:function (data) {
                        var lineSplit;
                        var line;

                        //split the stdout data by new line and carriage return
                        lineSplit = data.toString().split("\r\n");

                        //Go through each of the lines looking for the label text (Login:)
                        for(line in lineSplit){
                            if (lineSplit[line].indexOf("Login:") != -1) {
                                count++;
                            }
                        }
                    },
                    shouldEcho:false
                })
                .then(function(data){

                    //compare the count of the number of label texts in stdout data
                    //to the number of labels in the database for the application.
                    chai.assert.deepEqual(count,rows.length);
                    done();
                })
                .fail(function(err){
                    done(err);
                });

			}

		});
	});



	after(function(done){
	    //delete the labels from the database after all else has happened.
		var count = 0;

		this.timeout(5000);

		// remove our labels
        Util.spawn({
            command:'appdev',
            options:['labels', '-r', 'testApplication', 'testApplication.site.login'],
            shouldEcho:false
        })
        .then(function(data) {

            // remove our testing directory
            Util.spawn({
                command:'rm',
                options:['-R', testPath],
                shouldEcho:false
            })
            .then(function(data) {

                // verity labels were removed from the system.
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

            })
            .fail(function(err){
                done(err);
            });

        })
        .fail(function(err){
            done(err);
        });

	});
});