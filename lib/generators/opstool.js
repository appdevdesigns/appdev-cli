
var Generator = require('./class_generator.js');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');



var Resource = new Generator({
    key:'opstool',
    command:'opstool [name]',
    commandHelp: 'Generate an initial opstool structure',
    parameters:['name'],
    newText:'Creating a new opstool ...'
});


module.exports = Resource;



Resource.prepareTemplateData = function () {

    this.templateData = {};

    // looks like "name" is all we need to know about a new
    // opstool
    this.templateData.name = this.options.name || '??';


    // name:  the opstool name:  [MPDReports]



    // default controller name should be == application name:
    var parts = this.templateData.name.split(path.sep);

    if (parts.length > 1) {
        AD.log();
        AD.log.error('name should not be a path: '+name);
        AD.log();
        process.exit(1);
    }

    this.templateData.ControllerName = parts.pop();

    this.templateData.appNameSpace = 'opstools.'+this.templateData.name;



};


Resource.postTemplates = function() {


    // when they are all done:

    AD.log();
    AD.log('<yellow>> opstool <bold>'+this.options.name+'</bold> created.</yellow>');
    AD.log();

};




