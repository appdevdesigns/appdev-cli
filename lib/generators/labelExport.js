
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');

var util = null;
var AD = require('ad-utils');
var _ = require('lodash');
var ejs = require('ejs');

var removeLabel = false;

var Generator = require('./class_generator.js');

var LabelCMD = require('./labels.js');


var Resource = new Generator({
    key:'labelExport',
    command:'l labelExport [application] [source:[langCode]] [dest:[langCode]] [format:[type]]',
    commandHelp: 'export labels for a given application',
    parameters:['applicationName', '[options]'],
    additionalOptions:[]
});


var DB_TABLE_LABELS    = LabelCMD.DB_TABLE_LABELS;      // "site_multilingual_label";
var DB_TABLE_LANGUAGES = LabelCMD.DB_TABLE_LANGUAGES;   // "sites_multilingual_languages"

module.exports = Resource;



//
//  Define the Valid File export options:
//
var VALID_FORMATS = ['.po'];                // .json,  
Resource.VALID_FORMATS = VALID_FORMATS;     // export this so our labelImport.js command can reuse this.



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev labelExport <yellow><bold>[application]</bold></yellow> <green>[source:[langCode]] [dest:[langCode]] [format:[type]] [fileName:[outputFileName]] [notTranslated]</green>',
        description:[ 
            'This command exports all the multilingual labels of the given <yellow>[application]</yellow> in the appdev <yellow>'+DB_TABLE_LABELS+'</yellow> table.',
            '',
            '    By default these labels will be placed in the '+path.join('setup','labels')+' directory of the current application.',
            '',
            '    The default label files will be named <green>labels_[dest_langCode].[format]</green>.',
            '    If you wish to export them to another filename then specify the <green>fileName:[outputFileName]</green> option.',
            '',
            '    You can select what format to export labels to.  The default format is <yellow>.po</yellow> . ',
            '',
            '    By default all labels associated with <yellow>[application]</yellow> will be exported.',
            '    If you only want to export the labels that have not been translated, add the <green>notTranslated</green> option.'
        ].join('\n'),
        parameters:[
            '<yellow>[application]</yellow>         :   which application (label_context) are you requesting labels for',
            '<green>[source:[langCode]]</green>   :   which language to use as the source language (translating from)',
            '<green>[dest:[langCode]]</green>     :   which language to use as the destination language (translating to)',
            '<green>[format:[type]]</green>       :   which export format to use?  [ .po, .json] ',
            '<green>[fileName:[outputFileName]]</green> :   the name of the output file.',
            '<green>[notTranslated]</green>       :   only export labels that have not been translated yet.'
        ],

        examples:[
            '> appdev labelExport  appdev',
            '    // displays all the current labels in the db. ',
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

    AD.log( 'Label Export ...');
    util.debug('label.perform():  params ');
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
                    'createDirectories',  // make sure label directory exists
                    'getLabels',       // load the labels for this application
                    'compileTemplate', // create the content for our labels_export file
                    'saveFile',
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
// Resource.error = LabelCMD.error;                    // common error handler ( db.end() )
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

    // [application] [source:[langCode]] [dest:[langCode]] [format:[type]]
    this.templateData = {};
    this.templateData.application = this.options.applicationName || '';

    // let's make sure application ! actually one of the options
    if (this.templateData.application != '') {
// AD.log('... initial application:'+this.templateData.application);
        if (this.templateData.application.indexOf(':') != -1) {
// AD.log('... option listed as application:  -> options:');
            this.options.options.push(this.templateData.application);
            this.templateData.application = '';
        }
    }

    // if application not given, then use current application name:
    if (this.templateData.application == '') {

        // this should be running from a module's root direcory
        // so use the last dirname for the application name
        var dirname = process.cwd();
        this.templateData.application = dirname.split(path.sep).pop();
        AD.log('... assuming application:<yellow>'+this.templateData.application+'</yellow>');
    } else {
        AD.log('... application:<yellow>'+this.templateData.application+'</yellow>');
    }



    this.templateData.source = 'en';
    this.templateData.dest = 'en';
    this.templateData.format = '.po';
    this.templateData.filename = null;
    this.templateData.nottranslated = false;  

    // default source and dest to 1st and 2nd language if available
    if (this.languages.length > 0) {
        this.templateData.source = this.languages[0].language_code;

        if (this.languages.length > 1) {
            this.templateData.dest = this.languages[1].language_code;
        }
    }

    // convert languages to a lookup
    var langHash = {};      // lookup hash
    var knownAry = [];      // list of known language codes
    this.languages.forEach(function(lang){
        langHash[lang.language_code] = lang;
        knownAry.push(lang.language_code);
    })
    var knownLanguages = knownAry.join(', ');


// AD.log('... options:', this.options);

    // now override any settings present on our options:
    this.options.options.forEach(function(option){
// AD.log('... curr option:', option);

        var parts = option.split(':');
        var key = parts[0].toLowerCase();
// AD.log('... curr key:'+key);
// AD.log('... is undefined:'+ typeof  self.templateData[key]);
// AD.log('... self.templateData:', self.templateData);

        if (typeof self.templateData[key] != 'undefined') {

            // this matches one of our defaults
            switch(key) {

                case 'format':
                    var validFormats = VALID_FORMATS;
                    if (validFormats.indexOf(parts[1]) != -1) {
                        self.templateData[key] = parts[1];
                    } else {

                        AD.log('<red>error:</red> format [<yellow>'+parts[1]+'</yellow>] did not match a known format: <yellow>'+validFormats.join(', ')+'</yellow>');
                        process.exit(1);
                    }
                    break;


                case 'source':
                case 'dest':
                    // does it match a known lang?
                    if (langHash[parts[1]]) {

                            // update the entry
                            self.templateData[key] = parts[1]; 
                    } else {

                        AD.log('<red>error:</red> '+key+' language [<yellow>'+parts[1]+'</yellow>] did not match an existing lang entry: <yellow>'+knownLanguages+'</yellow>');
                        process.exit(1);
                    }
                    break;


                case 'filename':
                    self.templateData.filename = parts[1];
                    break;


                case 'nottranslated':
                    self.templateData.nottranslated = true;
                    break;

            }

        }

    })

    AD.log('... source:<yellow>'+this.templateData.source+'</yellow>');
    AD.log('... dest:<yellow>'+this.templateData.dest+'</yellow>');
    AD.log('... export format:<yellow>'+this.templateData.format+'</yellow>');
    if (this.templateData.filename) {
        AD.log('... fileName:<yellow>'+this.templateData.filename+'</yellow>');
    }
    if (this.templateData.nottranslated) {
        AD.log('... onlyTranslated:<yellow>'+this.templateData.nottranslated+'</yellow>');
    }


    done();
}




Resource.createDirectories = function(done) {
    // use our default template parsing to create the expected setup/labels/ 
    // directory.

    this.parseTemplates();
    done();

}



Resource.getLabels = function(done) {
    // ok, read in the labels

    var self = this;

    var sql = "select * from "+self.dbInfo.database+'.'+DB_TABLE_LABELS;
    sql += ' where label_context LIKE \'%'+this.templateData.application+'%\'';

    if (this.templateData.nottranslated) {
        sql += ' AND label_needs_translation=1';
    }
// AD.log('... getLabels() sql:'+sql);

    this.db.query(sql,function(err,results){
        if (err) {

            AD.log();
            AD.log.error('> error selecting labels from '+self.dbInfo.database+'.'+DB_TABLE_LABELS+' table:',err,sql);
            AD.log();
            process.exit(1);

        } else {

            AD.log('... labels:', results);

            // Format of this.labels:
            // [   
            //     {
            //         "language_code": "en",
            //         "label_key": "[choose a measurement ...]",
            //         "label_label": "choose a measurement ...",
            //         "label_needs_translation": 0,
            //         "label_context": "opstool-dashboard",
            //         "id": 43,
            //         "createdAt": "2014-09-09T10:52:45.000Z",
            //         "updatedAt": null
            //     },
            //     {
            //         "language_code": "ko",
            //         "label_key": "[choose a measurement ...]",
            //         "label_label": "[ko] choose a measurement ...",
            //         "label_needs_translation": 1,
            //         "label_context": "opstool-dashboard",
            //         "id": 44,
            //         "createdAt": "2014-09-09T10:52:45.000Z",
            //         "updatedAt": null
            //     },
            //     {
            //         "language_code": "zh-hans",
            //         "label_key": "[choose a measurement ...]",
            //         "label_label": "[zh-hans] choose a measurement ...",
            //         "label_needs_translation": 1,
            //         "label_context": "opstool-dashboard",
            //         "id": 45,
            //         "createdAt": "2014-09-09T10:52:45.000Z",
            //         "updatedAt": null
            //     }
            // ]

            var labels = {};
            results.forEach(function(row){

                // compile:  labels {
                //     '[key]': {
                //             label_path:'label_context',
                //             label_key: 'label_key',
                //             label_source:'source.language_code',
                //             label_label: 'dest.language_code'    
                //     }
                // }

                if (typeof labels[row.label_key] == 'undefined') {
                    labels[row.label_key] = { };
                }
                
                var entry = labels[row.label_key];
                entry.label_path = entry.label_path || row.label_context;
                entry.label_key = entry.label_key || row.label_key;
                
                if (self.templateData.source == row.language_code) {
                    entry.label_source = row.label_label;
                }
                
                if (self.templateData.dest == row.language_code) {
                    entry.label_label = row.label_label;
                }
            
            });
        
            // convert this Hash to an array:
            self.templateData.labels = _.values(labels);


// AD.log('... label Data: ', self.templateData.labels);

            done();

        }
    });
}



Resource.compileTemplate = function(done) {
    // now read in the template file and generate the label export contents

    var conversions = {
        '.po' : '_po',
        '.json' : '_json'
    }
    // choose the proper template:
    var template = '__labelsexport[type].ejs';
    var fmt = this.templateData.format;
    for (var k in conversions) {
        fmt = fmt.replace(k, conversions[k]);
    }
    template = template.replace('[type]', fmt);

    var pathTemplate = path.join(__dirname, '..', '..', 'templates', template);


    var contents = fs.readFileSync(pathTemplate, 'utf8');


    this.templateData.context = this.templateData.application;


    // render the template
    this.templateContents = ejs.render(contents, this.templateData);


// AD.log('... templateContents:');
// AD.log(this.templateContents);

    done();
}



Resource.saveFile = function(done) {
    // we've got the template data, now save it.

    var name = 'labels_[dest_langCode][format]';
    if (this.templateData.filename) {
        name = this.templateData.filename;
    } else {
        name = name.replace('[dest_langCode]', this.templateData.dest);
        name = name.replace('[format]', this.templateData.format);
    }
    

    var filePath = path.join(process.cwd(), 'setup', 'labels', name);

    fs.writeFileSync( filePath, this.templateContents, 'utf8');


    done();
}

