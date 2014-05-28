
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


    // our tests/test-all.html  needs the proper path to our sails/root
    // this is determined by how many seperators in our name:
    var pathParts  = this.templateData.name.split(path.sep);
    var pathAdj = '';
    pathParts.forEach(function(part){
        if (pathAdj != '') pathAdj+='/';
        pathAdj += '..';
    });
    this.templateData.pathAdj = pathAdj;


    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    this.prepareAppDirectory(this.templateData.name);
/*
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
*/

};


Resource.postTemplates = function() {

    var remainingSteps= [
            'addUnitTest',        // run this application's unit tests
            'createController'    // create a default app controller
       ];



    this.methodStack(remainingSteps, function() {

        // when they are all done:

        AD.log();
        AD.log('<yellow>> created a new application.</yellow>');
        AD.log();

    });

};



Resource.addUnitTest = function( done ) {

    // Add to our base Makefile, a reference to this application's new unit test directory

    var tag = ".PHONY: test";

    var replace = [
        '	@NODE_ENV=test mocha-phantomjs \\',
        '    -R $(REPORTER) \\',
        '    assets/'+this.templateData.name+'/tests/test-all.html ',
        '',
        tag
     ].join('\n');


    var patchSet = [
                     {  file:path.join('Makefile'), tag:tag, replace: replace  },
                   ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });
};



Resource.createController = function( done ) {
    // now create the default controller for the application
    var params = [ 'cui',  this.templateData.name, this.templateData.defaultController];


    this.shell('appdev', params, ['Creating'], function(){
        if (done) done();
    });
};


