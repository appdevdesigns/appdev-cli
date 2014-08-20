
var Generator = require('./class_generator.js');

var path = require('path');
var fs = require('fs');

var NO_DB_SPECIFIED = 'NO_DB_SPECIFIED';

var Resource = new Generator({
    key:'table2model',
    command:'table2model [application] [table] [modelName] [db:[dbname]]',
    commandHelp: 'Generate a Resource from a DB Table',
    parameters:['application', 'table','resource', '[options]'],
    newText:'Creating a new resource ...'
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
            '                        client side model definition.',
            '<yellow>[table]</yellow>               :   the db table name to read from',
            '<yellow>[modelName]</yellow>           :   the name of the server side Model',
            '<green>[db:[dbname]]</green>         :   (optional) the name of the db to read from',
            '<green>[connection:[name]]</green>   : (optional) the name of the adapter connection to use (default:\'mysql\')'
        ],

        examples:[
            '> appdev table2model myApplication spiffy_table SpiffyTable ',
            '    // reads in [defaultDB].spiffy_table  information',
            '    // creates '+path.join('assets','myApplication', 'models', 'SpiffyTable.js')+' client side model ',
            '    // creates '+path.join('api', 'models', 'SpiffyTable.js')+' server side model',
            ''
        ]
    });

}


Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.table = this.options.table || '?tableNotFound?';
    this.templateData.resource = this.options.resource || '?modelNotFound?';
    this.templateData.application = this.options.application || '?applicationNotFound?';
    this.templateData.fields = [];

    this.templateData.db = null;
    this.templateData.connection = null;

// AD.log('this.options: ');
// AD.log(this.options);

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
                this.templateData.connection = parts[1] || '???';
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
    if (adapter == '???') adapter = this.defaults('connection');

    // if no default set, then just use 'mysql' (an AppDev default)
    if (typeof adapter == 'undefined') adapter = 'mysql';


    // open the config data and pull the adapter info for this adapter:
    this.config = loadConnectionInfo(adapter); 

    if (this.config) {


        // we have a valid connection for the given adapter.
        // let's try to see if we can find out what kind of connection it is:

        var adapterType = '???';
        var module = this.config.module  || 'no module defined';

        if (module.indexOf('mysql') != -1) adapterType = 'mysql';
        if (module.indexOf('posgres') != -1) adapterType = 'posgres';


        var methods = [];


        switch (adapterType) {
            case 'mysql':

                methods.push('processMysql');

                break;

            default:
                util.log();
                util.log('<red>unable to determine module from connection['+adapter+'].</red>');
                util.log();
                util.log('<yellow>make sure the connection '+adapter+'.module  is set in '+path.join('config', 'local.js')+'</yellow>');
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

        case 'text':
            type = 'text';
            break;

        case 'char':
        case 'varchar':
            type = 'string';
            break;

        case 'int':
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
        var sizeParts = row.Type.split('(');
        var size = sizeParts[1].replace(')', '');
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
    var jDetails = '    '+row.Field + ' : {\n        ' + details.join(',\n        ') + '\n    }, \n';


    return jDetails;
}





Resource.createResource = function(done) {

//    var self = this;

    // have appdev generate a resource
    // command:  appdev resource [application] [name] [field1] ...

    var params =  [ 'connection:'+this.templateData.connection ];  //  this.templateData.fields;
    params.unshift(this.templateData.resource);
    params.unshift(this.templateData.application);
    params.unshift('resource');

AD.log('params:');
AD.log(params);

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

    // save the table name
    patchData += '  tableName:"'+this.templateData.table+'",\n';

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

//// TODO: figure out which field is a primary key, then
////       patch the info to define the primary key properly

    // Now patch the file:
    var patchSet = [ {  file:path.join('api', 'models', self.templateData.resource + '.js'), tag:"module.exports = {", replace:patchData }
                   ];


    var attributePatchData = [
        'attributes: {',
        ''
    ];

    this.templateData.fieldPatches.forEach(function(patch){
        attributePatchData.push(patch);
    });

    patchSet.push({  file:path.join('api', 'models', self.templateData.resource + '.js'), tag:"attributes: {", replace:attributePatchData.join('\n') })

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

    var localPath = path.join(currDir, ext, 'config', 'local.js');

    // load localConfig
    var localConfig = require(localPath);

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


    return connInfo;

}


