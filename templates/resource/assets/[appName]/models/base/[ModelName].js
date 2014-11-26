steal(
        'appdev'
).then( function(){

    // Namespacing conventions:
    // AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
    AD.Model.Base.extend("<%= correctModelName %>", {
        findAll: 'GET /<%= modelname %>/find',
        findOne: 'GET /<%= modelname %>/{id}',
        create:  'POST /<%= modelname %>/create',
        update:  'PUT /<%= modelname %>/update/{id}',
        destroy: 'DELETE /<%= modelname %>/destroy/{id}.json',
        describe: function() {
            return <%- description %>;
        },
        fieldId:'id',
        fieldLabel:'<%= fieldLabel %>'
    },{
        model: function() {
            return AD.Model.get('<%= correctModelName %>'); //AD.models.<%= appNameSpace %>.<%= ModelName %>;
        },
        getID: function() {
            return this.attr(this.model().fieldId) || 'unknown id field';
        },
        getLabel: function() {
            return this.attr(this.model().fieldLabel) || 'unknown label field';
        }
    });


});