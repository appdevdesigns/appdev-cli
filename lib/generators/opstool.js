
var Generator = require('./class_generator.js');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');



var Resource = new Generator({
    key:'opstool',
    command:'opstool [name]',
    commandHelp: 'Generate an initial opstool structure (client side)',
    parameters:['name'],
    newText:'Creating a new opstool ...'
});


module.exports = Resource;






Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev opstool <yellow><bold>[name]</bold></yellow>',
        description:[ 
            'This command creates a new client side opstool plugin in the current project.',
            '    It is expected to be run from either your sails root directory, or from ',
            '    an opstool plugin directory.',
            '',
            '    One plugin can have several client side resources installed.'

        ].join('\n'),
        parameters:[
            '<yellow>[name]</yellow>         :   the name of the plugin to create.'
        ],

        examples:[
            '> appdev opstool newWidget',
            '    // creates '+path.join('assets','opstools', '[name]') +' plugin ',
            '    //     in your current project',
            '',
        ]
    });

}


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




