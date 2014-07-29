
var fs = require('fs');
var path = require('path');

var util = null;

var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'default',
    command:'d default [key] [value]',
    commandHelp: 'set the default ',
    parameters:['keyName', 'valueName']
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev default <yellow><bold>[key] [value]</bold></yellow>',
        description:[ 
            'This command saves given [key] : [value] pairs in your local project\'s .adn file.',
            '',
            '    This command is primarily used by other appdev commands to store important configuration data,',
            '    last used commands, etc... ',
            '',
            '    appdev default [key]         :  show the value for a given [key]',
            '    appdev default [key] [value] :  sets the value for a given [key]',
            ''

        ].join('\n'),
        parameters:[
            '<yellow>[key]</yellow>         :   the unique key to store/retrieve values.',
            '<yellow>[value]</yellow>       :   your value for the [key].'
        ],

        examples:[
            '> appdev defaults db_user root',
            '    // sets the db_user = "root" ',
            '',
            '> appdev defaults db_user',
            '    // prints the current value for db_user ',
            '',
        ]
    });

}



Resource.perform = function () {
    util = this.adg;
    var self = this;

    // parse Options
    this.parseOptions();
	
	util.log( 'Setting the default value for '+this.options.keyName);
    util.debug('default.perform():  params ');
    util.debug(this.params);

    util.debug('the provided cmd line options:');
    util.debug(this.options);
	
	this.options.valueName = this.options.valueName || null;
	
	if (this.options.keyName) {
		this.toRoot();
		value = this.defaults(this.options.keyName,this.options.valueName);
		if (typeof value != 'undefined') {
			util.log();
			util.log('The key ' + this.options.keyName + ' is set to ' + value);
			util.log();
		}else{
			util.log();
			util.log('The key ' + this.options.keyName + ' is not a valid key');
			util.log();
		}
	}else{
		util.log();
        util.log('<red>You must have a key and value to set a default value.</red>');
        util.log();
        util.log('<yellow>Enter the following command to set a default: appdev default [key] [value]</yellow>')
        util.log();
        process.exit(1);
	}

}
