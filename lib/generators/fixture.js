
var Generator = require('./class_generator.js');

var path = require('path');

var AD = require('ad-utils');

var Resource = new Generator({
    key:'fixture',
    command:'f fixture [application] [name] [field1] ... [fieldN]',
    commandHelp: 'Generate a fixture for initial development',
    parameters:['application','resource', '[field]'],
    newText:'Creating a new fixture ...'
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev fixture <yellow><bold>[application] [name]</bold></yellow> <gren>[field1] ... [fieldN]</green>',
        description:[ 
            'This command generates a fixture for initial development.',
            '',
            '    Use this command to create a Client & Server resource definition.',
            '',
            '    This command is different from the <green><bold>appdev resource</bold></green> command in that it also generates initial sample ',
            '    response data from the resource controller.',
            '',
            '    This command is useful when trying to initially define a server side response that the client application',
            '    needs to use.  First generate the fixture and manually edit the response to be the agreed upon format.  Then',
            '    save the project.',
            '',
            '    Now the client side developer can modify the client side code to operate on the sample data. And at the same',
            '    time the server side developer can then update the controller to generate the data properly.',
            '',
            '    The initial fixture can serve as an agreed upon data contract that the client and server developers ',
            '    can work towards.',
            ''

        ].join('\n'),
        parameters:[
            '<yellow>[application]</yellow>         :   the client side application to store this model in.',
            '<yellow>[name]</yellow>                :   the name of the resource you are creating.',
            '<green>[field1]...[fieldN]</green>   :   optional list of fields to created in your resource/model',
            '                          <yellow>format:</yellow> <green>[name]:[type]</green>',
            '                          <green>[name]</green> : proper name of the model field ',
            '                          <green>[type]</green> : "STRING", "DATE", "DATETIME", "INTEGER" ... ',
            ''
        ],

        examples:[
            '> appdev fixture SpiffyWidget WidgetList  name:string date:datetime',
            '    // creates the WidgetList resource: '+path.join('assets','SpiffyWidget','models','WidgetList'),
            '    // creates a server side model: '+path.join('api','models','WidgetList'),
            '    // creates a server side controller: '+path.join('api','controllers','WidgetListController'),
            '    // controller is populated with dummy data based upon your field descriptions',
            '',
        ]
    });

}



var util = null;

Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ModelName = this.options.resource || '?resourceNotFound?';
    this.templateData.modelname = this.templateData.ModelName.toLowerCase();
    this.templateData.fields = this.options.field; //[];
    this.templateData.arrayFields = [];

//AD.log('<yellow>fields:</yellow>');
//AD.log(this.options.field);

    for(var f in this.options.field) {

        // fields can be specified as:
        //  field
        //  field:type
        //  field:type:[multilingual|label]
        //  field:type:[multilingual|label]:[multilingual|label]

        var token = this.options.field[f];

        if (typeof token == 'string') {
            var parts = token.split(':');
            var field = parts[0];


            // store for our sailsJS field list:
            this.templateData.arrayFields.push(field);
        }

    }




    util.debug('templateData:');
    util.debug(this.templateData);


};




Resource.postTemplates = function() {

    var self = this;

    // reuse the appdev resource command to generate our model/controller
    // command:  appdev resource [application] [resource] field1 ...

    var params = this.options.field;
    params.unshift(this.options.resource);
    params.unshift(this.options.application);
    params.unshift('resource');


    AD.spawn.command({
        command:'appdev',
        options:params,
        textFilter:['warn'],
        shouldPipe:true        // when calling another appdev command, allow piping of stdin
    })
    .fail(function(err){
        AD.log.error('<bold>ERROR:</bold> couldn\'t run \'appdev '+params.join(' ')+'\'');
        process.exit(1);
    })
    .then(function(){

        // now patch the controller to include fixture data
        var patchSet = [ {  file:path.join('api', 'controllers', self.options.resource + 'Controller.js'), tag:"};", template:'__fixture_data.ejs', data:{ fields:self.templateData.arrayFields} }
                       ];
        self.patchFile( patchSet, function allDone() {
            // now we are done!
            util.log();
            util.log('<yellow><bold>Done!</bold></yellow>');
            util.log('> You can access this service at:<green><bold>GET /'+self.templateData.modelname+'</bold></green>');
            util.log();

        });

    });

};


