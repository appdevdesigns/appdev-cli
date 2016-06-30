
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
    key:'labelImportSetup',
    command:'labelImportSetup [dir:[path/to/file]] [format:[type]]',
    commandHelp: 'imports labels during an npm update/install operation',
    parameters:['[options]'],
    additionalOptions:[]
});


var DB_TABLE_LABELS    = LabelCMD.DB_TABLE_LABELS;      // "site_multilingual_label";
var DB_TABLE_LANGUAGES = LabelCMD.DB_TABLE_LANGUAGES;   // "sites_multilingual_languages"

var VALID_FORMATS = LabelExportCMD.VALID_FORMATS;

module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev labelImportSetup <green>[dir:[path/to/dir]] [format:[type]] [file:[fileName.po]]</green>',
        description:[ 
            '',
            '    <yellow>NOTE: you are not expected to use this from the command line ....  move along.</yellow>',
            '',
            '    This is called by the setup routines in our appdev plugins. It makes sure the DB info is',
            '    present before attempting to run the labelImport command.',
            ''
        ].join('\n'),
        parameters:[],

        examples:[
        ]
    });

}



//This is the function that the process starts with.
Resource.perform = function () {
    util = this.adg;
    var _this = this;

    AD.log( 'Label Import System ...');
    util.debug('labelImportSystem.perform():  params ');
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

                    'callLabelImport' // if we passed the check above, then import
    ];


    this.methodStack(processSteps, function() {

        // when they are all done: 
        process.exit(0);
    });


}

/*   Reuse these operations from the base Labels command  */


Resource.checkLocation = LabelCMD.checkLocation;    // check to see if we are in an application/module directory



Resource.verifySetting = function( key, cb) {
    var self = this;

    var val = this.defaults(key);

    if (val) {
        cb();
    } else {

        // we do not ask here, we simply alert that a DB setting is missing and exit.
        AD.log('<yellow>LabelImportSetup:</yellow> label db information ['+key+'] is missing. No import possible.');
        cb(new Error('Missing Info['+key+']'));
    }
}



Resource.checkDBSettings = function(done) {
    var self = this;

    var settings = LabelCMD.LabelSettings;

    var checkIt = function( indx, cb ) {

        if (indx >= settings.length) {
            cb();
        } else {

            self.verifySetting(settings[indx], function(err) {
                if (err) {
                    process.exit(0);
                } else {
                    checkIt(indx+1, cb);
                }
            })
        }
    }
    
    checkIt( 0, done);
}


Resource.callLabelImport = function(done) {

    AD.spawn.command({
        command:'appdev',
        options:[ 'labelImport'],
        // shouldEcho:false,
shouldEcho:true
        // responses:responses
    })
    .fail(function(err){
        AD.log.error('<bold>labels:</bold> error running appdev labelImport : ', err);
        process.exit(1);
    })
    .then(function(){

        done();

    });
}

