
var Generator = require('./class_generator.js');

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

}


