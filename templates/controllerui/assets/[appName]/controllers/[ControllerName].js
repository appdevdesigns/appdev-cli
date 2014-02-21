
steal(
        // List your Controller's dependencies here:
        'appdev',
//        '<%= appName %>/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
//        '<%= appName %>/views/<%= ControllerName %>/<%= ControllerName %>.ejs',
function(){

    // Namespacing conventions:
    // AD.controllers.[application].[controller]
<%
    // we need to figure out how many object initializations to make:
    var partsNameSpace = appNameSpace.split('.');
    var currentNS = '';
    for (var p=0; p < partsNameSpace.length; p++){
        if (currentNS != '') {
            currentNS += '.';
        }
        currentNS += partsNameSpace[p];

%>    if (typeof AD.controllers.<%= currentNS %> == 'undefined') AD.controllers.<%= currentNS %> = {};
<%
    }
%>    AD.controllers.<%= appNameSpace %>.<%= ControllerName %> = AD.classes.UIController.extend({


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                    templateDOM: '<%= appName %>/views/<%= ControllerName %>/<%= ControllerName %>.ejs',
            }, options);
            this.options = options;

            // Call parent init
            AD.classes.UIController.apply(this, arguments);


            this.dataSource = this.options.dataSource; // AD.models.Projects;

            this.initDOM();


        },



        initDOM: function () {

            this.element.html(can.view(this.options.templateDOM, {} ));

        },



        '.ad-item-add click': function ($el, ev) {

            ev.preventDefault();
        },


    });


});