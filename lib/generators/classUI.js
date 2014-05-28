var path = require('path');
var fs = require('fs');
var AD = require('ad-utils');

var Generator = require('./class_generator.js');

var ClassUI = new Generator({
    key:'classUI',
    command:'cui classUI [application] [name] ',
    commandHelp: 'Generate a UI Class object',
    parameters:['application','name'],
    newText:'Creating a new client side class ...'
});


module.exports = ClassUI;

var util = null;

ClassUI.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ClassName = this.options.name || '?nameNotFound?';

    // make sure there is not file extension on the end of the ClassName
    if ( this.templateData.ClassName.indexOf('.js') != -1) {
        var parts = this.templateData.ClassName.split('.');
        this.templateData.ClassName = parts[0];
    }


    // make sure appName has any platform specific path separators used
    this.templateData.appName =
        this.pathProperSeparators( this.templateData.appName );


    // convert appName into an object's namespace for the controller:
    this.templateData.appNameSpace
        = this.templateData.appName.split(path.sep).join('.');


    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    var partsAppName = this.templateData.appName.split(path.sep);
    partsAppName.pop(); // remove the last dirName since it's created later
    var currDir = "";
    for(var p=0; p<partsAppName.length; p++) {
        if (currDir != '') {
            currDir += path.sep;
        }
        currDir += partsAppName[p];
        var checkPath = path.join('assets',currDir);

        // if this directory doesn't exist, create it.
        if (!fs.existsSync(checkPath)) {
            util.log('<green><bold>prep-created:</bold>'
                + checkPath
                + '</green>');
            fs.mkdirSync(checkPath);
        }
    }

    util.debug('templateData:');
    util.debug(this.templateData);


};



ClassUI.postTemplates = function() {

    var remainingSteps= [
            'addUnitTest'        // add a unit test stub for this class
       ];



    this.methodStack(remainingSteps, function() {

        // when they are all done:

        AD.log();
        AD.log('<yellow>> created a new application.</yellow>');
        AD.log();

    });

};



ClassUI.addUnitTest = function( done ) {

    // Add to our base Makefile, a reference to this application's new unit test directory

    var tag = "// load our tests here";

    var replace = [
        tag,
        '        "'+this.templateData.appName+'/tests/class_'+this.templateData.ClassName+'.js",'
     ].join('\n');


    var patchSet = [
                     {  file:path.join('assets', this.templateData.appName, 'tests','test_all_loader.js'), tag:tag, replace: replace  },
                   ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });
};


