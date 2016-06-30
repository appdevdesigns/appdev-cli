
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');

var util = null;
var AD = require('ad-utils');

var removeLabel = false;

var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'labels',
    command:'l labels [application] [key] [langCode] [label]',
    commandHelp: 'Create labels for the system',
    parameters:['applicationName', 'keyName', 'langCode', 'labelName'],
    additionalOptions:[ { key:'-r, --remove', desc:'remove resource'}]
});


var DB_TABLE_LABELS = Resource.DB_TABLE_LABELS = "site_multilingual_label";
var DB_TABLE_LANGUAGES = Resource.DB_TABLE_LANGUAGES = "site_multilingual_language"

var LabelSettings = Resource.LabelSettings = [ 'label-db', 'label-host', 'label-user', 'label-pass', 'label-port' ];

module.exports = Resource;


Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev labels <yellow><bold>[application] [key] [langCode] [label]</bold></yellow>',
        description:[ 
            'This command creates a multilingual label in the appdev '+DB_TABLE_LABELS+' table.',
            '',
            '    Labels are grouped according to an <yellow>[application]</yellow>.',
            '    Labels within an <white><bold>[application]</bold></white> are sorted by a unique <yellow>[key]</yellow>.',
            '    Labels within an <white><bold>[application].[key]</bold></white> are associated with a given <yellow>[langCode]</yellow>.',
            '',
            '    This command can be used for searching for labels as well.  You can narrow your search by giving ',
            '    and <white><bold>[application]</bold></white> and/or a <white><bold>[key]</bold></white>',
            ''
        ].join('\n'),
        parameters:[
            '<yellow>[application]</yellow>         :   which application are you requesting labels for',
            '<yellow>[key]</yellow>                 :   the unique label key',
            '<yellow>[langCode]</yellow>            :   what is the language code of the text you are entering',
            '<yellow>[label]</yellow>               :   the actual text for this label',

        ],

        examples:[
            '> appdev labels ',
            '    // displays all the current labels in the db. ',
            '    // this is probalby way more info than you want, so let\'s narrow that down.',
            '',
            '> appdev labels <yellow>spiffy.application</yellow>',
            '    // displays all the current labels associated with application <white>spiffy.application</white> ',
            '',
            '> appdev labels spiffy.application <yellow>user.name</yellow>',
            '    // displays all labels in application "spiffy.application" with key "user.name"',
            '',
            '> appdev labels spiffy.application user.name <yellow>en  "User Name"</yellow>',
            '    // actually adds/updates the label for key user.name to have the english text "User Name"',
            '    // <yellow>NOTE:</yellow> the use of "" around the label you are entering.  ',
            '    // If any of your fields have spaces, then wrap them in ""',

            '',
        ]
    });

}







/*
//Created own registerParams function so that
//the flag for a delete could be set.
Resource.registerParams = function(params){

    var util = this.adg;

    var self = this;


    this.params = params;
    params.option(this.command, this.commandHelp);

    params.option('labels -r', 'remove the label from the system');

    params.on('-r', function() {
        self.removeLabel = true;
    });

}
*/


//This is the function that the process starts with.
Resource.perform = function () {
    var _this = this;
    util = this.adg;

    AD.log( 'Labels ...');
    util.debug('label.perform():  params ');
    util.debug(this.params);


    // parse Options
    this.parseOptions();
    this.toRoot();

    util.debug('the provided cmd line options:');
    util.debug(this.options);


    this.removeLabel = false;
    if (this.params.remove) {
        this.removeLabel = true;
    }

    // define the series of methods to call for this process
    var processSteps = [
                    'checkSettings',
                    'verifyParams',
                    'getLanguages',
                    'chooseAction'
    ];


    this.methodStack(processSteps, function() {

        // when they are all done:
        _this.exit([
            '',
            ''
        ]);
    });


}

Resource.error = function(list, exitNum) {

    if (this.db) this.db.end();

    list.forEach(function(out) {
        AD.log.error(out);
    });

    process.exit(exitNum);

}

Resource.exit = function(list, exitNum) {

    if (this.db) this.db.end();

    list.forEach(function(out){
        AD.log(out);
    })

    process.exit(0);
}



Resource.verifyDelete = function(key,  cb) {
    var self = this;

        var qset =  {
            question: 'are you sure you want to delete label['+key+']:',
            data: 'doIt',
            def : 'no'

        };
        this.questions(qset, function(err, data) {

            if (err) {

                self.error(['error getting user response.', err],1);
                // process.exit(1);
            } else {

                if (data.doIt == 'no') {
                    cb(false);
                } else {
                    cb(true);
                }
            }

        });
    
}



Resource.verifySetting = function( key, cb) {
    var self = this;

    var val = this.defaults(key);

    if (val) {
        cb();
    } else {

        var qset =  {
            question: 'label db connection settings -> '+key.replace('label-', '')+':',
            data: 'key',
            def : key,
 //           post: function(data) { data. = data.authType.toLowerCase(); }

        };
        this.questions(qset, function(err, data) {

            if (err) {
                self.error(['error getting user response.', err],1);
                // process.exit(1);
            } else {

                self.defaults(key, data.key);
                cb();
            }

        });
    }
}



Resource.checkSettings = function(done) {
    var self = this;

    var settings = LabelSettings;

    var checkIt = function( indx, cb ) {

        if (indx >= settings.length) {
            cb();
        } else {

            self.verifySetting(settings[indx], function() {
                checkIt(indx+1, cb);
            })
        }
    }
    
    checkIt( 0, done);
}



Resource.verifyParams = function(done) {

    // the only case we need to exit for is when everything BUT label is specified:
    if ((this.options.applicationName) 
        && (this.options.keyName) 
        && (this.options.langCode) 
        && (!this.options.labelName)) {


            this.error([
                '',
                '<yellow>You must enter a label name.</yellow>', 
                'appdev labels '+this.options.applicationName+' '+this.options.keyName+' '+this.options.langCode+' <green><bold>[labelName]</bold></green>',
                ''
            ],1);

            // util.log();
            // util.log('<yellow>You must enter a label name.</yellow>');
            // util.log('appdev labels '+this.options.applicationName+' '+this.options.keyName+' '+this.options.langCode+' <green><bold>[labelName]</bold></green>');
            // util.log();
            // process.exit(1);

    } else {

        done();
    }
}



Resource.chooseAction = function(done) {
    

    this.dbInfo = {
        host: this.defaults('label-host'),
        user: this.defaults('label-user'),
        password: this.defaults('label-pass'),
        database: this.defaults('label-db'),
        port: this.defaults('label-port')
    };


    if (this.options.applicationName) {

        if (this.options.keyName) {

            if (this.options.langCode) {

                if (this.options.labelName) {

                    //All the options were inputed so either the label needs to be inserted or updated.
                    this.handleLabel(done);

                } else {

                    // util.log();
                    // util.log('<yellow>You must enter a label name.</yellow>');
                    // util.log('appdev labels [applicationName] [keyName] [langCode] <green><bold>[labelName]</bold></green>');
                    // util.log();
                    // process.exit(1);

                    self.error([
                        '',
                        '<yellow>You must enter a label name.</yellow>', 
                        'appdev labels '+this.options.applicationName+' '+this.options.keyName+' '+this.options.langCode+' <green><bold>[labelName]</bold></green>',
                        ''
                    ],1);

                }
            } else {

                //The label is going to be removed.
                if (this.removeLabel) {

                    this.deleteLabels(done);

                } else {

                    this.displayLabels(done);
                }

            }
        } else {

            this.displayLabels(done);

        }
    } else {

        this.displayLabels(done);

    }
}






Resource.loadDBConn = function(done) {
    // load our DB connection

    var self = this;

    if (!this.db) {

        this.dbInfo = {
            host: this.defaults('label-host'),
            user: this.defaults('label-user'),
            password: this.defaults('label-pass'),
            database: this.defaults('label-db'),
            port: this.defaults('label-port')
        };


        var db = mysql.createConnection(this.dbInfo);
        db.connect();
        this.db = db;
    }

    if (done) done();
}





//This function decides where the label needs to be
//inserted or updated.
Resource.handleLabel = function(done){

    var self = this;

    var selectMethods = [];

    //The function 'selectLabel' is put into methodStack,
    //so it can wait on the execution on it to get the result.
    selectMethods.push('selectLabel');

    this.methodStack(selectMethods, function() {

        //if there are no rows in the db, then rows need to be added for the label
        if (self.selectRows.length == 0) {

            self.addLabels(done);

        } else {

            var needsTranslation = false;
            var methods = [];

            //Looping through the rows in the db to see if the labels
            //still need to be translated
            for(var a=0;a<self.selectRows.length;a++){

                if (self.selectRows[a].label_needs_translation == 1){
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
                // util.log();
                // util.log('> <green><bold>Done!</bold></green>');
                // util.log();

                self.exit([
                    '',
                    '> <green><bold>Done!</bold></green>',
                    ''
                ]);

            })

        }
    });

}



//This function deletes the label from the db,
//based off of key and the application of the label.
Resource.deleteLabels = function(done){

    var self = this;

    this.displayLabels(function(err){

        if (err){

            // there was a problem displaying the labels!  
            // maybe a connection problem.

        } else {

            self.verifyDelete(self.options.keyName, function(doIt) {


                if (doIt) {

                    // var db = mysql.createConnection(self.dbInfo);
                    // db.connect();
                    self.loadDBConn();
                    var db = self.db;



                    var sql = "delete from "+DB_TABLE_LABELS+" "
                            + "where label_key = '"+self.options.keyName+"' "
                            + "and label_context = '"+self.options.applicationName + "' ";

                    db.query(sql,function(err,results){
                        if (err) {

                            // AD.log();
                            // AD.log.error('> error deleting from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',err,sql);
                            // AD.log();
                            // process.exit(1);

                            self.error([
                                '',
                                '> error deleting from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',
                                err,
                                sql, 
                                ''
                            ],1);


                        } else {

                            // done();

                            // we'll manually exit here instead:
                            self.exit([
                                '',
                                '> successfully deleted label[<yellow>'+self.options.keyName+'</yellow>] from the system',
                                ''
                            ]);

                        }
                    });

                    // db.end();

                } else {

                    // AD.log();
                    // AD.log('> <white>nevermind then ...</white>');
                    // AD.log();
                    // process.exit(0);

                    self.exit([
                        '',
                        '> <white>nevermind then ...</white>',
                        ''
                    ]);
                }

            });

        }

    });

}



//Update all the labels to needing translation
//because before they were set to 0 and another
//label is being updated again.
Resource.updateAllLabels = function(done){
    var self = this;

    // var db = mysql.createConnection(self.dbInfo);
    // db.connect();
    this.loadDBConn();
    var db = this.db;

    var sql = "update "+DB_TABLE_LABELS+" "
            + "set label_needs_translation = 1 , "
            + "updatedAt = now() "
            + "where label_key = '"+this.options.keyName +"' "
            + "and label_context = '"+this.options.applicationName + "'";

    db.query(sql,function(err,results){
        if (err){

            // AD.log();
            // AD.log.error('error updating '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',err, '\nsql:\n', sql);
            // AD.log();
            // process.exit(1);

            self.error([
                '',
                'error updating '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',
                err, 
                '\nsql:\n', 
                sql,
                ''
            ],1);

        }

        if (done) done();
    });

    // db.end();
}

//This function updates the label_label.  The label has already
//been inserted and now the translation for the language code is
//being updated.
Resource.updateLabel = function(done){

    var self = this;

    // var db = mysql.createConnection(self.dbInfo);
    // db.connect();
    this.loadDBConn();
    var db = this.db;

    var sql = "update "+DB_TABLE_LABELS+" "
            + "set label_needs_translation = 0, "
            + "updatedAt = now(), "
            + "label_label = '"+this.options.labelName + "' "
            + "where label_key = '"+this.options.keyName + "' "
            + "and language_code = '"+this.options.langCode + "'"

    db.query(sql,function(err,results){
        if (err){

            // util.error();
            // util.error('error updating '+self.dbInfo.database+'.site_multilingual_label table:');
            // util.error(err);
            // util.log();
            // process.exit(1);
            self.error([
                '',
                'error updating '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',
                err, 
                '\nsql:\n', 
                sql,
                ''
            ],1);

        }else{

            util.log();
            util.log('successfully updated label '+self.options.labelName+' for the system');
            util.log();

            if (done) done();

        }
    });

    // db.end();
}







Resource.getLanguages = function(done) {
    // load our DB connection
    var self = this;

    this.loadDBConn();

    var sql = "select * from "+self.dbInfo.database+'.'+DB_TABLE_LANGUAGES;

    this.db.query(sql,function(err,results){
        if (err) {

            // AD.log();
            // AD.log.error('> error selecting languages from '+self.dbInfo.database+'.'+DB_TABLE_LANGUAGES+' table:',err,sql);
            // AD.log();
            // process.exit(1);

            self.error([
                '',
                'error selecting languages from '+self.dbInfo.database+'.'+DB_TABLE_LANGUAGES+' table:',
                err, 
                '\nsql:\n', 
                sql,
                ''
            ],1);

        } else {

            // AD.log('... languages:', results);

            // Format of this.languages:
            // [
            //     {
            //         "language_id": 1,
            //         "language_code": "en",
            //         "language_label": "English"
            //     },
            //     {
            //         "language_id": 2,
            //         "language_code": "ko",
            //         "language_label": "Korean"
            //     },
            //     {
            //         "language_id": 3,
            //         "language_code": "zh-hans",
            //         "language_label": "Chinese"
            //     }
            // ]

            self.languages = results;

            done();

        }
    });

}



//This function adds labels to the database.  It adds one label to
//the database for every row that is in the sites_multilingual_languages
//table.
Resource.addLabels = function(done){

    var self = this;

    var numDone = 0;

    //Go through each row in the sites_multilingual_languages
    //and evaluate if the row in the db matches the language code
    //inputed on the command line.
    // for(var a=0;a<rows.length;a++){
    this.languages.forEach(function(lang){

            if (lang.language_code == self.options.langCode) {
                //If the language codes match then the label doesn't need
                //to be translated and the labelName doesn't need to be edited.
                translate = 0;
                labelName = self.options.labelName;
                langCode = self.options.langCode
            } else {
                //If the language codes don't match then the label needs a
                //translation and the labelName needs to include the language code.
                translate = 1;
                labelName = "[" + lang.language_code + "] " + self.options.labelName;
                langCode = lang.language_code;
            }
            self.addOneLabel(labelName, translate, langCode, function(err){

                numDone++;
                if (numDone >= self.languages.length) {
                    done();
                }
            });
    });


/*
    // var db = mysql.createConnection(self.dbInfo);
    // db.connect();
    this.loadDBConn();
    var db = this.db;

    var sql = "select * from "+DB_TABLE_LANGUAGES+" ";

    db.query(sql,function(err,rows,fields){

        if (err) {

            util.error();
            util.error('error selecting from '+self.dbInfo.database+'.'+DB_TABLE_LANGUAGES+' table:');
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

    // db.end();
*/

}

//This function selects the label from the database
//based off of the information inputed into the command line.
Resource.selectLabel = function(done){

    var self = this;

    // var db = mysql.createConnection(self.dbInfo);
    // db.connect();
    this.loadDBConn();
    var db = this.db;

    // console.log("this.dbInfo.port = "+this.dbInfo.port);
    // console.log("this.dbInfo.host = "+this.dbInfo.host);
    // console.log("this.dbInfo.user = "+this.dbInfo.user);
    // console.log("this.dbInfo.password = "+this.dbInfo.password);
    // console.log("this.dbInfo.database = "+this.dbInfo.database);

    var sql = "select * from "+DB_TABLE_LABELS+" "
            + "where label_key = '"+this.options.keyName+"' "
            + "and label_context = '"+this.options.applicationName+"'";

    db.query(sql,function(err,rows){

        if (err) {

            // util.error();
            // util.error('error selecting from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:');
            // util.error(err);

            self.error([
                '',
                'error selecting from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',
                err, 
                '\nsql:\n', 
                sql,
                ''
            ],1);

        } else {

            self.selectRows = rows;

            if (done) done();

        }
    });

    // db.end();
}

//This function adds a label to the database based
//off of the options inputed into the command line.
Resource.addOneLabel = function(labelName,translation, langCode, cb){
    var self = this;

    // var db = mysql.createConnection(self.dbInfo);
    // db.connect();
    this.loadDBConn();
    var db = this.db;

    var sql = "insert into "+DB_TABLE_LABELS+" "
             + "(language_code,label_key,label_label, "
             + "createdAt,label_context,label_needs_translation) "
             + "values ('"+langCode+"','"+this.options.keyName+ "','"
             + labelName+"',now(),'"+this.options.applicationName+"',"+translation+")";


    db.query(sql,function(err,result){

        if (err){

            // util.error();
            // util.error('error inserting into '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:');
            // util.error(err);
            // util.log();
            // process.exit(1);

            self.error([
                '',
                'error inserting into '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',
                err, 
                '\nsql:\n', 
                sql,
                ''
            ],1);

        } else {

            var obj = {
                language_code:langCode,
                label_key:self.options.keyName,
                label_label:labelName,
                label_context:self.options.applicationName
            };

            AD.log();
            AD.log('successfully added label '+labelName+' to the system');
            AD.log('<white><bold>'+JSON.stringify(obj,null)+'</bold></white>');
            AD.log();

            cb();

        }
    });

    // db.end();
}



//This function displays the labels that are stored in the database.
//It displays by the options that are inputed on the command line.
Resource.displayLabels = function(done){
    var self = this;

    // var db = mysql.createConnection(self.dbInfo);
    // db.connect();
    this.loadDBConn();
    var db = this.db;

    var sql = "select * from "+DB_TABLE_LABELS+" ";

    if (this.options.applicationName !== true) {

        //if the applicationName is inputed, then it selects based off of the applicationName
        if (this.options.applicationName) {
            sql = sql + "where label_context = '" + this.options.applicationName + "'";

            //If the keyName is inputed, then it selects based off of the keyName
            if (this.options.keyName) {
                sql = sql + " and label_key = '" + this.options.keyName + "'";
            }

        } else {

            AD.log();
            AD.log('showing labels for all applications.');
            AD.log('<white>If you want to narrow this down:</white> appdev labels <yellow>[application]</yellow>');
            AD.log();
        }

    } 

//console.log(this.options);
//console.log(sql);       

    db.query(sql,function(err,rows,fields){
        if (err){

            self.error([
                '',
                'error selecting from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',
                err, 
                '\nsql:\n', 
                sql,
                ''
            ],1);


        } else {

            var Table = require('cli-table');

            var table = new Table({  
                head: ["application", "language", "key", "label"],
                chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''} 
            });

            rows.forEach(function(row){
                var obj = {};
                obj[row.label_context] = [row.language_code, row.label_key, row.label_label];
                table.push(obj);
            });

            console.log(table.toString());

            done();

        }
    });

    // db.end();

}


Resource.checkLocation = function(done) {
    // make sure we are running from an application/module directory

    var currPath = process.cwd();
    var AppDir = {
        'api':1,
        'assets':1,
        'config':1,
        'views':1,
        'module.js':1
    };

    if (!AD.util.fs.looksLikeDir(AppDir, currPath)) {

        AD.log();
        AD.log('<red>error:</red> This command should be run from within a module/plugin directory.');
        AD.log();
        process.exit(1);

    }

    // if we get here, we're good to go
    this.loadADN(currPath);

    done();
}
