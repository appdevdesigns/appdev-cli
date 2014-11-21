
var Generator = require('./class_generator.js');

var Build = new Generator({
    key:'build',
    command:'build [app:[appName]] [config:[config]] ',
    commandHelp: 'Compress and minify the .js, .css, .ejs resources for a client application.',
    parameters:[ '[options]' ],
    newText:'Building current application...',
    atRoot:false,    // don't operate from the root directory!
    usesTemplates:false
});


module.exports = Build;



Build.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev build <green><bold>[path/to/App1] [path/to/App2] ... [path/to/AppN]</bold></green>',
        description:[ 
            'This command runs steal.build on your client side application.  Use this command to build production ready compressed/minimized bundles for loading your application.',
            '',
            '    Run this command in the assets directory of your sails project.',
            '',
            '    By default, this app will look for a "build.appdev.js" file that specifies the steal() commands to load your app.',
            '',
            '    In order for the building to work, you need to have '+path.join('assets', 'canjs')+' and '+path.join('assets','steal')+' ',
            '    development libraries installed.  And move the '+path.join('assets', 'steal', 'js')+' -> '+path.join('assets','cjs')+'. ',
            '    If you don\'t you can run the <yellow>appdev develop</yellow> command in your sails root directory to set this up.' 
        ].join('\n'),
        parameters:[

        '<green>[path/to/App]</green>    : <green>(optional)</green> the path to the client side project ',
        '                       you want steal to build.'
        ],

        examples:[
            '> appdev build [project]',
            '    // <green>reads:</green> in '+path.join('assets', '[project]', 'build.appdev.js')+' command resource',
            '    // <green>executes:</green> the specified build command ',
            '    // <green>creates:</green> '+path.join('[project]', 'production.js')+'.',
            '    // <green>creates:</green> '+path.join('[project]', 'production.css')+'.',
            '',
            '> appdev build',
            '    // <green>scans:</green> all directories in assets/ to find ones that contain the build.appdev.js',
            '    // <green>executes:</green> the specified build commands for each project found ',
            '    // <green>creates:</green> '+path.join('[project]', 'production.js')+' for each project',
            '    // <green>creates:</green> '+path.join('[project]', 'production.css')+' for each project',
        ]
    });

}



var util = null;
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


var stealTools = require("steal-tools");

Build.prepareTemplateData = function () {
    var self = this;
    util = this.adg;

    this.templateData = {};

    this.cwd = process.cwd();

/*    
    var dirParts = this.cwd.split('assets'+path.sep);
    var subDirs = [];
    if (dirParts.length>1) subDirs = dirParts[1].split(path.sep);
    var assetsDirArray = [];
    subDirs.forEach(function(dir){
        assetsDirArray.push('..');
    })
    
    var assetsDir = assetsDirArray.join(path.sep);
// AD.log('...assetsDir:'+assetsDir);

*/
        // a simple fn() to display a message and quit.
    var quitOut = function (message) {
        AD.log();
        AD.log(message);
        AD.log();
        process.exit(1);
    }

//    this.templateData.appName = this.options.application || '?notFound?';
//    this.templateData.ControllerName = this.options.name || '?resourceNotFound?';

/* 
 //// Our attempt to use the 'steal-tools'  package:

    this.templateData.config = {
        main:path.join('OpsPortal'),
        config: path.join(this.cwd , 'OpsPortal', 'build.config.js'),
        // baseURL:assetsDir
    };

    this.templateData.options = {
        minify:true,
        bundleSteal:false,
        debug: false,
        quiet: false,
        bundleDepth: 3,
        mainDepth: 3
    }

    util.debug('templateData:');
    util.debug(this.templateData);

    var self = this;




    // now process the possible parameters:
    this.options.options.forEach(function(option){
        var parts = option.split(':');

        switch(parts[0]) {
            case 'app':
            case 'build':
                // set the build file:
                self.templateData.config.main = parts[1];
                var pathFile = path.join(self.cwd , parts[1]);

                if (!fs.existsSync(pathFile)) {
                    quitOut('couldn\'t find specified '+parts[0]+' at ['+pathFile+']');
                }
                break;

            case 'config':
quitOut(' param config:[] not implemented yet!');
                break;
        }
    })
*/

    //// For now, implement our command line approach

    // appdev build [appdev OpsPortal, opstool/Dashboard, ...]
    this.templateData.apps = [];


        // now process the possible parameters:
    this.options.options.forEach(function(option){
        var parts = option.split(':');

        switch(parts[0]) {
            case 'app':
            case 'build':
                // set the build file:
                self.templateData.config.main = parts[1];
                var pathFile = path.join(self.cwd , parts[1]);

                if (!fs.existsSync(pathFile)) {
                    quitOut('couldn\'t find specified '+parts[0]+' at ['+pathFile+']');
                }
                break;

            case 'config':
quitOut(' param config:[] not implemented yet!');
                break;

            default:
                self.templateData.apps.push(parts[0]);
                break;
        }
    });


    // if we didn't get any Apps to build, then scan and find all buildable apps
    if (this.templateData.apps.length == 0) {

        this.templateData.apps = AD.module.buildableAppsInPath();

    } else {

        var modifiedApps = [];
        this.templateData.apps.forEach(function(app){ 

            var foundApp = AD.module.buildableAppsInPath( path.join(self.cwd, app), self.cwd );
            if (foundApp.length == 0) {

                quitOut('<yellow><bold>'+app+'</bold></yellow> doesn\'t appear to be a buildable app.');

            } else {

                foundApp.forEach(function(app) {
                    modifiedApps.push(app);
                })
                
            }
        })

        this.templateData.apps = modifiedApps;
    }

// AD.log('... allBuildableApps() : ', this.templateData.apps );

};



Build.postTemplates = function() {

    var self = this;

    var remainingSteps = [
            // 'toAssetsDir',          // make sure we are running from the assets directory
            // 'verifyDevelopTools',       // save the current stealconfig.js -> _bak_stealconfig.js
            'processApps'             // process each app's  build.appdev.js  script.
        ];
    


    this.methodStack(remainingSteps, function() {

        // when they are all done:

        AD.log();
        AD.log('<yellow> > build finished </yellow>');
        AD.log();

    });

};



Build.processApps = function(done) {
    var self = this;

// AD.log('... backupStealConfig()');
    var pathStealConfig = path.join(this.cwd,'stealconfig.js');
    

    var processApp = function (indx, cb) {

        if (indx >= self.templateData.apps.length) {
            cb();
        } else {

            var app = self.templateData.apps[indx];


            // // link to app's steal config
            // var pathBuildConfig = path.join(app.path, 'build.config.js');
            // fs.symlinkSync(pathBuildConfig, self.pathStealConfig);

            // load app's build.appdev.js
            var appBuild = require(path.join(app.path, 'build.appdev.js'));

            
            // run appBuild.command
            appBuild.command(self, function(err) {

                // // unlink app's steal config
                // fs.unlinkSync(pathStealConfig);

                if (err) {
                    cb(err);
                } else {
                    // process the next app
                    processApp(indx+1, cb);
                }
            })

        }

    }
    processApp(0, function(err) {
        done(err);
    });


}



Build.replaceStealConfig = function(done) {
    var self = this;

// AD.log('... replaceStealConfig()');

    // remove any existing stealconfig.js file
    var stealPath = path.join(this.cwd, 'stealconfig.js');
    if (fs.existsSync(stealPath)) {
        AD.log('... removing left over stealconfig.js');
        fs.unlinkSync(stealPath);
    }

    AD.log('<green>restoring</green> '+this.nameStealBackup.replace(this.cwd+path.sep, '')+' -> stealconfig.js');
    fs.renameSync(this.nameStealBackup, stealPath);

    done()

}



Build.backupProduction = function(opt) {
    var self = this;

    // usually it is OpsPortal/production.js
    var base = opt.base || 'OpsPortal';  
    var name = opt.file || 'production.js';

    // this is the file to backup:
    var pathProduction = path.join(self.cwd, base, name);
    if (fs.existsSync(pathProduction)) {


        //// find an unused name for the backup file
        var counter = 0;
        var newFile = function () { 
            // AD.log('... newFile check '+counter); 
            return path.join(self.cwd, base, '_bak'+counter+'_'+name); 
        }
        while(fs.existsSync(newFile())) {
            counter++; 
        }
        var nameBackup = newFile();


        AD.log('<green>saving</green> '+path.join(base, name)+' -> '+ nameBackup.replace(self.cwd+path.sep, ''));

        
        fs.renameSync(pathProduction, nameBackup);

    }

    return nameBackup;
}



Build.replaceProduction = function(opt) {
    var self = this;

    // usually it is OpsPortal/production.js
    var base = opt.base || 'OpsPortal';  
    var name = opt.file || 'production.js';
    var backUpName = opt.backup || 'noBackupFileProvided!!!';

    if ((backUpName != 'noBackupFileProvided!!!')
        && (backUpName != '')) {

        // remove any existing production.js file
        var prodPath = path.join(self.cwd,base, name);
        if (fs.existsSync(prodPath)) {
            AD.log('... removing generated '+path.join(base, name));
            fs.unlinkSync(prodPath);
        }

        AD.log('<green>restoring</green> '+backUpName.replace(self.cwd+path.sep, '')+' -> '+ path.join(base, name));
        fs.renameSync(backUpName, prodPath);

    }

}



// var isBuildableApp = function(dirPath) {
//     var files = {
//         // 'build.js':1,
//         'build.appdev.js':1,
//         'build.config.js':1,
//         // 'build.html':1
//     }

//     var result = true;

//     for(var file in files) {

//         var checkPath = path.join(dirPath, file);
// // AD.log('       checkForFile : '+ checkPath);
//         if (!fs.existsSync(checkPath)) {
//             result = false;
//             break;
//         }
//     }

//     return result;
// }



/*
 * @function allBuildableApps
 *
 * recursively scan all the directories in the give startPath, for directories that resemble
 * our appdev application format:
 *   - contains a build.js,  build.appdev.js, build.config.js, build.html
 *
 * @param {string} startPath  the path to start searching from
 * @return {array}  an array of directories that are buildable apps.
 */
// these are expected directories that we don't have to search for buildable apps:
// var ignoreDirectories = '[bootstrap] [can] [canjs] [fonts] [images] [jquery] [js] [jmvc] [steal] [style]';
// var allBuildableApps = function( currentPath ) {

//     var apps = [];

//     if (!currentPath) {
//         currentPath = process.cwd();
//     }

// // AD.log('... currPath:'+currentPath);

//     if (isBuildableApp(currentPath)) {
// // AD.log('   ... BUILDABLE!  adding :'+currentPath);
//         apps.push({ linked:false, path:currentPath, command:currentPath.replace(process.cwd()+path.sep, '') });
//     } else {
// // AD.log('   ... NOT BUILDABLE! so scan it.');
//         // for each file/directory in our currentPath, 
//          var files = fs.readdirSync(currentPath);
//         files.forEach(function(file){

//             // if this isn't one of our expected directories that should be ignored:
//             if (ignoreDirectories.indexOf('['+file+']') == -1 )  {

//                 var filePath = path.resolve(currentPath, file );

//                 // if this file actually exists
//                 // NOTE: unix systems can have symbolic links to not existant files
//                 if ( fs.existsSync(filePath)) {


//                     var stats = fs.lstatSync(filePath);
// // AD.log('   ... checking file:'+filePath);
//                     if (stats.isDirectory()) {
// // AD.log('   ... Directory: '+filePath);

//                         var containsApps = allBuildableApps(filePath);

//                         containsApps.forEach(function(app){
//                             apps.push(app);
//                         });
                            
//                     }

//                     // if our file is a symbolic link to another directory
//                     if (stats.isSymbolicLink()) {

//                         // get the realPath to that directory/file
//                         var realPath = path.resolve(currentPath, fs.readlinkSync(filePath));

//                         // if this linked item was a directory
//                         var checkDir = fs.lstatSync(realPath);
//                         if (checkDir.isDirectory()) {

//                             // recheck this with proper directory
//                             var containsApps = allBuildableApps(realPath);

//                             // for every returned app, update to indicate it was linked
//                             containsApps.forEach(function(app) {
//                                 app.linked = true;
//                                 app.command = path.join(currentPath, file).replace(process.cwd()+path.sep, '');
//                                 apps.push(app);
//                             })
//                         }

//                     }

//                 } // end if exists

//             }  // end if not ignored file

//         })  // end files.forEach();
//     }

//     return apps;

// }

