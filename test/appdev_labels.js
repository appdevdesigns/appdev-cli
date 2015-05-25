var chai = require('chai');
var mysql = require('mysql');
var spawn = require('child_process').spawn;
var path = require('path');
var $ = require('jquery');

var Util = require('./helpers/util_helper.js');
var AD = require('ad-utils');


//the database information to connect to mysql
var dbInfo;

var DB_TABLE_LABEL = 'site_multilingual_label';
var DB_TABLE_LANGUAGE = 'sites_multilingual_languages';

var scratchDir = path.join(__dirname, 'scratchArea');
var testDir = 'testLabels';
var testPath = path.join(scratchDir, testDir);


describe('test appdev labels :applicationName',function(){


	//create the labels in the database before anything else happens.
	before(function(done){
		this.timeout(10000);

		// run this command on the /testApplication directory
        // NOTE: this leaves us in the directory
	    Util.adnDir({ path:testPath })
        .fail(function(err){
            done(err);
        })
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

            AD.spawn.series(seq)
            .fail(function(err){
                AD.log.error('failed to install appdev defaults for label information.',err);
                done(err);
            })
            .then(function(data) {

        	    // now run the command to create labels
        	    AD.spawn.command({
        	        command:'appdev',
        	        options:['labels', 'testApplication', 'testApplication.site.login', 'en', 'Login:'],
        	        shouldEcho:false
        	    })
                .fail(function(err){
                    done(err);
                })
        	    .then(function(data) {


        			var db = mysql.createConnection(dbInfo);

        			db.connect();

        			sql = "select * from "+DB_TABLE_LABEL+" "
        				+ "where label_key = 'testApplication.site.login' "
        				+ "and label_context = 'testApplication'";

        			db.query(sql, function(err,rows){
        				if (err){
        					done(err);
        				} else {
        					langSql = "select * from "+DB_TABLE_LANGUAGE;

        					db.query(langSql,function(err,langRows){
        						if (err){
        							done(err);
        						} else {
        							//compared the counts of sites_multilingual_labels to
        							//sites_multilingual_languages to verify that they match
        							//and all the labels were entered into the database.
        							chai.assert.deepEqual(rows.length,langRows.length, ' initial setup worked! ');
        							done();
        						}
        					});
        				}
        			});
        	    });


            });

        });
	});



	it('check to see appdev labels [applicationName] displays labels',function(done){

		var count = 0;

		this.timeout(5000);

		var db = mysql.createConnection(dbInfo);

		db.connect();

		sql = "select * from "+DB_TABLE_LABEL+" "
			+ "where label_context = 'testApplication' ";

		db.query(sql,function(err,rows){

		    if (err){
				done(err);
			} else {

    			//Submit the command to select the labels for a certain application.
    			AD.spawn.command({
    			    command:'appdev',
    			    options:['labels','testApplication'],
    			    onData:function (data) {
    			        var lineSplit;
    			        var line;

    	                //split the stdout data by new line and carriage return
    	                lineSplit = data.toString().split("Login:");

                        count += lineSplit.length -1;

    	            },
    	            shouldEcho:false
    			})
                .fail(function(err){
                    done(err);
                })
    			.then(function(data){

    			    //compare the count of the number of label texts in stdout data
                    //to the number of labels in the database for the application.
                    chai.assert.deepEqual(count,rows.length);
                    done();
    			});

			}

		});
	});



	it('check to see appdev labels [applicationName] [keyName] displays labels',function(done){
		var count = 0;

		this.timeout(5000);

		var db = mysql.createConnection(dbInfo);

		db.connect();

		sql = "select * from "+DB_TABLE_LABEL+" "
			+ "where label_context = 'testApplication' "
			+ "and label_key = 'testApplication.site.login'";

		db.query(sql,function(err,rows){

			if (err){
				done(err);
			} else {

			    //Submit the command to select the labels for the application and the label_key
                AD.spawn.command({
                    command:'appdev',
                    options:['labels', 'testApplication', 'testApplication.site.login'],
                    onData:function (data) {
                        var lineSplit;
                        var line;

                        //split the stdout data by new line and carriage return
                        lineSplit = data.toString().split("Login:");

                        count += lineSplit.length -1;
                    },
                    shouldEcho:false
                })
                .fail(function(err){
                    done(err);
                })
                .then(function(data){

                    //compare the count of the number of label texts in stdout data
                    //to the number of labels in the database for the application.
                    chai.assert.deepEqual(count,rows.length);
                    done();
                });

			}

		});
	});



	after(function(done){
	    //delete the labels from the database after all else has happened.
		var count = 0;

		this.timeout(5000);

        var responses = {
            'you sure':'y\n'
        };

		// remove our labels
        AD.spawn.command({
            command:'appdev',
            options:['labels', '-r', 'testApplication', 'testApplication.site.login'],
            responses:responses,
            exitTrigger:'> ',
            shouldEcho:false
// shouldEcho:true
        })
        .fail(function(err){
            done(err);
        })
        .then(function(data) {

            // remove our testing directory
            AD.spawn.command({
                command:'rm',
                options:['-R', testPath],
                shouldEcho:false
            })
            .fail(function(err){
                done(err);
            })
            .then(function(data) {

                // verify labels were removed from the system.
                var db = mysql.createConnection(dbInfo);

                db.connect();

                sql = "select * from "+DB_TABLE_LABEL+" "
                    + "where label_context = 'testApplication' "
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

            });

        });

	});
});