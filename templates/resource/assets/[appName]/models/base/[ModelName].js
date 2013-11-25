steal(
        'appdev'
).then( function(){


    AD.models_base.<%= ModelName %> = can.Model.extend({
        findAll: 'GET /<%= modelname %>',
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
            return AD.models.<%= ModelName %>;
        },
        getID: function() {
            return this.attr(AD.models.<%= ModelName %>.fieldId) || 'unknown id field';
        },
        getLabel: function() {
            return this.attr(AD.models.<%= ModelName %>.fieldLabel) || 'unknown label field';
        }
    });


});