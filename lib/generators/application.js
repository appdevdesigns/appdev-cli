
var Generator = require('./class_generator.js');
var path = require('path');
var util = null;


var Resource = new Generator({
    key:'application',
    command:'a application [name]',
    commandHelp: 'Generate an initial application structure',
    parameters:['name'],
    newText:'Creating a new app ...'
});


module.exports = Resource;



Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};

    // looks like "name" is all we need to know about a new
    // application
    this.templateData.name = this.options.name || '??';


    // default controller name should be == application name:
    var parts = this.templateData.name.split(path.sep);
    this.templateData.defaultController = parts.pop();

};


Resource.postTemplates = function() {

    var remainingSteps= [
            'createController'    // create a default app controller
       ];



    this.methodStack(remainingSteps, function() {

        // when they are all done:

        util.log();
        util.log('<yellow>> created a new application.</yellow>');
        util.log();

    });

};



Resource.createController = function( done ) {
    // now create the default controller for the application
    var params = [ 'cui',  this.templateData.name, this.templateData.defaultController];


    this.shell('appdev', params, ['Creating'], function(){
        if (done) done();
    });
};


