
var fs = require('fs');
var path = require('path');

var util = null;
var AD = require('ad-utils');


var Generator = require('./class_generator.js');

var Resource = new Generator({
    skipAutoRegister:true,
    key:'help',
    command:'d default [key] [value]',
    commandHelp: 'see further instructions on a command: appdev help [command] ',
    parameters:['commandName']
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev help [commandName]',
        parameters:[
            '[commandName]  :   any of the available commands known by the appdev utility.'
        ],

        examples:[
            '> appdev help help'
        ]
    });

}



Resource.perform = function ( objGenerators ) {
    util = this.adg;
    var self = this;

    // parse Options
    this.parseOptions();
    
    var listGenerators = objGenerators.generators();
    if (listGenerators[this.options.commandName]) {

        AD.log( 'showing help for '+this.options.commandName);

        listGenerators[this.options.commandName].help();

    } else {

        AD.log('<yellow><bold>'+ this.options.commandName+'</bold></yellow>  is not a known command... ');

    }

    
}
