steal(
        'appdev',
        '<%= appName %>/models/base/<%= ModelName %>.js'
).then( function(){

    // Namespacing conventions:
    // AD.Model.extend('[application].[Model]', {static}, {instance} );  --> Object
    AD.Model.extend('<%= correctModelName %>', {
/*
        findAll: 'GET /<%= modelname %>/find',
        findOne: 'GET /<%= modelname %>/{id}',
        create:  'POST /<%= modelname %>/create',
        update:  'PUT /<%= modelname %>/update/{id}',
        destroy: 'DELETE /<%= modelname %>/destroy/{id}.json',
        describe: function() {},   // returns an object describing the Model definition
        fieldId: 'fieldName',       // which field is the ID
        fieldLabel:'fieldName'      // which field is considered the Label
*/
    },{
/*
        // Already Defined:
        model: function() {},   // returns the Model Class for an instance
        getID: function() {},   // returns the unique ID of this row
        getLabel: function() {} // returns the defined label value
*/
    });


});