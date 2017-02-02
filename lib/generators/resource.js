
var Generator = require('./class_generator.js');

var path = require('path');
var AD = require('ad-utils');
var fs = require('fs');
var async = require('async');


var Resource = new Generator({
    key:'resource',
    command:'r resource [application] [name] [field1] ... [fieldN]',
    commandHelp: 'Generate a Resource',
    parameters:['application','resource', '[field]'],
    newText:'Creating a new resource ...'
});


// Remove all non-alphanumeric characters from a name
var nameFilter = function(name) {
    return String(name).replace(/\W/g, '');
}

module.exports = Resource;

var util = null;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev resource <yellow><bold>[application] [name]</bold></yellow> <green>[connection:[name]] [tablename:[name]] [field1] ... [fieldN]</green>',
        
        description:[ 
            'This command creates a new Resource (server and client Model) for the project.  Use this to create ',
            '    a new Resource in the system.  The SailsJS framework will create the DB table for you.',
            '',
            '    If you already have a db table you want to reference, use the <green>table2model</green> command instead.'
        ].join('\n'),

        parameters:[
            '<yellow>[application]</yellow>         : the client side application to install the client Model info in.',
            '<yellow>[name]</yellow>                : the name of the Model you want to create',
            '<green>[connection:[name]]</green>   : (optional) the name of the connection setting to use for this Model',
            '<green>[tablename:[name]]</green>    : (optional) the name of the db table to create for this model. (default = <yellow>[name]</yellow>)',
            '<green>[preventNull:[true/false]]</green>    : (optional) add a boolean flag to add prevent null code for this model. (default = <yellow>false</yellow>)',
            '<green>[field1] ... [fieldN]</green> : (optional) a list of table columns to create.',
            '',
            '                        format: <green>fieldname</green>:<green>type</green>  (myfield:string, myField2:integer, ...)',
            '',
            '                        type can be one of the supported Waterline types:',
            '                            (https://github.com/balderdashy/waterline-docs/blob/master/models/data-types-attributes.md):',
            '                            (string, text, integer, float, date, time, datetime, boolean, binary, array, json)',
            '',
            '                        special text options:',
            '                            for a text type (string or text) you can also specify:',
            '                            <green>fieldname:[string|text]:</green><yellow>multilingual</yellow>   :  specifies this is a multilingual field',
            '                            <green>fieldname:[string|text]:</green><yellow>label</yellow>          :  marks this field to use as the default label for this model',
            '                            <green>fieldname:[string|text]:</green><yellow>multilingual:label</yellow> :  combines these options',
            '',
            '                        associations:',
            '                            you can specify an association to another resource like:',
            '                                 @hasOne:  <green>fieldname</green>:<yellow>model</yellow>:<yellow>[ModelName]</yellow>',
            '                                 @hasMany: <green>fieldname</green>:<yellow>collection</yellow>:<yellow>[ModelName]</yellow>:<yellow>[viaReference]</yellow>'

        ],

        examples:[
            '> <green>appdev resource myApplication NewModel name:STRING age:INTEGER birthday:DATE</green> ',
            '    // <green>creates</green> a client model definition in <yellow>'+path.join('assets','myApplication','models','NewModel.js')+'</yellow>',
            '    // <green>creates</green> a server model definition in <yellow>'+path.join('api', 'models', 'NewModel.js')+'</yellow>',
            '    // <green>creates</green> a server controller for your model: <yellow>'+path.join('api','controllers','NewModelController.js')+'</yellow>',
            '',
            '> <green>appdev resource myApplication NewModel name:STRING:</green><yellow>multilingual</yellow><green> age:INTEGER birthday:DATE</green> ',
            '    // <green>creates</green> a client model definition in <yellow>'+path.join('assets','myApplication','models','NewModel.js')+'</yellow>',
            '    // <green>creates</green> a server model definition in <yellow>'+path.join('api', 'models', 'NewModel.js')+'</yellow>',
            '    // <green>creates</green> a server translation model definition in <yellow>'+path.join('api', 'models', 'NewModelTrans.js')+'</yellow>',
            '    // <green>creates</green> a server controller for your model: <yellow>'+path.join('api','controllers','NewModelController.js')+'</yellow>',
        ]
    });

}

function isMultilingualType(parts) {
    var isMultilingual = false;

    // fieldname:[string,text]:multilingual
    // or
    // filename:[string,text]:label:multilingual
    for (var i=2; i<parts.length; i++) {
        if ((parts[i]) 
            && (parts[i].toLowerCase() == 'multilingual')) {
            isMultilingual = true;
        }
    }

    return isMultilingual;
}

Resource.prepareTemplateData = function () {
    util = this.adg;
    var _this = this;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ModelName = this.options.resource || '?resourceNotFound?';
    this.templateData.ModelNameTrans = this.templateData.ModelName + 'Trans';
    
    // make sure there is not file extension on the end of the ModelName
    if ( this.templateData.ModelName.indexOf('.js') != -1) {
        var parts = this.templateData.ModelName.split('.');
        this.templateData.ModelName = parts[0];
    }

    this.templateData.modelname = nameFilter(this.templateData.ModelName).toLowerCase();
    this.templateData.tablename = this.templateData.modelname;  // default value
    this.templateData.fields = [];
    this.templateData.fieldsMultilingual = [];


    this.templateData.connection = null;  // this will be updated in checkAdapter();

    this.templateData.templateFields = [];  // any special fields added to model definition through patching the template.
    this.templateData.associations = [];

    this.templateData.preventNull = false;

    var defaultLabel = null;
    var desc = [];


    // allowed commandline options:
    var allowedOptions = [ 'connection', 'tablename', 'preventNull' ];

    // fieldTypes requiring special handling through a template:
    var templateTypes = ['model', 'collection'];

    var commonMistakes = {
        'bool' : 'boolean'
    }


    for(var f in this.options.field) {

        // fields can be specified as:
        //  field
        //  field:type
        //  field:type:[multilingual|label]
        //  field:type:[multilingual|label]:[multilingual|label]

        var token = this.options.field[f];
        var parts = token.split(':');
        var field = nameFilter(parts[0]);
        var type = parts[1] || 'String';


        // if one of our allowed options: 
        if (allowedOptions.indexOf(field) != -1) {    //  == 'connection') {

            this.templateData[field] = type;

        } else {

            // if this is a normal field
            if ( templateTypes.indexOf(type) == -1) {

                if (!isMultilingualType(parts)) {

                    // store for our sailsJS field list:
                    this.templateData.fields.push(field+':'+type);

                } else {
                    this.templateData.fieldsMultilingual.push(field+':'+type);
                }


                // correct these common incorrect types:
                if (commonMistakes[type]) { type = commonMistakes[type] };

                // store in our client Model description object
                desc.push( "'"+field+"':'"+type+"'");

            } else {

                switch(type) {

                    case 'model':

                        // field:model:[ModelName]

                        if (typeof parts[2] == 'undefined') {
                            AD.log.error('missing model reference:');
                            AD.log('    you specified a field as a model, but did not include the associated model reference:');
                            AD.log('    > <green>'+field+'</green>:<green>'+type+'</green>:<red>[ModelName]</red>');
                            AD.log('try again.');
                            console.log();
                            process.exit(1);
                        }
                        this.templateData.templateFields.push('    '+field+" : { model: '"+parts[2].toLowerCase()+"' },");
                        this.templateData.associations.push({field:field, model:nameFilter(parts[2])} );
                        break;


                    case 'collection':

                        // field:collection:[ModelName]:[viaReference]

                        if ((typeof parts[2] == 'undefined')
                            || (typeof parts[3] == 'undefined')) {

                            AD.log.error('missing model reference:');
                            AD.log('    you specified a field as a <yellow>collection</yellow>, but did not include all the associated collection information:');
                            
                            var example = '    > <green>'+field+'</green>:<green>'+type+'</green>:';
                            if (typeof parts[2] == 'undefined') {
                                example += '<red>[ModelName]</red>:';
                            } else {
                                example += '<green>'+parts[2]+'</green>:';
                            }

                            if (typeof parts[3] == 'undefined') {
                                example += '<red>[viaReference]</red>:';
                            } else {
                                example += '<green>'+parts[3]+'</green>';
                            }

                            AD.log(example);
                            AD.log('try again.');
                            console.log();
                            process.exit(1);
                        }

                        this.templateData.templateFields.push('    '+field+" : {  collection: '"+parts[2].toLowerCase()+"', via: '"+parts[3]+"' },");
                        this.templateData.associations.push({field:field, model:nameFilter(parts[2])});
                        break;
                }
                
            }


            // figure out what our default Label might be.
            defaultLabel = this.chooseLabel(defaultLabel, field, type, parts);

        }
    }



    ////
    //// Prepare the information for the Client UI Model definition
    ////


    // Model.description() : prepare the description 
    // should return a basic object hash:  
    //    {
    //      field1:'type1',
    //      field2:'type2',
    //      ...
    //      fieldN:'typeN'
    //    }
    // 
    this.templateData.description = "{ " + desc.join(', ') + ' }';


    // .appNameURL : the url path for this app
    // there should be no '\' from a windows path in this value:
    this.templateData.appNameURL = this.templateData.appName.split('\\').join('/');

    // .appNameFS  : the file system path for this app.
    // make sure appName has any platform specific path separators used
    this.templateData.appNameFS =
        this.pathProperSeparators( this.templateData.appName );


    // convert appName into an object's namespace for the controller:
    this.templateData.appNameSpace
        = this.templateData.appNameFS.split(path.sep).join('.');


    // let's figure out what the 'correctModelName' is.  Normally it is
    // appNamSpace.ModelName, but if appNameSpace is '', then it is just
    // ModelName:
    function toCorrectModelName(modelName) {
        var correctModelName =  _this.templateData.appNameSpace;
        if (correctModelName != '' ) correctModelName += '.';
        correctModelName += modelName;

        return correctModelName;
    }
    
    this.templateData.correctModelName = toCorrectModelName(this.templateData.ModelName);



    // Model.multilingualFields : (array) of field names that are multilingual
    // eg:  [ 'field1', 'field2', ..., 'fieldN' ]
    //
    var multilingualFields = '// multilingualFields:[ \'field\', \'field2\' ],';
    if (this.templateData.fieldsMultilingual.length > 0) {
        multilingualFields = 'multilingualFields:[';
        var mfields = [];
        this.templateData.fieldsMultilingual.forEach(function(definition){
            var parts = definition.split(':');
            mfields.push( "'"+parts[0]+"'");
        })
        multilingualFields += mfields.join(', ') + '], ';
    }
    this.templateData.clientMultilingualFields = multilingualFields;


    // Model.associations: (array) of fields that are associated objects 
    var associations = "// associations:['field1', 'field2', ..., 'fieldN'],"
    if (this.templateData.associations.length>0) {
        associations = "associations:{";
        var arryFields = [];
        this.templateData.associations.forEach(function(field){
            arryFields.push("'"+field.field+"':'"+toCorrectModelName(field.model)+"'");
        })
        associations += arryFields.join(', ') + '}, ';
    }
    this.templateData.clientAssociations = associations;

//// TODO: do we need to add in associationDefinitions ?
// currently we have the option to :
// (see opstools/RBAC/models/base/SiteUser.js for an example:)
// define: {
//     permissions: {
//         Type: Permission
//     }
// },
// so that returned values will be made instances of those objects.
// 
// Question: do we need this in our current method of working with data?


    // Model.fieldLabel: (string) which field should be used as the default
    //                   label to display an instance of this object.
    this.templateData.fieldLabel = defaultLabel;







    // let's figure out what the modelURL should be:
    // if we are in the sails root, then it is simply the modelname
    // else we are in a plugin, so it would be [dirname]/modelname
    var modelURLParts = [];
    var moduleDir = {
        setup : true
    }
    if (AD.util.fs.looksLikeDir(moduleDir, process.cwd() )) {
        // we are not in a sails root directory:
        var dir = process.cwd().split(path.sep).pop();
        modelURLParts.push(dir);
    }
    modelURLParts.push(this.templateData.modelname);
    this.templateData.modelURL = modelURLParts.join('/');
    

    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    // NOTE: this needs to use proper path separators for file system operations
    this.prepareAppDirectory( this.templateData.appNameFS);


    util.debug('templateData:');
    util.debug(this.templateData);


}



Resource.chooseLabel = function(defaultLabel, field, type, options) {

    // if defaultLabel is not set yet
    if (defaultLabel == null) {
        var lcType = type.toLowerCase();
        if ((lcType == 'string') || (lcType == 'text')) {

            // assign it the 1st 'string' or 'text' field we encounter
            defaultLabel = field;
        }
    }

    for (var i=2; i<options.length; i++) {
        if ((options[i]) && (options[i].toLowerCase() == 'label')){
            defaultLabel = field;
        }
    }

    return defaultLabel;
}



Resource.postTemplates = function() {

    var self = this;


    // define the series of methods to call for the setup process
    var processSteps = [
                    'checkAdapter',
                    'sailsGenerate',
                    'patchFiles',
                    'preventNull',
                    'addUnitTest'
    ];


    this.methodStack(processSteps, function() {

        // when they are all done:

        util.log();
        util.log('resource created.');
        util.log();
        process.exit(0);
    });

}






Resource.addUnitTest = function( done ) {

    // Add to our base test_all_loader.js, a reference to this class's new unit test

    var tag = "// load our tests here";

    var replace = [
        tag,
        '        "'+this.templateData.appName+'/tests/model_'+this.templateData.ModelName+'.js",'
     ].join('\n');


    var patchSet = [
                     {  file:path.join('assets', this.templateData.appNameFS, 'tests','test_all_loader.js'), tag:tag, replace: replace  },
                   ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });
};



Resource.checkAdapter = function(done) {
    var self = this;

    //// When this fn() finishes ... this.templateData.connection needs to 
    //// contain the connection info for this model!

    if (this.templateData.connection) {

        done();

    } else {

        var adapterInfo = this.defaults('connection');

        if (typeof adapterInfo != 'undefined') {

            this.templateData.connection = adapterInfo;
            done();

        } else {

            var qset =  {
                question: 'which default connection to use:',
                data: 'connection',
                def : 'appdev_default',
                // post: function(data) { data. = data.authType.toLowerCase(); }

            };
            this.questions(qset, function(err, data) {

                if (err) {
                     process.exit(1);
                } else {

                    self.defaults('connection', data.connection);
                    self.templateData.connection = data.connection;
                    done();
                }


            });

        } 

    }


}



Resource.sailsGenerate = function(done) {
    // call sails generate [command]  to generate the various models and controllers.


    var _this = this;

    async.series([

        // 1) have SailsJS create the Model:
        function(next) {

            
            // command:  sails generate model [ModelName] field1 ...

            var params = [
                'generate', 'model', _this.templateData.ModelName
            ];

            // add on each of the specified field values:
            _this.templateData.fields.forEach(function(field){
                params.push(field);
            })

            AD.spawn.command({
                command:'sails',
                options: params,
                textFilter:['warn']
            })
            .fail(function(err){
                AD.log.error('<bold>ERROR:</bold> sails did\'t generate the model correctly!');
                next(err);
            })
            .then(function(){

                next();
            });

        },

        // 2) if Multilingual, have SailsJS now create the ModelTrans:
        function(next) {

            if (_this.templateData.fieldsMultilingual.length > 0) {
             
                // command:  sails generate model [ModelName]Trans field1 ...

                var params = [
                    'generate', 'model', _this.templateData.ModelNameTrans
                ];


                // add on each of the specified field values:
                _this.templateData.fieldsMultilingual.forEach(function(field){
                    params.push(field);
                })

                // add on the language_code field (no need to specify)
                params.push('language_code:string');
            
                AD.spawn.command({
                    command:'sails',
                    options: params,
                    textFilter:['warn']
                })
                .fail(function(err){
                    AD.log.error('<bold>ERROR:</bold> sails did\'t generate the model correctly!');
                    next(err);
                })
                .then(function(){

                    next();
                });
            
            } else {
                next();
            }

        },


        // 3) have SailsJS now create the Controller:
        function(next) {

            
            // command:  sails generate controller [ModelName]
            var params = [
                'generate', 'controller', _this.templateData.ModelName
            ];

            AD.spawn.command({
                command:'sails',
                options: params,
                textFilter:['warn'],
                exitTrigger:'Created '
            })
            .fail(function(err){
                AD.log.error('<bold>ERROR:</bold> sails did\'t generate the controller correctly!');
                next(err);
            })
            .then(function(){
                next();
            });

        },

    ], function(err, results) {

        if (err) {
            console.log(err);
            process.exit(1);
        }

        done();
    })

}



Resource.patchFiles = function(done) {

    var patchSet = [];

    var hasMultilingual = (this.templateData.fieldsMultilingual.length > 0);

    var pathModel = path.join('api', 'models', this.templateData.ModelName + '.js');
    var pathModelTrans = path.join('api', 'models', this.templateData.ModelNameTrans + '.js');

    // Add .connection to Model if not already specified
    var modelData = fs.readFileSync(path.join('api', 'models', this.templateData.ModelName + '.js'), {encoding:'utf8'});
    if (modelData.indexOf('connection:') == -1) {

        // now patch the model to specify our connection!
        var patchData = 'module.exports = {\n\n  connection:\''+this.templateData.connection+'\',\n\n';
        patchSet.push(
            {  file:pathModel, tag:/module.exports\s*=\s*{/, replace:patchData }
        );

        // update the multilingual model if there is one.
        if (hasMultilingual) {
            patchSet.push(
                {  file:pathModelTrans, tag:/module.exports\s*=\s*{/, replace:patchData }
            );
        }

    } else {
        AD.log('<yellow>WARN:</yellow> model['+path.join('api', 'models', this.templateData.ModelName + '.js')+'] already had .connection  setting!');
    }


    // Add  the tablename :
    var tableNameData = [
        'module.exports = {',
        '',
        '  tableName:\''+ this.templateData.tablename +'\',',
        ''
    ].join('\n');

    patchSet.push(
        {  file:pathModel, tag:/module.exports\s*=\s*{/, replace:tableNameData }
    );


    // update the multilingual model if there is one.
    if (hasMultilingual) {
            // Add  the tablename :
        var tableNameTrans= [
            'module.exports = {',
            '',
            '  tableName:\''+ this.templateData.tablename +'_trans\',',
            ''
        ].join('\n');

        patchSet.push(
            {  file:pathModelTrans, tag:/module.exports\s*=\s*{/, replace:tableNameTrans }
        );
    }


    // Add any additional Templatefield definitions, if they exist:
    if (this.templateData.templateFields.length > 0) {

        // now patch the model to specify our templated fields
        var tfieldsData = [
            'attributes: {',
            '',
            this.templateData.templateFields.join('\n')
        ].join('\n');

        patchSet.push(
            {  file:pathModel, tag:/attributes\s*:\s*{/, replace:tfieldsData }
        );
    }

    // if multilingual, add a link between the Trans model -> Data Model
    if (hasMultilingual) {
            // Add  the tablename :
        var transfieldsData = [
            'attributes: {',
            '',
            '    '+this.templateData.modelname+': { model: \''+this.templateData.ModelName+'\' },'
        ].join('\n');

        patchSet.push(
            {  file:pathModelTrans, tag:/attributes\s*:\s*{/, replace:transfieldsData }
        );
    }


    // if multilingual, update the Data Model with the additional Translation attributes & methods
    if (hasMultilingual) {

        patchSet.push(
            {  file:pathModel, tag:/attributes\s*:\s*{/, template:'__resource_multilingual_attributes.ejs', data:this.templateData }
        );

        // to the bottom, add additional Multilingual Class methods:
        patchSet.push(
            // note: keep those '  ' at the beginning in the tag:
            {  file:pathModel, tag:/  }\s*,*\s*}\s*;/, template:'__resource_multilingual_classMethods.ejs', data:this.templateData }
        );
    }



    // patch the controller to properly link to our model in our plugin directory format:
    var controllerData = fs.readFileSync(path.join('api', 'controllers', this.templateData.ModelName + 'Controller.js'), {encoding:'utf8'});
    if (controllerData.indexOf('_config') == -1) {

        var lcResource = this.templateData.ModelName.toLowerCase();
        var patchDataController = [
            'module.exports = {',
            '',
            '    _config: {',
            '        model: "'+lcResource+'", // all lowercase model name',
            '        actions: true,',
            '        shortcuts: true,',
            '        rest: true',
            '    }'
        ].join('\n');

        patchSet.push(
            {  file:path.join('api', 'controllers', this.templateData.ModelName + 'Controller.js'), tag:"module.exports = {", replace:patchDataController }
        );

    } else {
        AD.log('<yellow>WARN:</yellow> '+path.join('api', 'controllers', this.templateData.ModelName + 'Controller.js')+' ._config  was already set!');
    }



    // var patchSet = [ 
    //                     {  file:path.join('api', 'models', this.templateData.ModelName + '.js'), tag:"module.exports = {", replace:patchData },
    //                     {  file:path.join('api', 'controllers', this.templateData.ModelName + 'Controller.js'), tag:"module.exports = {", replace:patchDataController }
    //                ];

    this.patchFile( patchSet, function() {

        done();

    })

}


Resource.preventNull = function(done) {
    if (!this.templateData.preventNull) {
        if (done) done();
        return;
    }

    var preventNullCode = ["\n\n  },\n",
                            "  beforeValidate: function (values, cb) {",
                            "    for (var key in values) {",
                            "      if (typeof values[key] == 'undefined' || values[key] === '' || values[key] != values[key] /* NaN */)",
                            "        values[key] = null;",
                            "    }",
                            "    cb();",
                            "  }",
                            "};"].join('\n'),

        pathModel = path.join('api', 'models', this.templateData.ModelName + '.js'),
        patchSet = [
            {
                file: pathModel,
                tag: /[\n\s]*\}[\n\s]*\};/,
                replace: preventNullCode
           }
        ];
 
    this.patchFile( patchSet, function() {
        if (done) done();
    });

}
