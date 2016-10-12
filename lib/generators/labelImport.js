
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');

var util = null;
var AD = require('ad-utils');
var _ = require('lodash');
var ejs = require('ejs');
var moment = require('moment');

var removeLabel = false;

var Generator = require('./class_generator.js');

var LabelCMD = require('./labels.js');
var LabelExportCMD = require('./labelExport.js');



var Resource = new Generator({
    key:'labelImport',
    command:'labelImport [dir:[path/to/file]] [format:[type]]',
    commandHelp: 'imports labels from this application\'s setup/labels/* files',
    parameters:['[options]'],
    additionalOptions:[]
});


var DB_TABLE_LABELS    = LabelCMD.DB_TABLE_LABELS;      // "site_multilingual_label";
var DB_TABLE_LANGUAGES = LabelCMD.DB_TABLE_LANGUAGES;   // "sites_multilingual_languages"

var VALID_FORMATS = LabelExportCMD.VALID_FORMATS;

module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev labelImport <green>[dir:[path/to/dir]] [format:[type]] [file:[fileName.po]]</green>',
        description:[ 
            'This command imports all the multilingual labels for this application.',
            '',
            '    By default we look for labels in the <yellow>'+path.join('setup','labels')+'</yellow> directory of the current application.',
            '',
            '    You can select which label formats to import.  The default format is <yellow>.po</yellow> . ',
            ''
        ].join('\n'),
        parameters:[
            '<green>[dir:[path/to/file]]</green>   :   <green>(optional)</green> the path of the directory to import labels from',
            '<green>[format:[type]]</green>        :   <green>(optional)</green> which format to import?  [ <yellow>.po</yellow>, .json] ',
            '<green>[file:[type]]</green>          :   <green>(optional)</green> choose an individual file to import (just the filename, not the path)',
        ],

        examples:[
            '> appdev labelImport  ',
            '    // imports all the current labels specified in the setup/labels/ directory ',
            '    // ',
            '',
            '',
        ]
    });

}



//This is the function that the process starts with.
Resource.perform = function () {
    util = this.adg;
    var _this = this;

    AD.log( 'Label Import ...');
    util.debug('labelImport.perform():  params ');
    util.debug(this.params);


    // parse Options
    this.parseOptions();
    // this.toRoot();

    util.debug('the provided cmd line options:');
    util.debug(this.options);


    // define the series of methods to call for this process
    var processSteps = [
                    'checkLocation',   // should be in an application
                    'checkDBSettings', // do we know how to connect to the DB
                    'loadDBConn',      // create our DB connection
                    'getLanguages',    // get list of all languages
                    'verifyParams',    // initialize the input variables
                    'findFiles',       // compile all the files matching our dir(s) + format
                    'loadData',        // load all the data from the files
                    'importLabels'     // now save these labels into the DB:
    ];


    this.methodStack(processSteps, function() {

        // when they are all done: 
        _this.exit([
            '',
            '> done.',
            ''
        ]);
    });


}

/*   Reuse these operations from the base Labels command  */

Resource.verifySetting = LabelCMD.verifySetting;    // verify our label db settings
Resource.checkDBSettings = LabelCMD.checkSettings;  // check all our label db settings
Resource.loadDBConn = LabelCMD.loadDBConn;          // load a connection to our label db
Resource.getLanguages = LabelCMD.getLanguages;      // get a list of languages from our label db
Resource.checkLocation = LabelCMD.checkLocation;    // check to see if we are in an application/module directory
Resource.error = LabelCMD.error;                    // common error handler ( db.end() )
Resource.exit  = LabelCMD.exit;


// Resource.checkLocation = function(done) {
//     // make sure we are running from an application/module directory

//     var currPath = process.cwd();
//     var AppDir = {
//         'api':1,
//         'assets':1,
//         'config':1,
//         'views':1,
//         'module.js':1
//     };

//     if (!AD.util.fs.looksLikeDir(AppDir, currPath)) {

//         AD.log();
//         AD.log('<red>error:</red> This command should be run from within a module/plugin directory.');
//         AD.log();
//         process.exit(1);

//     }

//     // if we get here, we're good to go
//     this.loadADN(currPath);

//     done();
// }




// Resource.checkDBSettings = function(done) {
//     // make sure all our db connection settings are known.


//     //// Here we reuse the Labels.js ability to check on the label DB settings.
//     //// in order for that to work, we need to share our ._adn with the LabelCMD
//     LabelCMD._adn = this._adn;
//     LabelCMD.checkSettings(done);
// }



// Resource.loadDBConn = function(done) {
//     // load our DB connection

//     var self = this;


//     this.dbInfo = {
//         host: this.defaults('label-host'),
//         user: this.defaults('label-user'),
//         password: this.defaults('label-pass'),
//         database: this.defaults('label-db'),
//         port: this.defaults('label-port')
//     };


//     var db = mysql.createConnection(this.dbInfo);
//     db.connect();
//     this.db = db;
    

//     done();
// }



// Resource.getLanguages = function(done) {
//     // load our DB connection
//     var self = this;

//     var sql = "select * from "+self.dbInfo.database+'.'+DB_TABLE_LANGUAGES;

//     this.db.query(sql,function(err,results){
//         if (err) {

//             AD.log();
//             AD.log.error('> error selecting languages from '+self.dbInfo.database+'.'+DB_TABLE_LANGUAGES+' table:',err,sql);
//             AD.log();
//             process.exit(1);

//         } else {

//             // AD.log('... languages:', results);

//             // Format of this.languages:
//             // [
//             //     {
//             //         "language_id": 1,
//             //         "language_code": "en",
//             //         "language_label": "English"
//             //     },
//             //     {
//             //         "language_id": 2,
//             //         "language_code": "ko",
//             //         "language_label": "Korean"
//             //     },
//             //     {
//             //         "language_id": 3,
//             //         "language_code": "zh-hans",
//             //         "language_label": "Chinese"
//             //     }
//             // ]

//             self.languages = results;

//             done();

//         }
//     });

// }



Resource.verifyParams = function(done) {
    var self = this;

    // <[dir:[path/to/file]] [format:[type]]
    this.dir = path.join(process.cwd(), 'setup', 'labels');
    this.format = '.po';
    this.files = [];


    var allowedKeys = [ 'dir', 'file', 'format'];

    // now override any settings present on our options:
    this.options.options.forEach(function(option){

        var parts = option.split(':');
        var key = parts[0].toLowerCase();

        // this has to be one of our expected parameters:
        if (_.indexOf(allowedKeys, key) != -1) {

            // check the dir parameter:
            switch(key) {
                case 'dir':

                    // assume relative:
                    if (fs.existsSync(path.join(process.cwd(), parts[1]))) {

                        self.dir = path.join(process.cwd(), parts[1]);

                    // no?  maybe it is absolute?
                    } else if (fs.existsSync(parts[1])) {

                        self.dir = parts[1];

                    // give up!
                    } else {

                        AD.log();
                        AD.log('<red>error:</red> directory doesn\'t make sense : '+path[1]);
                        AD.log();
                        process.exit(1);
                    }

                    break;


                case 'format':

                    var validFormats = VALID_FORMATS;
                    if (validFormats.indexOf(parts[1]) != -1) {
                        self[key] = parts[1];
                    } else {

                        AD.log();
                        AD.log('<red>error:</red> format [<yellow>'+parts[1]+'</yellow>] did not match a known format: <yellow>'+validFormats.join(', ')+'</yellow>');
                        AD.log();
                        process.exit(1);
                    }
                    break;

                case 'file':
                    self.files = parts[1].split(',');
                    break;

            }
   

            

        }

    })

    AD.log('... dir:<yellow>'+this.dir.replace(process.cwd(), '')+'</yellow>');
    AD.log('... import format:<yellow>'+this.format+'</yellow>');

    done();
}





var fileOK = function(filePath, format) {
    format = format || '.po';
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
        if (fs.existsSync(filePath)) {
            if (filePath.indexOf(format) != -1) {
                return true;
            }
        }
    }

    return false;
}

Resource.findFiles = function(done) {
    // find all the files referenced by the given dir & format

    var self = this;
    // this.files = [];  // initialized in validateParams();

    // no files were specified on the options.
    if (this.files.length == 0) {

        var dirPaths = this.dir.split(',');
        dirPaths.forEach(function(dir){

            // stat file
            try {
                var stats = fs.statSync(dir);
    
                // if a directory then
                if (stats.isDirectory()) {
    
                    // load all the files in the directory
                    var files = fs.readdirSync(dir);
                    files.forEach(function(file){
    
                        var filePath = path.resolve(dir, file);
                        if (fileOK(filePath, self.format)) {
                            self.files.push(filePath);
                        }
                        // var stat = fs.statSync(filePath);
                        // if (stat.isFile()) {
                        //     if (fs.existsSync(filePath)) {
                        //         if (file.indexOf(self.format) != -1) {
                        //             self.files.push(filePath);
                        //         }
                        //     }
                        // }
                    })
    
    
                } else {
    
                    // add file directly
                    if (fileOK(dir)) {
                        self.files.push(dir);
                    }
    
                } // end if
                
            } catch (err) {
                // File / directory does not exist.
                // Not a big deal.
            }
        })

    } else {
        
        // 
        // we will verify the given files are OK.
        //
        var verifiedFiles = [];

        // verify the files
        this.files.forEach(function(file){

            var filePath = path.resolve(self.dir, file);
            if (fileOK(filePath, self.format)) {
                verifiedFiles.push(filePath);
            } else {
                AD.log('<red>error:</red> improper file:<red>'+file+ '</red> ');
                AD.log('       dir:<green>'+self.dir.replace(process.cwd(),'')+'</green>');
                AD.log('       format:<green>'+self.format+'</green>');
                process.exit(1);
            }

        })

        this.files = verifiedFiles;

    }


    if (this.files.length == 0) {
        AD.log();
        AD.log('<red>error:</red> no files found.');
        AD.log('try again');
        AD.log();
        process.exit(1);
    }

    var list = [];
    this.files.forEach(function(file){
        list.push(file.replace(self.dir+path.sep, ''));
    })

    AD.log('... files: <yellow>'+ list.join(', ')+'</yellow>');
    done();

}





var trim = function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

Resource.loadData = function(done) {
    // ok, read in the labels

    var self = this;


    var allContents = '';

    // foreach file
    this.files.forEach(function(filePath){

        // mash together
        allContents += fs.readFileSync(filePath, 'utf8');
    })


    var readyData = [];

    // parse each line of data
    var allContentsSplit = allContents.split(/\r?\n\s*\r?\n/);
    allContentsSplit.forEach(function(line) {
// AD.log('...line:'+line);

        var newstr = trim(line);
        if (newstr != '') {

            var iscomment = false;
            var thepath = newstr.match(/path\: .*/) == null ? iscomment = true : newstr.match(/path\: .*/)[0].replace('path: ', '').trim() ;
            var thecode = newstr.match(/code\: .*/) == null ? iscomment = true : newstr.match(/code\: .*/)[0].replace('code: ', '').trim() ;
            var thekey = newstr.match(/key\: .*/) == null ? iscomment = true : newstr.match(/key\: .*/)[0].replace('key: ', '').trim() ;
            var thestr = newstr.match(/(?:msgstr ")(.*)(?:"$)/) == null ? iscomment = true : newstr.match(/(?:msgstr ")(.*)(?:"$)/)[1].trim() ;

            if (!iscomment) {
                readyData.push({ 
                    label_context: thepath,
                    language_code: thecode, 
                    label_key: thekey, 
                    label_lastMod: new Date(),
                    label_needs_translation: '0',
                    label_label: thestr});
            }
        }
    });

    this.labelData = readyData;

// AD.log('... readyData:', readyData);
    
    done();
}






var createLabel = function(self, alabel, cb) {

    var fields = [ 'label_key', 'label_label', 'language_code', 'label_context', 'label_needs_translation', 'createdAt'];

    alabel.label_needs_translation = 0;  // 1;
    alabel.createdAt = moment().format("YYYY-MM-DD HH:mm:ss");



    var fieldList = fields.join(', ');
    var valueList = [];
    fields.forEach(function(field){
        valueList.push( '"'+alabel[field]+'"');
    })


   var sql = "INSERT INTO  "+self.dbInfo.database+'.'+DB_TABLE_LABELS 
            + ' ( '+fieldList+' ) VALUES ( '+valueList.join(', ')+' )';

    self.db.query(sql,function(err,results){
        if (err) {

            AD.log();
            AD.log.error('> error adding label to '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',err,sql);
            AD.log();
            if (cb) cb(err);

        } else {

            AD.log('<green>added:   </green> label [<green>'+alabel.label_key+'</green>] was added to the DB.');
            if (cb) cb(null, results);

        }
    });
}

var matchingLabels = function(self, alabel, cb) {
    // return all labels matching this one


    var sql = "select * from "+self.dbInfo.database+'.'+DB_TABLE_LABELS 
              + ' WHERE language_code="'+alabel.language_code+'" AND label_key="'+alabel.label_key+'" AND label_context="'+alabel.label_context+'"';

    self.db.query(sql,function(err,results){
        if (err) {

            AD.log();
            AD.log.error('> error matching labels from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',err,sql);
            AD.log();
            if (cb) cb(err);

        } else {

            if (cb) cb(null, results);

        }
    });
}


var updateLabel = function(self, alabel, cb) {

    var sql = "UPDATE "+self.dbInfo.database+'.'+DB_TABLE_LABELS 
            + ' SET label_label="'+alabel.label_label.replace('"', '\"')+'", updatedAt="'+moment().format("YYYY-MM-DD HH:mm:ss")+'", label_needs_translation=0 '
            + ' WHERE id="'+alabel.id+'"';

    self.db.query(sql,function(err,results){
        if (err) {

            AD.log();
            AD.log.error('> error updating label from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',err,sql);
            AD.log();
            if (cb) cb(err);

        } else {

            AD.log('<green>updated:</green> label [<green>'+alabel.label_key+'</green>] was updated in DB.');
            if (cb) cb(null, results);

        }
    });
}




Resource.importLabels = function(done) {
    // save all these compiled labels:

    var self = this;

    var labelData = this.labelData;

    var numDone = 0;

    var checkDone = function() {
        numDone++;
        if (numDone >= labelData.length) {
            done();
        }
    }
    
    this.labelData.forEach(function(alabel){ 
// AD.log('... alabel:', alabel);

        matchingLabels(self, alabel, function(err, results){

// AD.log('   ... results:', results);

                if (results.length == 0) {
                    createLabel(self, alabel, function(err) {
                        checkDone();
                    });
                } else {
                    alabel['id'] = results[0].id;

                    if( !_.isEqual(alabel.label_label, results[0].label_label)) {
                        updateLabel(self, alabel, function(err) {
                            checkDone();
                        });

                    } else {

                        AD.log('<yellow>same:   </yellow> label [<yellow>'+alabel.label_key+'</yellow>] was already correct in DB.');
                        checkDone();
                    }
                    
                    
                }

        })

    });
}

