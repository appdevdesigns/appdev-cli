steal(
        'appdev'
).then( function(){

    // Namespacing conventions:
    // AD.models_base.[application].[Model]  --> Object
<%
    // we need to figure out how many object initializations to make:
    var partsNameSpace = appNameSpace.split('.');
    var currentNS = '';
    partsNameSpace.forEach(function(part){


        if (currentNS != '') {
            currentNS += '.';
        }
        currentNS += part;  //partsNameSpace[p];

%>    if (typeof AD.models_base.<%= currentNS %> == 'undefined') AD.models_base.<%= currentNS %> = {};
<%
    });
%>    AD.models_base.<%= appNameSpace %>.<%= ModelName %> = can.Model.extend({
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
            return AD.models.<%= appNameSpace %>.<%= ModelName %>;
        },
        getID: function() {
            return this.attr(AD.models.<%= appNameSpace %>.<%= ModelName %>.fieldId) || 'unknown id field';
        },
        getLabel: function() {
            return this.attr(AD.models.<%= appNameSpace %>.<%= ModelName %>.fieldLabel) || 'unknown label field';
        }
    });


});