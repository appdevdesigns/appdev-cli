
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var $ = require('jquery');
var AD = require('ad-utils');

var Util = require('./helpers/util_helper.js');

var assert = require('chai').assert;

(function() {


    var initialCWD = null;
    var pathForCommand = path.join(__dirname, 'scratchArea', 'cuiTest');


    var createCUI = function( appName, controllerName, done) {
        // use this function to run the appdev cui command:

        AD.spawn.command({
            command:'appdev',
            options:[ 'controllerUI', appName, controllerName ],
            shouldEcho:false
        })
        .fail(function(err){
            done(err);
        })
        .then(function(data) {
            done();
        });
    };

    describe('test appdev controllerUI :applicationName :Tool ',function(){

    	//Before the unit tests are executed, create the testing directory structure
    	before(function(done){
    	    this.timeout(10000);

    	    initialCWD = process.cwd();

    	    // run this command from the test/scratchArea/cuiTest directory

    	    // make sure any previous test director for this test is gone
    	    Util.removeDir(pathForCommand)
            .fail(function(err){
                done(err);
            })
    	    .then(function(data){

    	        // now create the cuiTest directory:
    	        Util.adnDir({ path: pathForCommand })
                .fail(function(err){
                    done(err);
                })
    	        .then(function(data){

                    // move us into that directory
                    process.chdir(pathForCommand);
                    done();
    	        });

    	    });


    	});

    	//After the tests are run, delete our cuiTest directories
    	after(function(done){

    	    // return to our top level directory
    	    process.chdir(initialCWD);

    	    // remove /api & /assets directories
    	    Util.removeDir(pathForCommand)
            .fail(function(err){

                // dang!
                done(err);
            })
    	    .then(function() {

    	        // all good, continue
    	        done();
    	    });

    	});



        // TEST 1:  create a cui with application name = single directory
        describe(':: Make sure a single application dir works properly ', function(){

            var appName = 'testApplication1';
            var controllerName = 'TestController';

            var controllerPath = path.join(pathForCommand, 'assets', appName, 'controllers', controllerName + '.js');
            var controllerFile = '';

            var viewPath = path.join(pathForCommand, 'assets', appName,  'views', controllerName, controllerName+'.ejs');
 //           var viewFile = '';

            before(function(done){

                createCUI(appName, controllerName, function(err){
                    if (err) {
//AD.log('createCUI returned error:');
                        done(err);
                    } else {
//AD.log('createCUI ok,  reading file:');
                        fs.readFile(controllerPath, 'utf8', function (err, data) {

                            if (err) {
//AD.log('readFile returned error:');
                                done(err);
                            } else {

                                // controller successfully read in
                                controllerFile = data;

                                done();

                            }
                        });
                    }
                });  // end createCUI()
            });



            it(' -> the controller exists ',function(){
                var found = fs.existsSync(controllerPath);
                assert.isTrue(found,' => yup, our controller exists.');
            });


            it(' -> the view exists ',function(){
                var found = fs.existsSync(viewPath);
                assert.isTrue(found,' => yup, our view exists.');
            });

            // We no longer need to do this:
            // it(' -> the controller has 1 == applicationNameSpace check ',function(){
            //     var parts = controllerFile.split("'undefined'");
            //     assert.equal(parts.length, 2, ' => 1 application Name Space check');
            // });

        });  // End TEST 1



        // TEST 2:  create a cui with application name = 2 directories
        describe(':: Make sure a double application dir works properly ',
            function(){

                var appName = 'testApplication2/subDir';
                var controllerName = 'TestController';

                var controllerPath = path.join(pathForCommand, 'assets', appName,
                    'controllers', controllerName + '.js');
                var controllerFile = '';

                var viewPath = path.join(pathForCommand, 'assets', appName,
                    'views', controllerName, controllerName+'.ejs');
    //            var viewFile = '';

                before(function(done){

                    createCUI(appName, controllerName, function(err){
                        if (err) {
                            done(err);
                        } else {

                            fs.readFile(controllerPath, 'utf8',
                                function (err, data) {

                                    if (err) {
                                        done(err);
                                    } else {

                                        // controller successfully read in
                                        controllerFile = data;

                                        done();
                                    }
                            });
                        }
                    });  // end createCUI()
                });



                it(' -> the controller exists ',function(){
                    var found = fs.existsSync(controllerPath);
                    assert.isTrue(found,' => yup, our controller exists.');
                });


                it(' -> the view exists ',function(){
                    var found = fs.existsSync(viewPath);
                    assert.isTrue(found,' => yup, our view exists.');
                });


                // it(' -> the controller has 2 == applicationNameSpace checks ',
                //     function(){
                //         var parts = controllerFile.split("'undefined'");
                //         assert.equal(parts.length, 3,
                //             ' => 2 application Name Space checks');
                // });

        });  // End TEST 2



        // TEST 3:  create a cui with application name = 3 directories
        describe(':: Make sure a triple application dir works properly ',
            function(){

                var appName = 'testApplication2/subDir1/subDir2';
                var controllerName = 'TestController';

                var controllerPath = path.join(pathForCommand, 'assets',
                        appName, 'controllers', controllerName + '.js');
                var controllerFile = '';

                var viewPath = path.join(pathForCommand, 'assets', appName
                        ,  'views', controllerName, controllerName+'.ejs');

                before(function(done){

                    createCUI(appName, controllerName, function(err){
                        if (err) {
                            done(err);
                        } else {

                            fs.readFile(controllerPath, 'utf8',
                                function (err, data) {

                                    if (err) {
                                        done(err);
                                    } else {

                                        // controller successfully read in
                                        controllerFile = data;

                                        done();
                                    }
                                });
                        }
                    });  // end createCUI()
                });



                it(' -> the controller exists ',function(){
                    var found = fs.existsSync(controllerPath);
                    assert.isTrue(found,' => yup, our controller exists.');
                });


                it(' -> the view exists ',function(){
                    var found = fs.existsSync(viewPath);
                    assert.isTrue(found,' => yup, our view exists.');
                });


                // it(' -> the controller has 3 == applicationNameSpace checks ',
                //     function(){
                //         var parts = controllerFile.split("'undefined'");
                //         assert.equal(parts.length, 4,
                //             ' => 2 application Name Space checks');
                // });

        });  // End TEST 3


    });


})();