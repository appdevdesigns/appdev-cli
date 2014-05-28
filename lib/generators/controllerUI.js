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



    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    this.prepareAppDirectory(this.templateData.appName);
/*
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
*/


    util.debug('templateData:');
    util.debug(this.templateData);


};


/*
ControllerUI.postTemplates = function() {

    var self = this;

    // have SailsJS now create the Model:
    // command:  sails generate model [ModelName] field1 ...

    var params = this.options.field;
    params.unshift(this.options.resource);
    params.unshift('model');
    params.unshift('generate');

    this.shell('sails', params, ['warn'], function() {
        var params = [];

        // sails generate controller [ControllerName]
        params.unshift(self.options.resource);
        params.unshift('controller');
        params.unshift('generate');

        self.shell('sails', params, ['warn']);

    });

}
*/

