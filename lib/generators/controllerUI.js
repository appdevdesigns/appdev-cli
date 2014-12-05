var path = require('path');
var fs = require('fs');

var Generator = require('./class_generator.js');

var ControllerUI = new Generator({
    key:'controllerUI',
    command:'cui controllerUI [application] [name] ',
    commandHelp: 'Generate a UI Controller',
    parameters:['application','name'],
    newText:'Creating a new client side controller ...'
});


module.exports = ControllerUI;

var util = null;



ControllerUI.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev controllerUI <yellow><bold>[application] [name]</bold></yellow>',
        description:[ 
            'This command generates a new UI Controller stub for your client side [application].',
            '',
            '    The Controller object is stored in '+path.join('assets', '[application]', 'controllers', '[name]'),
            ''

        ].join('\n'),
        parameters:[
            '<yellow>[application]</yellow>  :   the name/path of the UI application. ',
            '<yellow>[name]</yellow>         :   the name of the controller to create.'
        ],

        examples:[
            '> appdev controllerUI myApp  newController',
            '    // creates /assets/myApp/controllers/newController.js',
            '    // creates /assets/myApp/views/newController/newController.ejs',
            '',
            '> appdev controllerUI opstool/myTool newController',
            '    // creates /assets/opstool/myTool/controllers/newController.js',
            '    // creates /assets/opstool/myTool/views/newController/newController.ejs'
        ]
    });

}


ControllerUI.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ControllerName = this.options.name || '?resourceNotFound?';

    // make sure there is not file extension on the end of the ControllerName
    if ( this.templateData.ControllerName.indexOf('.js') != -1) {
        var parts = this.templateData.ControllerName.split('.');
        this.templateData.ControllerName = parts[0];
    }


    // make sure appName has any platform specific path separators used
    this.templateData.appName =
        this.pathProperSeparators( this.templateData.appName );


    // convert appName into an object's namespace for the controller:
    this.templateData.appNameSpace
        = this.templateData.appName.split(path.sep).join('.');


    // make sure correctControllerName is properly defined.  It should be: 
    // appNameSpace.ControllerName but if appNameSpace is '', then it is
    // just ControllerName.
    var correctControllerName = this.templateData.appNameSpace;
    if (correctControllerName != '') correctControllerName += '.';
    correctControllerName = this.templateData.ControllerName;
    this.templateData.correctControllerName = correctControllerName;



    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    this.prepareAppDirectory(this.templateData.appName);


    util.debug('templateData:');
    util.debug(this.templateData);


};



ControllerUI.postTemplates = function() {

    var self = this;


    // define the series of methods to call for the setup process
    var processSteps = [
                    'addUnitTest'
    ];


    this.methodStack(processSteps, function() {

        // when they are all done:

        util.log();
        util.log('> controller created.');
        util.log();
        process.exit(0);
    });

}





ControllerUI.addUnitTest = function( done ) {

    // Add to our base test_all_loader.js, a reference to this class's new unit test

    var tag = "// load our tests here";

    var replace = [
        tag,
        '        "'+this.templateData.appName+'/tests/controller_'+this.templateData.ControllerName+'.js",'
     ].join('\n');


    var patchSet = [
                     {  file:path.join('assets', this.templateData.appName, 'tests','test_all_loader.js'), tag:tag, replace: replace  },
                   ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });
};


