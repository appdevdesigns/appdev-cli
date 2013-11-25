
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



    util.debug('templateData:');
    util.debug(this.templateData);


}


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

