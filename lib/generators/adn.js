
var Generator = require('./class_generator.js');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');



var Command = new Generator({
    key:'adn',
    command:'adn',
    commandHelp: 'Generate an appdev config file (.adn) in your current directory.',
    parameters:[''],
    newText:'Creating appdev config file ...',
    atRoot:false    // don't operate from the root directory!
});


module.exports = Command;



Command.help = function() {

    this.showMoreHelp(    {
        commandFormat:'<yellow><bold>appdev adn </bold></yellow>',
        description:[ 
            'This command generates an appdev config file (.adn) in your current directory.',
            '',
            '    The .adn file is used by appdev commands to determine an appropriate root',
            '    directory from which to run create our resources from.',
            '',
            '    The .adn file also contains default values stored for our commands.'

        ].join('\n'),
        // parameters:[
        // ],

        examples:[
            '> appdev adn',
            '    // <green><bold>creates:</bold></green> .adn file in your current directory '
        ]
    });

}




Command.prepareTemplateData = function () {

    this.templateData = {};

    // no parameters so nothing to do actually

};


Command.postTemplates = function() {


    // our template copying step does all the work!

    AD.log();
    AD.log('<yellow>> done.</yellow>');
    AD.log();



};




