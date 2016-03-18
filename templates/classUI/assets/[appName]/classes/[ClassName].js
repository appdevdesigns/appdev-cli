
steal(
        // List your Class's dependencies here:
function(){
System.import('appdev').then(function() {
	steal.import('appdev/ad').then(function() {
		
    // Namespacing conventions:
    // AD.classes.[application].[Class]  --> Object
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

%>    if (typeof AD.classes.<%= currentNS %> == 'undefined') AD.classes.<%= currentNS %> = {};
<%
    });
%>    AD.classes.<%= appNameSpace %>.<%= ClassName %> = can.Control.extend({

        init: function( element, options ) {
            var self = this;
            this.options = AD.defaults({
                resize_notification: 'opstool.resize'
            }, options);

        },


        myClassMethod: function() {
            // fill this in
            return true;
        }


    });


});
});
});
