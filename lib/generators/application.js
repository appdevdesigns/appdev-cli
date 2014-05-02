
var Generator = require('./class_generator.js');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');



var Resource = new Generator({
    key:'application',
    command:'a application [name]',
    commandHelp: 'Generate an initial application structure',
    parameters:['name'],
    newText:'Creating a new app ...'
});


module.exports = Resource;



Resource.prepareTemplateData = function () {

    this.templateData = {};

    // looks like "name" is all we need to know about a new
    // application
    this.templateData.name = this.options.name || '??';


    // default controller name should be == application name:
    var parts = this.templateData.name.split(path.sep);
    this.templateData.defaultController = parts.pop();


    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    var partsAppName = this.templateData.name.split(path.sep);
    partsAppName.pop(); // remove the last dirName since it's created later

    var currDir = "";
    partsAppName.forEach(function(pathStep){ 

        if (currDir != '') {
            currDir += path.sep;
        }
        currDir += pathStep;
        var checkPath = path.join('assets',currDir);

        // if this directory doesn't exist, create it.
        if (!fs.existsSync(checkPath)) {
            AD.log('<green><bold>prep-created:</bold>'
                + checkPath
                + '</green>');
            fs.mkdirSync(checkPath);
        }
    });

};


Resource.postTemplates = function() {

    var remainingSteps= [
            'createController'    // create a default app controller
       ];



    this.methodStack(remainingSteps, function() {

        // when they are all done:

        AD.log();
        AD.log('<yellow>> created a new application.</yellow>');
        AD.log();

    });

};



Resource.createController = function( done ) {
    // now create the default controller for the application
    var params = [ 'cui',  this.templateData.name, this.templateData.defaultController];


    this.shell('appdev', params, ['Creating'], function(){
        if (done) done();
    });
};


