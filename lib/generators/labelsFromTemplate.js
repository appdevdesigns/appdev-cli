
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
var LabelImportCMD = require('./labelImport.js');
// var LabelExportCMD = require('./labelExport.js');



var Resource = new Generator({
    key: 'labelsFromTemplate',
    command: 'labelsFromTemplate [path/to/templateFile]',
    commandHelp: 'imports labels from a specified template file',
    parameters: ['template', '[options]'],
    additionalOptions: []
});


var DB_TABLE_LABELS = LabelCMD.DB_TABLE_LABELS;      // "site_multilingual_label";
var DB_TABLE_LANGUAGES = LabelCMD.DB_TABLE_LANGUAGES;   // "sites_multilingual_languages"

// var VALID_FORMATS = LabelExportCMD.VALID_FORMATS;

module.exports = Resource;



Resource.help = function () {

    var exTemplate = [
        '        <cyan><!-- ',
        '        #  Appdev Label Info:',
        '        #label_context:</cyan><green>[context]</green><cyan>',
        '        #language_code:</cyan><green>[code]</green><cyan>',
        '        --></cyan>'
    ].join('\n');

    this.showMoreHelp({
        commandFormat: 'appdev labelsFromTemplate <green>[path/to/file] [context:[label_context]] [lang:[code]] [populate]</green>',
        description: [
            'This command imports all the multilingual labels that are embedded in a template file.',
            '',
            '    The template file can specify a context & lang option internally, but any values provided on the command line will overwrite those.',
            '',
            '    You can specify the label info in the template file like this:',
            exTemplate,
            '',
            '    Labels in the template are marked with an HTML attribute: <yellow>app-label-key="[label_key]"</yellow>',
            '    Typically the contents of the dom object is used as the <green>label_label</green> value: ',
            '        <cyan><span</cyan> <yellow>app-label-key="Instructions"</yellow><cyan>></cyan><green>Instructions</green><cyan></span></cyan>'
        ].join('\n'),
        parameters: [
            '<green>[path/to/file]</green>       :   the relative path to your template file',
            '<green>[context:[context]]</green>  :   <green>(optional)</green> the label context for the imported labels',
            '<green>[lang:[code]]</green>        :   <green>(optional)</green> what language_code these labels are for.',
            '<green>[populate]</green>           :   <green>(optional)</green> populate entries for the additional language options as well.'
        ],

        examples: [
            '> appdev labelsFromTemplate  assets/[application]/mockup.html',
            '    // <green>reads:</green> assets/[application]/mockup.html ',
            '    // <green>imports:</green> any labels defined with html attribute <yellow>app-label-key</yellow>',
            '',
            '',
        ]
    });

}



//This is the function that the process starts with.
Resource.perform = function () {
    util = this.adg;
    var _this = this;


    AD.log('Label Import From Template ...');
    util.debug('labelImportFromTemplate.perform():  params ');
    util.debug(this.params);


    // parse Options
    this.parseOptions();
    // this.toRoot();
    this.loadADN(process.cwd());

    util.debug('the provided cmd line options:');
    util.debug(this.options);


    // define the series of methods to call for this process
    var processSteps = [
    // 'checkLocation',   // should be in an application
        'checkDBSettings', // do we know how to connect to the DB
        'loadDBConn',      // create our DB connection
        'getLanguages',    // get list of all languages
        'verifyParams',    // initialize the input variables
        'importTemplate',  // import the template file
        'loadData',        // parse the given Template using jQuery to pull out label keys:
        'importLabels',    // now save these labels into the DB:
        'otherLanguages'   // now make sure other language versions of these labels are entered.
    ];


    this.methodStack(processSteps, function () {

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
Resource.error = LabelCMD.error;                    // common error handler ( db.end() )
Resource.exit = LabelCMD.exit;




Resource.verifyParams = function (done) {
    var self = this;

    // <[dir:[path/to/file]] [format:[type]]
    this.templatePath = this.options.template || '???';
    this.label_context = '';
    this.language_code = '';
    this.populate = false;      // default


    if (this.templatePath == '???') {
        this.exit([
            '',
            '> appdev labelsFromTemplate <red>[path/to/file]</red>',
            '',
            '  <red><bold>[path/to/file]</bold></red> is required.',
            ''
        ], 1);
    }

    var allowedKeys = ['context', 'lang', 'populate'];

    // now override any settings present on our options:

    if (this.options.options) {

        this.options.options.forEach(function (option) {


            var parts = option.split(':');
            var key = parts[0].toLowerCase();


            // this has to be one of our expected parameters:
            if (_.indexOf(allowedKeys, key) != -1) {

                // check the dir parameter:
                switch (key) {

                    case 'context':
                        if (parts[1]) {
                            self.label_context = parts[1];
                        }
                        break;


                    case 'lang':
                        if (parts[1]) {
                            self.language_code = parts[1];
                        }
                        break;

                    case 'populate':
                        self.populate = true;
                        break;
                }

            }

        })
    }

    if (this.label_context) AD.log('... label_context:<yellow>' + this.label_context + '</yellow>');
    if (this.language_code) AD.log('... language_code:<yellow>' + this.language_code + '</yellow>');
    if (this.populate) AD.log('... populate other languages: <yellow> true </yellow>');

    done();
}





Resource.importTemplate = function (done) {
    // find the provided template and store it as this.templateContents.


    var self = this;
    // this.files = [];  // initialized in validateParams();


    var filePath = path.resolve(process.cwd(), this.templatePath);
    if (fileOK(filePath)) {

        this.templateContents = fs.readFileSync(filePath, { encoding: 'utf8' });

        if (this.label_context == '') {

            var res, regexp = /\#label_context:(.+)/;
            res = regexp.exec(this.templateContents);

            if ((res) && (res.length)) {
                this.label_context = res[1];
                AD.log("... template.context:<yellow>" + this.label_context + '</yellow>');
            }
        }

        if (this.language_code == '') {

            var res, regexp = /\#language_code:(.+)/;
            res = regexp.exec(this.templateContents);

            if ((res) && (res.length)) {
                this.language_code = res[1];
                AD.log("... template.code:<yellow>" + this.language_code + '</yellow>');
            }
        }

    }

    done();


}



var fileOK = function (filePath, format) {
    // @param {string} filePath  the relative dir to the file
    // @param {string} format    (optional) file ext (.html, .ejs, etc...) 
    // @return {bool} 

    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
        if (fs.existsSync(filePath)) {
            if (format) {
                // if a format is given, then filePath must contain format
                if (filePath.indexOf(format) != -1) {
                    return true;
                }
            } else {
                return true;
            }

        }
    }

    return false;
}





var trim = function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

Resource.loadData = function (done) {
    // ok, read in the labels

    var self = this;

    this.labelData = [];
    var checkHash = {};

    var cheerio = require('cheerio');

    var $ = cheerio.load(this.templateContents);

    // Now to process the Template DOM using jQuery:

    AD.log('... processing template');

    // find everything with an attribute: app-label-key
    var listLabels = $("[app-label-key]");
    listLabels.each(function (i, el) {
        var $el = $(el);

        // pull the Key and Text
        var theKey = $el.attr('app-label-key');
        var theStr = trim($el.text());

        // package together a label object
        var obj = {
            label_context: self.label_context,
            language_code: self.language_code,
            label_key: theKey, 
            // label_lastMod: new Date(),
            label_needs_translation: '0',
            label_label: theStr
        };


        if (!checkHash[theKey]) {
            checkHash[theKey] = obj;
            self.labelData.push(obj);
        } else {

            if (checkHash[theKey].label_label != theStr) {
                AD.log('<yellow>*** warn:</yellow> duplicate key defined (key[<yellow>' + theKey + '</yellow>] label[<yellow>' + theStr + '</yellow>])');
            }
        }

                
        // AD.log('... found key:'+ theKey+'  label:'+theStr );

                

        if (i == (listLabels.length - 1)) {

            AD.log();
            AD.log();
            done();
        }

    });

}




/*  Reuse the labelImport command's importLables  */

Resource.importLabels = LabelImportCMD.importLabels;      // process all the this.listLabels 


Resource.otherLanguages = function (done) {
    var _this = this;

    // if we are to include other languages definitions too
    if (this.populate) {


        var numDone = 0;

        // make a copy of our label data
        var origLabels = this.labelData;
        var origCode = origLabels[0].language_code;

        var languages = _.cloneDeep(this.languages);

        // recursive routine to process a language option:
        var processLanguage = function () {


            if (languages.length == 0) {
                done();
            } else {


                var langObj = languages.shift();


                // if not the current language we just imported
                var langCode = langObj.language_code;
                if (langCode != origCode) {

                    AD.log();
                    AD.log('... populate language: ' + langCode);
                    AD.log();

                    // generate a new set of labels with this language code tag
                    var newSet = _.cloneDeep(origLabels);
                    newSet.forEach(function (label) {
                        label.language_code = langCode;
                        label.label_label = '[' + langCode + ']' + label.label_label;
                        label.label_needs_translation = 1;
                        delete label.id;
                    })


                    _this.labelData = newSet;

                    // call to importLabels again with new setup
                    _this.importLabels(function () {

                        // process the next language entry.
                        processLanguage();

                    })

                } else {

                    // process the next language entry
                    processLanguage();
                } // end if

            }
        };
        processLanguage();  // kick it off!


    } else {
        done();
    }
}

