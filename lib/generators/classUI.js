var path = require('path');
var fs = require('fs');
var AD = require('ad-utils');

var Generator = require('./class_generator.js');

var ClassUI = new Generator({
    key:'classUI',
    command:'clui classUI [application] [name] ',
    commandHelp: 'Generate a UI Class object',
    parameters:['application','name'],
    newText:'Creating a new client side class ...'
});


module.exports = ClassUI;



ClassUI.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev classUI <yellow><bold>[application] [name]</bold></yellow>',
        description:[ 
            'This command generates a new Class stub for your client side [application].',
            '',
            '    The Class object is stored in '+path.join('assets', '[application]', 'classes', '[name]'),
            ''

        ].join('\n'),
        parameters:[
            '<yellow>[application]</yellow>         :   the name of the client side application to create a class in.',
            '<yellow>[name]</yellow>                :   the name of the class object to create.'
        ],

        examples:[
            '> appdev classUI newSailsApp myClass',
            '    // creates '+path.join('assets', 'newSailsApp', 'classes', 'myClass.js')+' class definition ',
            '',
            '> appdev classUI opstool/App myClass',
            '    // creates '+path.join('assets', 'opstool', 'App', 'classes', 'myClass.js')+' class definition ',
            '',
        ]
    });

}

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
    this.prepareAppDirectory(this.templateData.appName);


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

    // Add to our base test_all_loader.js, a reference to this class's new unit test

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


