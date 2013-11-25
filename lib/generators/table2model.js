
var Generator = require('./class_generator.js');

var path = require('path');

var NO_DB_SPECIFIED = 'NO_DB_SPECIFIED';

var Resource = new Generator({
    key:'table2model',
    command:'table2model [table] [modelName] [application] [db:[dbname]]',
    commandHelp: 'Generate a Resource from a DB Table',
    parameters:['table','resource', 'application', '[options]'],
    newText:'Creating a new resource ...'
});


module.exports = Resource;

var util = null;

Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.table = this.options.table || '?tableNotFound?';
    this.templateData.resource = this.options.resource || '?modelNotFound?';
    this.templateData.application = this.options.application || '?applicationNotFound?';
    this.templateData.fields = [];

    this.templateData.db = null;

    for (var o=0; o<this.options.options.length; o++) {
        var opt = this.options.options[o];

        var parts = opt.split(':');

        switch( parts[0]) {
            case 'db':
                this.templateData.db = parts[1] || NO_DB_SPECIFIED;
                break;
        }
    }



    util.debug('templateData:');
    util.debug(this.templateData);


}





Resource.postTemplates = function() {

    var self = this;

    var adapter = this.defaults('adapter');

    var methods = [];

    switch (adapter) {
        case 'mysql':

//            this.processMysql();
            methods.push('processMysql');

            break;

        default:
            util.log();
            util.log('<red>unable to pull table data from adapter['+adapter+'] yet...</red>');
            util.log();
            process.exit(1);
    }


    //
    methods.push('createResource');
    methods.push('patchResource');

    this.methodStack(methods, function() {

        // when they are all done:
        util.log();
        util.log('<green><bold>Done!</bold></green>');
        util.log();

    })

}





Resource.processMysql = function(done) {

    var self = this;

    var config = require(path.join(process.cwd(), 'config/local.js'));

    util.debug();
    util.debug('.adn config info:');
    util.debug(config);

    if (config.adapters) {

        if (config.adapters.mysql) {

            // now create the mysql DB Connection

            var mysql = require('mysql');

            // override mysql.database setting if an option on cmd line present
            if (this.templateData.db) config.adapters.mysql.database = this.templateData.db;

            var db = mysql.createConnection(config.adapters.mysql);
            db.connect();


            // run mysql describe table command
            var sql = 'DESCRIBE '+this.templateData.table;
            db.query(sql, function(err, rows,fields){

                if (err) {

                    util.error();
                    util.error('error reading table info:');
                    util.error(err);
                    util.log();
                    process.exit(1);


                } else {

                    util.debug('rows:');
                    util.debug(rows);


                    // compile an array of fields to create:
                    self.templateData.fields = [];
                    for (var i=0; i<rows.length; i++) {

                        var type = getType(rows[i].Type);
                        self.templateData.fields.push( rows[i].Field+':'+type);

                    }

                    util.debug('fields:');
                    util.debug(self.templateData.fields);


                    if (done) done();
                }

            });

            db.end();
        } else {
            util.log();
            util.log('not sure how to connect to mysql ... ');
            util.log('no mysql settings in config/local.js');
            util.log();
            process.exit(1);
        }

    } else {

        util.log();
        util.log('not sure how to connect to your db ... ');
        util.log('no adapter specified in config/local.js');
        util.log();
        process.exit(1);
    }

}


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
            break;

    }

    return type;
}





Resource.createResource = function(done) {

    var self = this;

    // have appdev generate a resource
    // command:  appdev resource [application] [name] [field1] ...

    var params = this.templateData.fields;
    params.unshift(this.templateData.resource);
    params.unshift(this.templateData.application);
    params.unshift('resource');

    this.shell('appdev', params, [], function() {

        if (done) done();

    });

}





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


    // Now patch the file:
    var patchSet = [ {  file:path.join('api', 'models', self.templateData.resource + '.js'), tag:"module.exports = {", replace:patchData }
                   ];
    self.patchFile( patchSet, function() {

        // now we are done!
        if (done) done();
    })



}


