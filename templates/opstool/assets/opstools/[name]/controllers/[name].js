
steal(
        // List your Controller's dependencies here:
        'appdev',
//        '/opstools/<%= name %>/models/[modelName].js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
//        '/opstools/<%= name %>/views/<%= name %>/<%= name %>.ejs',
function(){

    // OpsTool Namespacing conventions:
    // AD.controllers.opstools.[application].Tool
<%
    // we need to figure out how many object initializations to make:
    var partsNameSpace = appNameSpace.split('.');
    var currentNS = '';
    partsNameSpace.forEach(function(part){


//    for (var p=0; p < partsNameSpace.length; p++){
        if (currentNS != '') {
            currentNS += '.';
        }
        currentNS += part;  //partsNameSpace[p];

%>    if (typeof AD.controllers.<%= currentNS %> == 'undefined') AD.controllers.<%= currentNS %> = {};
<%
    });
%>    AD.controllers.<%= appNameSpace %>.Tool = AD.classes.opsportal.OpsTool.extend({


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                    templateDOM: '//opstools/<%= name %>/views/<%= name %>/<%= name %>.ejs',
                    resize_notification: '<%= name %>.resize',
                    tool:null   // the parent opsPortal Tool() object
            }, options);
            this.options = options;

            // Call parent init
            AD.classes.opsportal.OpsTool.prototype.init.apply(this, arguments);


            this.dataSource = this.options.dataSource; 

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