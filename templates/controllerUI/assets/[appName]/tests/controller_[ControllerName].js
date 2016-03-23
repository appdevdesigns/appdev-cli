// Dependencies
steal(
    "<%= appName %>/controllers/<%= ControllerName %>.js",
// Initialization
function(){

    // the div to attach the controller to
    var divID = 'test_<%= ControllerName %>';

    // add the div to the window
    var buildHTML = function() {
        var html = [
                    '<div id="'+divID+'">',
                    '</div>'
                    ].join('\n');

        $('body').append($(html));
    }
    

    //Define the unit tests
    describe('testing controller AD.controllers.<%= appNameSpace %>.<%= ControllerName %> ', function(){

        var testController = null;

        before(function(){

            buildHTML();

            // Initialize the controller
            testController = new AD.controllers.<%= appNameSpace %>.<%= ControllerName %>($('#'+divID), { some:'data' });

        });



        it('controller definition exists ', function(){
<%
    // we need to figure out how many object initializations to make:
    var partsNameSpace = appNameSpace.split('.');
    var currentNS = '';
    partsNameSpace.forEach(function(part){


        if (currentNS != '') {
            currentNS += '.';
        }
        currentNS += part;  //partsNameSpace[p];

%>            assert.isDefined(AD.controllers.<%= currentNS %> , ' :=> should have been defined ');
<%
    });
%>            assert.isDefined(AD.controllers.<%= appNameSpace %>.<%= ControllerName %>, ' :=> should have been defined ');
              assert.isNotNull(AD.Control.get('<%= correctControllerName %>'), ' :=> returns our controller. ');
        });


    });


});