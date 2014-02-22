
var Generator = require('./class_generator.js');

var path = require('path');

var Resource = new Generator({
    key:'resource',
    command:'r resource [application] [name] [field1] ... [fieldN]',
    commandHelp: 'Generate a Resource',
    parameters:['application','resource', '[field]'],
    newText:'Creating a new resource ...'
});


module.exports = Resource;

var util = null;

Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.application || '?notFound?';
    this.templateData.ModelName = this.options.resource || '?resourceNotFound?';
    this.templateData.modelname = this.templateData.ModelName.toLowerCase();
    this.templateData.fields = [];

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


        // store for our sailsJS field list:
        this.templateData.fields.push(field+':'+type);

        // store our description object
        desc[field] = type;


        // figure out what our default Label might be.
        defaultLabel = this.chooseLabel(defaultLabel, field, type, parts[2], parts[3]);


    }

    // prepare the description
    this.templateData.description = JSON.stringify(desc, null, 22);

    this.templateData.fieldLabel = defaultLabel;




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

    // have SailsJS now create the Model:
    // command:  sails generate model [ModelName] field1 ...

    var params = this.options.field;
    params.unshift(this.options.resource);
    params.unshift('model');
    params.unshift('generate');

    this.shell('sails', params, ['warn'], function() {
        var params = [];

        // sails generate controller [ControllerName]
        params.unshift(self.options.resource);
        params.unshift('controller');
        params.unshift('generate');

        self.shell('sails', params, ['warn'], function(){

            // now patch the model to specify our adapter!
            var patchData = 'module.exports = {\n\n  connection:"'+self.defaults('adapter')+'",\n\n';
            var patchSet = [ {  file:path.join('api', 'models', self.options.resource + '.js'), tag:"module.exports = {", replace:patchData }
                           ];
            self.patchFile( patchSet, function() {

                // now we are done!
            })

        });

    });

}


