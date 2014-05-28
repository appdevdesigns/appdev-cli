// Dependencies
steal(
    "<%= appName %>/classes/<%= ClassName %>.js"
)

// Initialization
.then(function(){


    //Define the unit tests
    describe('testing class AD.classes.<%= appNameSpace %>.<%= ClassName %> ', function(){

        var iClass = null;

        before(function(){

            // Initialize the controller
            iClass = new AD.classes.<%= appNameSpace %>.<%= ClassName %>({ some:'data' });

        });


        it('myClassMethod() return true', function(){
            assert.ok(iClass.myClassMethod(), ' :=> should have returned true ');
        });

    });


});