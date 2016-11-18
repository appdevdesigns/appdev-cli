
var Generator = require('./class_generator.js');

var path = require('path');
var fs = require('fs');

var NO_DB_SPECIFIED = 'NO_DB_SPECIFIED';

var Resource = new Generator({
    key:'table2model',
    command:'table2model [application] [table] [modelName] [db:[dbname]]',
    commandHelp: 'Generate a Resource from a DB Table',
    parameters:['application', 'table','resource', '[options]'],
    newText:'Reading Table Info ...',
    usesTemplates:false
});


module.exports = Resource;

var util = null;
var AD = require('ad-utils');



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev table2model <yellow><bold>[application] [table] [modelName]</bold></yellow> <green>[db:[dbname]] [connection:[name]]</green>',
        description:[ 
            'This command creates a new Model definition from an existing table in the database.',
            '',
            '     If the table is in a database other than the site default, add <green>db:[dbname]</green> to the command.'

        ].join('\n'),
        parameters:[
            '<yellow>[application]</yellow>         :   the client side application (directory) to place the',
            '                          client side model definition.',
            '<yellow>[table]</yellow>               :   the db table name to read from',
            '<yellow>[modelName]</yellow>           :   the name of the server side Model',
            '<green>[db:[dbname]]</green>         :   <green>(optional)</green> the name of the db to read from',
            '<green>[connection:[name]]</green>   :   <green>(optional)</green> the name of the adapter connection to use (default:\'appdev_default\')'
        ],

        examples:[
            '> appdev table2model myApplication spiffy_table SpiffyTable ',
            '    // <green>reads:</green> in [defaultDB].spiffy_table  information',
            '    // <green>creates:</green> '+path.join('assets','myApplication', 'models', 'SpiffyTable.js')+' client side model ',
            '    // <green>creates:</green> '+path.join('api', 'models', 'SpiffyTable.js')+' server side model',
            ''
        ]
    });

}


Resource.prepareTemplateData = function () {
    util = this.adg;
    var self = this;

    this.templateData = {};
    this.templateData.table = this.options.table || '?tableNotFound?';
    this.templateData.resource = this.options.resource || '?modelNotFound?';
    this.templateData.application = this.options.application || '?applicationNotFound?';
    this.templateData.fields = [];

    this.templateData.db = null;
    this.templateData.connection = null;


    ////
    //// check if required parameters seem right:
    ////
    var checkTheseFields = ['application', 'table', 'resource'];
   
    var quitOut = function(fieldName, log) {
        AD.log();
        AD.log('Required Fields:');
        checkTheseFields.forEach(function(field){

            if (field != fieldName) {
                AD.log('    <green>'+field+':</green> '+self.templateData[field]);
            } else {
                AD.log('    <red><bold>'+field+':</bold></red> '+self.templateData[field]);
            }
        
        })
        AD.log();
        AD.log(log);
        AD.log();
        process.exit(1);
    }

    var checkField = function(fieldName) {
        if (self.templateData[fieldName].indexOf('NotFound?') != -1) {
            quitOut(fieldName, '<red><bold>error:</bold></red> no '+fieldName+' info provided.');
        }
        if (self.templateData[fieldName].split(':').length > 1) {
            quitOut(fieldName, '<red><bold>error:</bold></red> '+fieldName+' info doesn\'t seem right: '+self.templateData[fieldName]);
        }
    }
    checkTheseFields.forEach(function(field){
        checkField(field);
    });
    


    ////
    //// Now continue parsing the remaining options
    ////

    for (var o=0; o<this.options.options.length; o++) {
        var opt = this.options.options[o];

        var parts = opt.split(':');
// AD.log('opt:'+opt);
        switch( parts[0]) {
            case 'db':
// AD.log('  -> db : ');

                this.templateData.db = parts[1] || NO_DB_SPECIFIED;
// AD.log('  -> '+this.templateData.db);
                break;
            case 'connection':
// AD.log('  -> connection:');
                this.templateData.connection = parts[1] ? parts[1] : null;
// AD.log('  -> '+ this.templateData.connection);
                break;
        }
    }



    util.debug('templateData:');
    util.debug(this.templateData);


};





Resource.postTemplates = function() {

//    var self = this;

    // use the provided connection
    var adapter = this.templateData.connection;

    // if connection not provided, then use the default connection
    if (adapter == null) adapter = this.defaults('connection');

    // if no default set, then just use 'appdev_default' (an AppDev default)
    if (typeof adapter == 'undefined') adapter = 'appdev_default';


    // open the config data and pull the adapter info for this adapter:
    this.config = loadConnectionInfo(adapter); 

    if (this.config) {

        // make sure our connection is properly set.
        if (this.templateData.connection == null) {
            this.templateData.connection = adapter;  
        }

        // we have a valid connection for the given adapter.
        // let's try to see if we can find out what kind of connection it is:

        var adapterType = '???';
        var module = this.config.adapter  || 'no adapter defined';

        if (module.indexOf('memory') != -1) adapterType = 'memory';
        if (module.indexOf('mysql') != -1) adapterType = 'mysql';
        if (module.indexOf('posgres') != -1) adapterType = 'posgres';


        var methods = [];


        switch (adapterType) {

            case 'memory':

                util.log();
                util.log('<red><bold>error:</bold></red> you\'ve chosen a sails-memory based adaptor.');
                util.log('       <yellow><bold>but</bold></yellow> this command is expecting an SQL based adaptor.');
                util.log();
                util.log('<yellow>make sure to specify a connection that is SQL based.</yellow>');
                util.log();
                util.log('<yellow><bold>eg:</bold></yellow><green>$ appdev default connection mysql</green>');
                util.log();
                process.exit(1);
                break;

            case 'mysql':

                methods.push('processMysql');

                break;

            default:
                util.log();
                util.log('<red>unable to determine adapter from connection['+adapter+'].</red>');
                util.log();
                util.log('<yellow>make sure the connection '+adapter+'.adapter  is set in '+path.join('config', 'local.js')+'</yellow>');
                util.log();
                util.log('<yellow><bold>eg:</bold></yellow><green>$ appdev default connection mysql</green>');
                util.log();
                process.exit(1);
        }


        //
        methods.push('createResource');
        methods.push('patchResource');

        this.methodStack(methods, function() {

            // when they are all done:
            util.log();
            util.log('<green><bold> > Done!</bold></green>');
            util.log();
            process.exit(0);
        });





    } else {

        // couldn't find a definition for adapter in config.connections
        // so warn the user and exit:

        AD.log();
        AD.log.error('<red>unable to find definition for connection.'+adapter+' in '+path.join('config', 'local.js')+'</red>');
        AD.log();
        AD.log('<yellow>specify the correct connection to use on the command:</yellow> <bold> connection:[name]</bold>');
        AD.log();
        AD.log('<yellow>or make sure the connection:"'+adapter+'" setting in your .adn file is correct.</yellow>');
        AD.log();
        AD.log('<yellow><bold>eg:</bold></yellow><green>$ appdev default connection '+adapter+'</green>');
        AD.log();
        process.exit(1);

    }
 

};





Resource.processMysql = function(done) {

    var self = this;

    util.debug();
    util.debug('found config info:');
    util.debug(this.config);


    // now create the mysql DB Connection

    var mysql = require('mysql');

    // override mysql.database setting if an option on cmd line present
    if (this.templateData.db) this.config.database = this.templateData.db;

    var db = mysql.createConnection(this.config);
    db.connect();


    // run mysql describe table command
    var sql = 'DESCRIBE '+this.templateData.table;
    db.query(sql, function(err, rows, fields){

        if (err) {

            if ( err.code == 'ER_NO_SUCH_TABLE') {

                AD.log();
                AD.log.error('Unable to read table <bold>'+self.config.database+'.<green>'+self.templateData.table+'</green></bold>.');
                AD.log();
                process.exit(1);

            } else {

                util.error();
                util.error('error reading table info:');
                util.error(err);
                util.log();
                process.exit(1);

            }


        } else {

            util.debug('rows:');
            util.debug(rows);


            self.templateData.primaryKey = null;

            // compile an array of fields to create:
            self.templateData.fields = [];
            self.templateData.fieldPatches = [];
            rows.forEach(function(row) {
                var type = getType(row.Type);
                var fieldKey = row.Field + ':' + type;

                self.templateData.fields.push(fieldKey);

                if (row.Key == "PRI") {
                    self.templateData.primaryKey = row.Field;
                }

                var patchKey = row.Field + '   : \''+type+"'";

                self.templateData.fieldPatches.push( fieldDetails(row));

            });

            util.debug('fields:');
            util.debug(self.templateData.fields);


            util.debug('fieldPatches:');
            util.debug(self.templateData.fieldPatches);

            util.debug('primaryKey:'+self.templateData.primaryKey);

            if (done) done();
        }

    });

    db.end();


};




var getType = function(def) {

    var type = 'string';
    var parts = def.split('(');

    switch(parts[0]) {

        case 'mediumtext':
            type = 'mediumtext';
            break;
            
        case 'text':
        case 'longtext':            // longtext == text??
            type = 'text';
            break;

        case 'char':
        case 'varchar':
            type = 'string';
            break;

        case 'int':
        case 'smallint':
        case 'tinyint':
            type = 'integer';
            break;

        case 'double':
        case 'float':
            type = 'float';
            break;

//        case 'double':
//            type = 'double';
//            break;

        case 'date':
            type = 'date';
            break;

        case 'datetime':
            type = 'datetime';
            break;

        case 'bool':
        case 'boolean':
            type = 'boolean';
            break;

        default:
            type = '?'+parts[0]+'?';
            AD.log('<yellow><bold>WARN:</bold> Not sure what to do with data type: '+ parts[0]+ '</yellow>');
            AD.log('  -> you\'ll need to manually update that.');
            break;

    }

    return type;
};



var fieldDetails = function(row) {

    var details = [];

    // specify the type:
    details.push( 'type : "'+ getType(row.Type) + '"');

    if (row.Type.indexOf('(') != -1) {

        // row.Type = "int(10) unsigned"

        var sizeParts = row.Type.split('(');

        // NOTE: this loses the 'unsigned' setting for the field.
        // but as of right now, I don't see how sails specifies 
        // 'signed' vs 'unsigned' integers.  So :
        var size = sizeParts[1].split(')')[0]; 
        details.push('size : '+size );
    }

    if (row.Key == 'PRI') {
        details.push( 'primaryKey : true');
    }

    if (row.Extra.indexOf('auto_increment') != -1) {
        details.push( 'autoIncrement : true' );
    }

    if (row.Default) {
        var defaultValue = row.Default;
        details.push( 'defaultsTo : "'+defaultValue+'"' );
    }

//// TODO: add validation for notNull

    // convert to json data string:
    var jDetails = '    "'+row.Field + '" : {\n        ' + details.join(',\n        ') + '\n    }, \n';


    return jDetails;
}





Resource.createResource = function(done) {

//    var self = this;

    // have appdev generate a resource
    // command:  appdev resource [application] [name] [field1] ...

    var params =  [ 'connection:'+this.templateData.connection ];  //  this.templateData.fields;
    params.unshift('tablename:'+this.templateData.table);
    params.unshift(this.templateData.resource);
    params.unshift(this.templateData.application);
    params.unshift('resource');

// AD.log('params:');
// AD.log(params);

    AD.spawn.command({
        command:'appdev',
        options:params,
        exitTrigger:'Done!',
        shouldPipe:true
    })
    .fail(function(err){
        AD.log.error('<bold>Error:</bold> unable to run appdev resource *');
        process.exit(1);
    })
    .then(function(){
        if (done) done();
    });

};





Resource.patchResource = function(done) {

    var self = this;


    // now patch the model to
    //   - not include an id
    //   - not include createdOn, updatedOn  dates
    //   - specify the tableName

    var patchData = 'module.exports = {\n\n';


    // don't add any of the default sails fields
    patchData += '  autoCreatedAt:false,\n';
    patchData += '  autoUpdatedAt:false,\n';
    patchData += '  autoPK:false,\n';
    patchData += "  migrate:'safe',  // don't update the tables!\n";

    // if a different DB was specified for this model then add it to the config
    if ((this.templateData.db) && (this.templateData.db != NO_DB_SPECIFIED)) {
        patchData += [
      "\n  config:{",
      "    database:'"+this.templateData.db+"',",
      "    pool:false",  // don't try to reuse any of the other db connections
      "  },"].join('\n');
        patchData += '\n';
    }


    // Now patch the file:
    var patchSet = [{  file:path.join('api', 'models', self.templateData.resource + '.js'), tag:/module.exports\s*=\s*{/, replace:patchData }
                   ];


    var attributePatchData = [
        'attributes: {',
        ''
    ];

    this.templateData.fieldPatches.forEach(function(patch){
        attributePatchData.push(patch);
    });

    patchSet.push({  file:path.join('api', 'models', self.templateData.resource + '.js'), tag:/attributes\s*:\s*{/, replace:attributePatchData.join('\n') })


    // run all the patches
    self.patchFile( patchSet, function() {

        // now we are done!
        if (done) done();
    });



};



var loadConnectionInfo = function(adapter) {

    var connectionPath = path.join(process.cwd(), 'config', 'connections.js');

    var connInfo = null;

    //// first find the local connection info
    if( fs.existsSync( connectionPath) ) {

        // load connectionInfo
        var connectionConfig = require(connectionPath);
        if (connectionConfig[adapter]) {

            // set connInfo to connectionInfo[adapter]
            connInfo = connectionConfig[adapter];
        }
    }
        

    //// now find the sails/config/local.js file:
    var ext = '';
    var currDir = process.cwd();

    // while ext+localPath !exist ext += '..' 
    var sanity = 0;
    while(!fs.existsSync(path.join(currDir, ext, 'config', 'local.js'))) {
        if (ext != '') ext += path.sep;
        ext += '..';
        sanity ++;
        if (sanity>100) {
            AD.log.error(' hmmmm ... can\'t seem to find config/local.js! ');
            AD.log('<yellow>Be sure you are running this within a Sails project, or in a module.</yellow>');
            AD.log();
            process.exit(1);
        }
    }


    //// if we didn't find the specified adapter in our config/connection.js
    //// load the sails/config/connections.js and try again:
    if (connInfo == null) {

        var connectionPath = path.join(currDir, ext, 'config', 'connections.js');

        //// first find the local connection info
        if( fs.existsSync( connectionPath) ) {

            // load connectionInfo
            var connectionConfig = require(connectionPath);

            if (connectionConfig.connections[adapter]) {

                // set connInfo to connectionInfo[adapter]
                connInfo = connectionConfig.connections[adapter];
            }
        }
    }



    ////
    //// Now check the sails/config/local.js 
    ////
    var localPath = path.join(currDir, ext, 'config', 'local.js');

    // load localConfig
    var localConfig = require(localPath);
// console.log('localConfig:', localConfig.connections[adapter]);

    if (localConfig.connections[adapter]) {

        // save connInfo = localConfig.connection[adapter]
        localConnection = localConfig.connections[adapter];

        // make sure connInfo a valid object
        if (connInfo == null) connInfo = {};

        // override with localConnection info
        for (var l in localConnection) {
            connInfo[l] = localConnection[l];
        }
    }

// console.log('connInfo:', connInfo);

    return connInfo;

}


