
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');

var util = null;

var removeLabel = false;

var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'labels',
    command:'l labels -r [application] [key] [langCode] [label]',
    commandHelp: 'Create labels for the system',
    parameters:['applicationName', 'keyName', 'langCode', 'labelName']
});


module.exports = Resource;

//Created own registerParams function so that 
//the flag for a delete could be set.
Resource.registerParams = function(params){
	
	var util = this.adg;
	
	var self = this;
	
	params.option('-r', 'remove the label from the system');

    params.on('-r', function() {
		self.removeLabel = true;
    });
	
	this.params = params;

}


Resource.parseOptions = function( ) {

    // now step through the provided this.parameters entries, and read in an
    // options object

    this.options = {};

    for (var p in this.parameters) {
        var key = this.parameters[p];
       
        // store this option normally
        this.options[key] = this.params.args.shift() || null;

    }

}

//This is the function that the process starts with.
Resource.perform = function () {
    util = this.adg;

    util.log( 'Creating label for system ');
    util.debug('label.perform():  params ');
    util.debug(this.params);


    // parse Options
    this.parseOptions();
	this.toRoot();

    util.debug('the provided cmd line options:');
    util.debug(this.options);
	
	//Each of the connection values are selected from 
	//the .adn file in the root directory.
	dbName = this.defaults('label-db');
	hostName = this.defaults('label-host');
	userName = this.defaults('label-user');
	pass = this.defaults('label-pass');
	portNumber = this.defaults('label-port');

	if (!dbName){
		util.log();
        util.log('<yellow>You must enter a default label-db</yellow>');
        util.log('appdev default label-db [value]');
        util.log();
		process.exit(1);
	}
		
	if (!hostName){
		util.log();
        util.log('<yellow>You must enter a default label-host</yellow>');
        util.log('appdev default label-host [value]');
        util.log();
		process.exit(1);
	}
		
	if (!userName){
		util.log();
        util.log('<yellow>You must enter a default label-host</yellow>');
        util.log('appdev default label-user [value]');
        util.log();
		process.exit(1);
	}
		
	if (!pass){
		util.log();
        util.log('<yellow>You must enter a default label-pass</yellow>');
        util.log('appdev default label-pass [value]');
        util.log();
		process.exit(1);
	}
	
	if (!portNumber){
		util.log();
        util.log('<yellow>You must enter a default label-pass</yellow>');
        util.log('appdev default label-port [value]');
        util.log();
		process.exit(1);
	}
	
	this.dbInfo = {
		host: hostName,
		user: userName,
		password: pass,
		database: dbName,
		port: portNumber
	};
	
	if (this.options.applicationName) {
		
        if (this.options.keyName) {
		
			if (this.options.langCode) {
		
				if (this.options.labelName)	{
					
					//All the options were inputed so either the label needs to be inserted or updated.
					this.handleLabel();
						
				} else {
					
					util.log();
            		util.log('<yellow>You must enter a label name.</yellow>');
            		util.log('appdev labels [applicationName] [keyName] [langCode] [labelName]');
            		util.log();
					process.exit(1);
					
				}
			} else {

				//The label is going to be removed.
				if (this.removeLabel) {
				
					this.deleteLabels();
					
				} else {
				
					this.displayLabels();
				}
			
			}
		} else {

			this.displayLabels();
		
		}
	} else {
		
		this.displayLabels();
	
	}

}

//This function decides where the label needs to be 
//inserted or updated.
Resource.handleLabel = function(){

	var self = this;
	
	var selectMethods = [];
	
	//The function 'selectLabel' is put into methodStack,
	//so it can wait on the execution on it to get the result.
	selectMethods.push('selectLabel');

	this.methodStack(selectMethods, function() {
		
		//if there are no rows in the db, then rows need to be added for the label
		if (self.selectRows.length == 0) {
		
			self.addLabels();
			
		} else {
			
			var needsTranslation = false;
			var methods = [];
		
			//Looping through the rows in the db to see if the labels
			//still need to be translated
			for(var a=0;a<self.selectRows.length;a++){
		
				if (self.selectRows[a].label_needstranslation == 1){
					needsTranslation = true;
				}
		
			}
			
			//if all the labels have been translated then all the labels
			//need to be switched back to needing translation so they can be checked.
			if (!needsTranslation){
				
				methods.push('updateAllLabels');
			
			}
			
			methods.push('updateLabel');

    		self.methodStack(methods, function() {

        		// when they are all done with running the functions
        		util.log();
        		util.log('<green><bold>Done!</bold></green>');
        		util.log();

    		})
			
		}
	});

}

//This function deletes the label from the db,
//based off of key and the application of the label.
Resource.deleteLabels = function(){
	
	var self = this; 
	
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	var sql = "delete from sites_multilingual_labels "
			+ "where label_key = '"+this.options.keyName+"' "
			+ "and label_application = '"+this.options.applicationName + "' ";
			
	db.query(sql,function(err,results){
		if (err) {
			
			util.error();
			util.error('error deleting from sites_multilingual_labels table:');
			util.error(err);
			util.log();
			process.exit(1);			
			
		} else {
			
			util.log();
            util.log('successfully deleted for keyName '+self.options.keyName+' from the system');
            util.log();
			
		}
	});
	
	db.end();
}

//Update all the labels to needing translation 
//because before they were set to 0 and another
//label is being updated again.
Resource.updateAllLabels = function(done){
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	var sql = "update sites_multilingual_labels "
			+ "set label_needstranslation = 1 , "
			+ "updatedAt = now() "
			+ "where label_key = '"+this.options.keyName +"' "
			+ "and label_application = '"+this.options.applicationName + "'";
			
	db.query(sql,function(err,results){
		if (err){
								
			util.error();
			util.error('error updating sites_multilingual_labels table:');
			util.error(err);
			util.log();
			process.exit(1);
			
		}
		
		if (done) done();
	});
	
	db.end();
}	

//This function updates the label_label.  The label has already
//been inserted and now the translation for the language code is 
//being updated.
Resource.updateLabel = function(done){
	
	var self = this;
	
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	var sql = "update sites_multilingual_labels "
			+ "set label_needstranslation = 0, "
			+ "updatedAt = now(), "
			+ "label_label = '"+this.options.labelName + "' "
			+ "where label_key = '"+this.options.keyName + "' "
			+ "and language_code = '"+this.options.langCode + "'"

	db.query(sql,function(err,results){
		if (err){
					
			util.error();
			util.error('error updating sites_multilingual_labels table:');
			util.error(err);
			util.log();
			process.exit(1);
			
		}else{
			
			util.log();
            util.log('successfully updated label '+self.options.labelName+' for the system');
            util.log();
			
			if (done) done();
			
		}
	});	
	
	db.end();
}

//This function adds labels to the database.  It adds one label to
//the database for every row that is in the sites_multilingual_languages 
//table.  
Resource.addLabels = function(){
	
	var self = this;
	
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	var sql = "select * from sites_multilingual_languages ";
	
	db.query(sql,function(err,rows,fields){
		
		if (err) {
		
			util.error();
			util.error('error selecting from sites_multilingual_languages table:');
			util.error(err);
			util.log();
			process.exit(1);
			
		} else {
			
			//Go through each row in the sites_multilingual_languages
			//and evaluate if the row in the db matches the language code
			//inputed on the command line.
			for(var a=0;a<rows.length;a++){

					if (rows[a].language_code == self.options.langCode) {
						//If the language codes match then the label doesn't need
						//to be translated and the labelName doesn't need to be edited.
						translate = 0;
						labelName = self.options.labelName;
						langCode = self.options.langCode
					} else {
						//If the language codes don't match then the label needs a
						//translation and the labelName needs to include the language code.
						translate = 1;
						labelName = "[" + rows[a].language_code + "] " + self.options.labelName;
						langCode = rows[a].language_code;
					}
					self.addOneLabel(labelName, translate, langCode);
			}
			
		}
	});
	
	db.end();
	
}

//This function selects the label from the database
//based off of the information inputed into the command line.
Resource.selectLabel = function(done){
	
	var self = this;
	
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	console.log("this.dbInfo.port = "+this.dbInfo.port);
	console.log("this.dbInfo.host = "+this.dbInfo.host);
	console.log("this.dbInfo.user = "+this.dbInfo.user);
	console.log("this.dbInfo.password = "+this.dbInfo.password);
	console.log("this.dbInfo.database = "+this.dbInfo.database);
	
	var sql = "select * from sites_multilingual_labels "
			+ "where label_key = '"+this.options.keyName+"' "
			+ "and label_application = '"+this.options.applicationName+"'";
			
	db.query(sql,function(err,rows){
		
		if (err) {
		
			util.error();
			util.error('error selecting from sites_multilingual_labels table:');
			util.error(err);
			
		} else {
			
			self.selectRows = rows;
			
			if (done) done();
			
		}
	});
	
	db.end();
}

//This function adds a label to the database based
//off of the options inputed into the command line.
Resource.addOneLabel = function(labelName,translation, langCode){
	
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	var sql = "insert into sites_multilingual_labels "
			 + "(language_code,label_key,label_label, "
			 + "createdAt,label_application,label_needstranslation) "
			 + "values ('"+langCode+"','"+this.options.keyName+ "','"
			 + labelName+"',now(),'"+this.options.applicationName+"',"+translation+")";
	
	
	db.query(sql,function(err,result){
		
		if (err){
			
			util.error();
            util.error('error inserting into sites_multilingual_labels table:');
            util.error(err);
            util.log();
            process.exit(1);
			
		} else {
			
			util.log();
            util.log('successfully added label '+labelName+' to the system');
            util.log();
			
		}
	});
	
	db.end();
}

//This function displays the labels that are stored in the database.
//It displays by the options that are inputed on the command line.
Resource.displayLabels = function(){
	
	var db = mysql.createConnection(this.dbInfo);
	
	db.connect();
	
	var sql = "select * from sites_multilingual_labels ";
	
	if (this.options.applicationName !== true) {
		
		//if the applicationName is inputed, then it selects based off of the applicationName
		if (this.options.applicationName) {
			sql = sql + "where label_application = '" + this.options.applicationName + "'";
			
			//If the keyName is inputed, then it selects based off of the keyName
			if (this.options.keyName) {
				sql = sql + " and label_key = '" + this.options.keyName + "'";
			}
		}
	}
	
	db.query(sql,function(err,rows,fields){
		if (err){
			
			util.error();
            util.error('error selecting from sites_multilingual_labels table:');
            util.error(err);
            process.exit(1);
			
		} else {
			
			util.log("Lang Code		Label\r\n");
			util.log("-----------------------------\r\n");
			for(var a=0;a<rows.length;a++){
				util.log(""+rows[a].language_code+"			"+rows[a].label_label+ "\r\n");
			}
			
		}
	});
	
	db.end();
	
}
