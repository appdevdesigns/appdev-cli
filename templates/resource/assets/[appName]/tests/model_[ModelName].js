// Dependencies
steal(
    "<%= appName %>/models/<%= ModelName %>.js"
)

// Initialization
.then(function(){


    //Define the unit tests
    describe('testing model AD.models.<%= appNameSpace %>.<%= ModelName %> ', function(){


        before(function(){


        });


        it('model definition exists ', function(){
<%
    // we need to figure out how many object initializations to make:
    var partsNameSpace = appNameSpace.split('.');
    var currentNS = '';
    partsNameSpace.forEach(function(part){


        if (currentNS != '') {
            currentNS += '.';
        }
        currentNS += part;  //partsNameSpace[p];

%>            assert.isDefined(AD.models.<%= currentNS %> , ' :=> should have been defined ');
<%
    });
%>            assert.isDefined(AD.models.<%= appNameSpace %>.<%= ModelName %>, ' :=> should have been defined ');
        });

    });


});