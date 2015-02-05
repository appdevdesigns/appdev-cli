
var Generator = require('./class_generator.js');

var path = require('path');
var AD = require('ad-utils');

var Resource = new Generator({
    key:'resource',
    command:'r resource [application] [name] [field1] ... [fieldN]',
    commandHelp: 'Generate a Resource',
    parameters:['application','resource', '[field]'],
    newText:'Creating a new resource ...'
});


module.exports = Resource;

var util = null;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev resource <yellow><bold>[application] [name]</bold></yellow> <green>[connection:[name]] [field1] ... [fieldN]</green>',
        
        description:[ 
            'This command creates a new Resource (server and client Model) for the project.  Use this to create ',
            '    a new Resource in the system.  The SailsJS framework will create the DB table for you.',
            '',
            '    If you already have a db table you want to reference, use the <green>table2model</green> command instead.'
        ].join('\n'),

        parameters:[
            '<yellow>[application]</yellow>         : the client side application to install the client Model info in.',
            '<yellow>[name]</yellow>                : the name of the Model you want to create',
            '<green>[connection:[name]]</green>     : (optional) the name of the connection setting to use for this Model',
            '<green>[field1] ... [fieldN]</green> : (optional) a list of table columns to create.',
            '                        format: fieldname:type  (myfield:STRING, myField2:INTEGER,...)'
        ],

        examples:[
            '> appdev resource myApplication NewModel name:STRING age:INTEGER birthday:DATE ',
            '    // creates a client model definition in '+path.join('assets','myApplication','models','NewModel.js'),
            '    // creates a server model definition in '+path.join('api', 'models', 'NewModel.js'),
            '    // creates a server controller for your model: '+path.join('api','controllers','NewModelController.js'),
            ''
        ]
    });

}


Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ModelName = this.options.resource || '?resourceNotFound?';

    // make sure there is not file extension on the end of the ModelName
    if ( this.templateData.ModelName.indexOf('.js') != -1) {
        var parts = this.templateData.ModelName.split('.');
        this.templateData.ModelName = parts[0];
    }

    this.templateData.modelname = this.templateData.ModelName.toLowerCase();
    this.templateData.fields = [];


    this.templateData.connection = null;  // this will be updated in checkAdapter();


    var defaultLabel = null;
    var desc = {};

    for(var f in this.options.field) {

        // fields can be specified as:
        //  field
        //  field:type
        //  field:type:[multilingual|label]
        //  field:type:[multilingual|label]:[multilingual|label]

        var token = this.options.field[f];
        var parts = token.split(':');
        var field = parts[0];
        var type = parts[1] || 'String';


        if (field == 'connection') {

            this.templateData.connection = type;

        } else {


            // store for our sailsJS field list:
            this.templateData.fields.push(field+':'+type);

            // store our description object
            desc[field] = type;


            // figure out what our default Label might be.
            defaultLabel = this.chooseLabel(defaultLabel, field, type, parts[2], parts[3]);

        }
    }

    // prepare the description
    this.templateData.description = JSON.stringify(desc, null, 22);

    this.templateData.fieldLabel = defaultLabel;


    // make sure appName has any platform specific path separators used
    this.templateData.appName =
        this.pathProperSeparators( this.templateData.appName );


    // convert appName into an object's namespace for the controller:
    this.templateData.appNameSpace
        = this.templateData.appName.split(path.sep).join('.');

    // let's figure out what the 'correctModelName' is.  Normally it is
    // appNamSpace.ModelName, but if appNameSpace is '', then it is just
    // ModelName:
    var correctModelName =  this.templateData.appNameSpace;
    if (correctModelName != '' ) correctModelName += '.';
    correctModelName += this.templateData.ModelName;
    this.templateData.correctModelName = correctModelName;


    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    this.prepareAppDirectory(this.templateData.appName);


    util.debug('templateData:');
    util.debug(this.templateData);


}



Resource.chooseLabel = function(defaultLabel, field, type, o2, o3) {

    // if defaultLabel is not set yet
    if (defaultLabel == null) {
        var lcType = type.toLowerCase();
        if ((lcType == 'string') || (lcType == 'text')) {

            // assign it the 1st 'string' or 'text' field we encounter
            defaultLabel = field;
        }
    }

    if (((o2) && (o2.toLowerCase() == 'label'))
        || ((o3) && (o3.toLowerCase() == 'label'))){
        defaultLabel = field;
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
                     {  file:path.join('assets', this.templateData.appName, 'tests','test_all_loader.js'), tag:tag, replace: replace  },
                   ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });
};



Resource.checkAdapter = function(done) {
    var self = this;

    //// When this fn() finishes ... this.templateData.connection needs to 
    //// containe the connection info for this model!

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
     //           post: function(data) { data. = data.authType.toLowerCase(); }

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

    var self = this;

    // have SailsJS now create the Model:
    // command:  sails generate model [ModelName] field1 ...

    var params = [
        'generate', 'model', this.templateData.ModelName
    ];

    // add on each of the specified field values:
    this.templateData.fields.forEach(function(field){
        params.push(field);
    })

    AD.spawn.command({
        command:'sails',
        options: params,
        textFilter:['warn']
    })
    .fail(function(err){
        AD.log.error('<bold>ERROR:</bold> sails did\'t generate the model correctly!');
        process.exit(1);
    })
    .then(function(){


        // have SailsJS now create the Controller:
        // command:  sails generate controller [ModelName]
        var params = [
            'generate', 'controller', self.templateData.ModelName
        ];

        AD.spawn.command({
            command:'sails',
            options: params,
            textFilter:['warn'],
            exitTrigger:'Created '
        })
        .fail(function(err){
            AD.log.error('<bold>ERROR:</bold> sails did\'t generate the controller correctly!');
            process.exit(1);
        })
        .then(function(){
            done();
        });

    });

}



Resource.patchFiles = function(done) {

    // now patch the model to specify our connection!
    var patchData = 'module.exports = {\n\n  connection:"'+this.templateData.connection+'",\n\n';
    var patchSet = [ 
                        {  file:path.join('api', 'models', this.templateData.ModelName + '.js'), tag:"module.exports = {", replace:patchData }
                   ];
    this.patchFile( patchSet, function() {

        done();

    })

}


