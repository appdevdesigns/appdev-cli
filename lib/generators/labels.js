
var fs = require('fs');
var path = require('path');
var mysql = require('mysql');

var util = null;

var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'labels',
    command:'l labels [application] [key] [langCode] [label]',
    commandHelp: 'create label for the system',
    parameters:['applicationName', 'key', 'langCode', 'labelName']
});


module.exports = Resource;



Resource.perform = function () {
    util = this.adg;
    var self = this;

    util.log( 'Creating label for system ');
    util.debug('label.perform():  params ');
    util.debug(this.params);


    // parse Options
    this.parseOptions();

    util.debug('the provided cmd line options:');
    util.debug(this.options);
	
	if (this.options.applicationName) {

        // if directory ! exist
        if (fs.existsSync(this.options.applicationName)) {
			var config = require(path.join(process.cwd(), 'config/local.js'));
			
			if (config.adapters) {
			
				if (config.adapters.mysql) {
				
					var db = mysql.createConnection(config.adapters.mysql);
					db.connect();
				}
				
			}
			
		}
	}

}
