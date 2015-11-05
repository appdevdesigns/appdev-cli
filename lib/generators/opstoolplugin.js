
var Generator = require('./class_generator.js');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');
var _ = require('lodash-node');



var Resource = new Generator({
    key:'opstoolplugin',
    command:'opstoolplugin [name]',
    commandHelp: 'Generate an opstool plugin npm package',
    parameters:['name'],
    newText:'Creating a new opstool plugin ...',
    usesTemplates:false,
    atRoot: false       // do not force operation from root.
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev opstoolplugin <yellow><bold>[name]</bold></yellow>',
        description:[ 
            'This command creates a new opstool plugin in the current directory.',
            '',
            '    It is expected to be run from your '+path.join('sails', 'node_modules')+' directory'

        ].join('\n'),
        parameters:[
            '<yellow>[name]</yellow>         :   the name of the plugin to create.'
        ],

        examples:[
            '> appdev opstoolplugin newWidget',
            '    // creates /newWidget plugin ',
            '    //     in your current directory',
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


};


Resource.postTemplates = function() {


        // define the series of methods to call for the setup process
        var processSteps = [
                        'makePlugin',
                        'makeOpsTool',
                        'patchConfig',
                        'runSetup'
        ];


        this.methodStack(processSteps, function() {

            // when they are all done:

            AD.log();
            AD.log('opstool plugin created.');
            AD.log();
            process.exit(0);
        });

};



Resource.makePlugin = function(done) {

    // call the appdev plugin [name] command:
    AD.spawn.command({
        command:'appdev',
        options: ['plugin', this.options.name ],
        shouldEcho:true,
        exitTrigger:'finished creating',
        shouldPipe:true
    })
    .fail(function(err){
        AD.log.error('Error creating plugin ');
        process.exit(1);
    })
    .then(function(data){

        done();
    });
};



Resource.makeOpsTool = function(done) {
    var cwd = process.cwd();

    process.chdir(this.options.name);

    var OpsToolName = this.options.name;

    // we are specifying several naming conventions:
    //   [application]-[tool]
    //   opstool-[application]-[tool]
    //
    // if they use one of those formats, then do a little modifying of the client side Tool name:
    //
    var parts = this.options.name.split('-');
    if (parts.length>1) {

        // if we have 'opstool-*'
        if (parts[0].indexOf('opstool') != -1 ) {
            // then remove the 'opstool' parameter.
            parts.shift();
        }

        // now uppercase the remaining parts and return as: [Application][Tool]
        OpsToolName = _.map(parts, function(name) { return AD.util.string.uCase(name);}).join('');
    }

    // save this for later
    this.options.OpsToolName = OpsToolName;

    AD.spawn.command({
        command:'appdev',
        options:['opstool', OpsToolName ],
        shouldEcho:true,
        exitTrigger:' created.'
    })
    .fail(function(err){
        AD.log.error('Error creating assets/opstool/'+this.options.name);
        process.exit(1);
    })
    .then(function(data){
        process.chdir(cwd);
        done();
    });
}



Resource.patchConfig = function(done) {

    var OpsToolName = this.options.OpsToolName;

    var patchSet = [
        {
            file: path.join('..', 'config', 'opsportal.js'),
            tag: /areas.*\[/,
            replace: [ 
                "areas: [",
                "",
                "",
                "    ////",
                "    //// New OpsTool: "+OpsToolName,
                "    //// ",
                "    {",
                "        // Define the Area for "+OpsToolName,
                "        icon:'fa-cogs',",
                "        key:'"+OpsToolName+"',",
                "        label:'"+OpsToolName+"',",
                "        tools:[{",
                "            // "+OpsToolName+" Tool",
                "            controller:'"+OpsToolName+"',",
                "            label:'"+OpsToolName+"',",
                "            isDefault: true,",
                "            permissions:[",
                "                'adcore.admin'",
                "                , 'adcore.developer'",
                "            ]",
                "          }",
                "        ]",
                "    },"
            ].join('\n')

        }

    ];
    this.patchFile(patchSet, function() {
        done();
    });

}



Resource.runSetup = function(done) {

    var cwd = process.cwd();

    // move to our setup routine
    process.chdir(this.options.name);


    AD.spawn.command({
        command:'node',
        options:[path.join('setup', 'setup.js') ],
        shouldEcho:true,
        exitTrigger:' created.'
    })
    .fail(function(err){
        AD.log.error('Error running setup routine! ', err);
        process.exit(1);
    })
    .then(function(data){
        process.chdir(cwd);
        done();
    });


}



