var chai = require('chai');
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');
var async = require('async');


var Util = require('./helpers/util_helper.js');


describe('test appdev adn ',function(){

    var testPath = path.join(__dirname, 'scratchArea', 'testCommandADN');
    var currentPath = process.cwd();

    before(function(done){

        async.series([

            // step 1: create testPath
            function(next) {

                fs.exists(testPath, function (exists) {
                    if (!exists) {
                        fs.mkdir(testPath,function(err){

                            if (err) {
                                next(err);

                            } else {
                                next();
                            }
                        });
                    } else {
                        next();
                    }
                });
            },

            // step 2: enter testPath
            function(next) {
                process.chdir(testPath);
                next();
            },

            // step 3: run AppDev adn command:
            function(next) {
                AD.spawn.command({
                    command:'appdev',
                    options:['adn'],
                    exitTrigger:'> done',
                    shouldEcho:false
                })
                .fail(function(err){
                    next(err);
                })
                .done(function(){
                    next();
                })
            }
        ],function(err, results){

            done(err);
        })

    });

    after(function(done){

        // return to proper directory:
        process.chdir(currentPath);

        // remove test directory:
        AD.spawn.command({
            command:'rm',
            options:['-R', testPath],
            shouldEcho:false
        })
        .then(function(data) {
            done();
        })
        .fail(function(err){
            done(err);
        });
    })

    it('check for .adn file',function(done){
        fs.exists(path.join(testPath, ".adn"),function(exists){
            chai.assert.deepEqual(exists,true);
            done();
        });
    });

});