
var Generator = require('./class_generator.js');

var path = require('path');

var Resource = new Generator({
    key:'form',
    command:'f form [path/to/model] [path/to/view.ejs]',
    commandHelp: 'Generate a form from a model',
    parameters:['model','viewPath'],
    newText:'Creating a new form ...'
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev form <yellow><bold>[path/to/model] [path/to/view.ejs]</bold></yellow>',
        description:[ 
            'This command creates a client side form-view from the description of a model.'

        ].join('\n'),
        parameters:[
            '<yellow>[path/to/model]</yellow>         :   path to your model.js description (assumes /api/models directory)',
            '<yellow>[path/to/view.ejs]</yellow>      :   path and name of the view file to create (/assets folder)'
        ],

        examples:[
            '> appdev form myModel.js opstool/MyProject/views/Controller/newForm.ejs',
            '    // reads model from '+path.join('api', 'models', 'myModel.js')+' ',
            '    // creates view in '+path.join('assets','opstool', 'MyProject', 'views', 'Controller', 'newForm.ejs'),
            '',
        ]
    });

}




var util = null;
var fs = require('fs');

Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.model = this.options.model || '?modelNotFound?';

    var modelParts = this.options.model.split('/');
    var modelName = modelParts[modelParts.length-1].split('.')[0];
    this.templateData.modelName = modelName;

    var viewParts = this.options.viewPath.split('/');
    var term = viewParts.shift();
    while(term != 'pages') {
        term = viewParts.shift();
    }

    this.templateData.pageName = viewParts.shift();
    this.templateData.viewName = viewParts.shift().split('.')[0];


    util.debug('templateData:');
    util.debug(this.templateData);




    //find the model info and pull in the info
    var modelPath = path.join('api', 'models', this.options.model);
    if (modelPath.indexOf('.') == -1)  modelPath = modelPath +'.js';

    // if !fileexists /api/models/[model] then
    if (!fs.existsSync(modelPath)) {

        // error ('could not find /api/models/[model]');
        util.error('could not find model:'+ modelPath);
        process.exit(1);

    } else {

        modelPath = path.join( process.cwd(), modelPath);

        // else
        var modelInfo = require( modelPath );

        this.templateData.attributes = modelInfo.attributes;

    }


}





