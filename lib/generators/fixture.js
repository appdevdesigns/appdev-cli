
var Generator = require('./class_generator.js');

var path = require('path');

var Resource = new Generator({
    key:'fixture',
    command:'f fixture [application] [name] [field1] ... [fieldN]',
    commandHelp: 'Generate a fixture for initial development',
    parameters:['application','resource', '[field]'],
    newText:'Creating a new fixture ...'
});


module.exports = Resource;

var util = null;

Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ModelName = this.options.resource || '?resourceNotFound?';
    this.templateData.modelname = this.templateData.ModelName.toLowerCase();
    this.templateData.fields = this.options.field; //[];
    this.templateData.arrayFields = [];


    for(var f in this.options.field) {

        // fields can be specified as:
        //  field
        //  field:type
        //  field:type:[multilingual|label]
        //  field:type:[multilingual|label]:[multilingual|label]

        var token = this.options.field[f];
        var parts = token.split(':');
        var field = parts[0];


        // store for our sailsJS field list:
        this.templateData.arrayFields.push(field);

    }




    util.debug('templateData:');
    util.debug(this.templateData);


};




Resource.postTemplates = function() {

    var self = this;

    // reuse the appdev resource command to generate our model/controller
    // command:  appdev resource [application] [resource] field1 ...

    var params = this.options.field;
    params.unshift(this.options.resource);
    params.unshift(this.options.application);
    params.unshift('resource');

    this.shell('appdev', params, ['warn'], function shellDone() {

        // now patch the controller to include fixture data
        var patchSet = [ {  file:path.join('api', 'controllers', self.options.resource + 'Controller.js'), tag:"_config: {}", template:'__fixture_data.ejs', data:{ fields:self.templateData.arrayFields} }
                       ];
        self.patchFile( patchSet, function allDone() {
            // now we are done!
            util.log();
            util.log('<yellow><bold>Done!</bold></yellow>');
            util.log('> You can access this service at:<green><bold>GET /'+self.templateData.modelname+'</bold></green>');
            util.log();

        });

    });

};


