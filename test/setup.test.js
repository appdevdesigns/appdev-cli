var chai = require('chai');
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


/*
 * Before we run our unit tests, be sure our scratch directory is empty!
 */
before(function(done){

    var pathScratchArea = path.join(__dirname, 'scratchArea');

    var filesInDir = fs.readdirSync(pathScratchArea);

    // remove our .gitkeep file from the list
    var removeGitKeep = filesInDir.indexOf('.gitkeep');
    if (removeGitKeep > -1) {
        filesInDir.splice(removeGitKeep, 1);
    }

    // recursively remove any directories found!
    var removeNext = function(cb) {

        if (filesInDir.length == 0) {
            cb();
        } else {
            var toDel = path.join(pathScratchArea, filesInDir.shift());

            AD.spawn.command({
                command:'rm',
                options:['-R', toDel],
                shouldEcho:false
// shouldEcho:true
            })
            .fail(function(err){
                done(err);
            })
            .then(function(){
                removeNext(cb);
            });
        }
    }

    removeNext(function() {

        done();
    });


});



after(function(done){
    done();
})