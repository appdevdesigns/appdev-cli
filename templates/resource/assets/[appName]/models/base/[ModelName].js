steal(
        'appdev',
function(){

    // Namespacing conventions:
    // AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
    AD.Model.Base.extend("<%= correctModelName %>", {
        findAll: 'GET /<%= modelURL %>',
        findOne: 'GET /<%= modelURL %>/{id}',
        create:  'POST /<%= modelURL %>',
        update:  'PUT /<%= modelURL %>/{id}',
        destroy: 'DELETE /<%= modelURL %>/{id}',
        describe: function() {
            return <%- description %>;
        },
        // associations:['actions', 'permissions'],
        // multilingualFields:['role_label', 'role_description'],
        // validations: {
        //     "role_label" : [ 'notEmpty' ],
        //     "role_description" : [ 'notEmpty' ]
        // },
        fieldId:'id',
        fieldLabel:'<%= fieldLabel %>'
    },{
        // model: function() {
        //     return AD.Model.get('<%= correctModelName %>'); //AD.models.<%= appNameSpace %>.<%= ModelName %>;
        // },
        // getID: function() {
        //     return this.attr(this.model().fieldId) || 'unknown id field';
        // },
        // getLabel: function() {
        //     return this.attr(this.model().fieldLabel) || 'unknown label field';
        // }
    });


});