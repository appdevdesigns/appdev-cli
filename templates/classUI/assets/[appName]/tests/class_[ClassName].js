// Dependencies
steal(
    "<%= appName %>/classes/<%= ClassName %>.js",
// Initialization
function(){


    //Define the unit tests
    describe('testing class AD.classes.<%= appNameSpace %>.<%= ClassName %> ', function(){

        var iClass = null;

        before(function(){

            // Initialize the controller
            iClass = new AD.classes.<%= appNameSpace %>.<%= ClassName %>({ some:'data' });

        });


        it('class definition [AD.classes.<%= appNameSpace %>.<%= ClassName %>] exists ', function(){
<%
    // we need to figure out how many object initializations to make:
    var partsNameSpace = appNameSpace.split('.');
    var currentNS = '';
    partsNameSpace.forEach(function(part){


        if (currentNS != '') {
            currentNS += '.';
        }
        currentNS += part; 

%>            assert.isDefined(AD.classes.<%= currentNS %> , ' :=> should have been defined ');
<%
    });
%>            assert.isDefined(AD.classes.<%= appNameSpace %>.<%= ClassName %>, ' :=> should have been defined ');
        });


        it('myClassMethod() return true', function(){
            assert.ok(iClass.myClassMethod(), ' :=> should have returned true ');
        });

    });


});