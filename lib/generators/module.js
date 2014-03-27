
var Generator = require('./class_generator.js');

var Module = new Generator({
    key:'module',
    command:'m module [moduleName]',
    commandHelp: 'Create a new module definition in the current directory',
    parameters:[ 'moduleName'],
    newText:'creating a new NPM module package ... '
});


module.exports = Module;

var util = null;
var fs = require('fs');
var path = require('path');

var AD = require('ad-utils');


/**
 * This creates new npm modules that can be installed into sails
 * projects.  This routine doesn't need to be run in the Root of
 * an AppdevJS project.
 *
 * So we override the class_generator.toRoot() here to do nothing.
 */
Module.toRoot = function () {

};



//// Now the rest of the process can look like a standard generator process:
////    .parseOptions()         // read in the command line params
////    .prepareTemplateData(), // convert options to templateData
////    .parseTemplates(),      // copy/create any files/directories
////    .postTemplates();       // do additional work here



Module.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.moduleName = this.options.moduleName || '?notFound?';

    util.debug('templateData:');
    util.debug(this.templateData);

    //  only use this command to create new plugins
    var pathToModule = path.join(process.cwd(), this.templateData.moduleName);
    if ( fs.existsSync(pathToModule)) {

        var displayPath = pathToModule.replace(process.cwd(), '');
        util.log();
        util.log("<yellow>directory " + displayPath + " already exists.</yellow>");
        util.log("<yellow>use this command to only create new modules.</yellow>");
        util.log();

        process.exit(0);
    }


//// TODO: should probably verify this is not being run inside of an appdevJS project.


};



Module.postTemplates = function() {

    var self = this;

    var remainingSteps;


    var originalDir = process.cwd();

    // directory is already created, so cd into directory
    process.chdir(path.join(process.cwd(), this.templateData.moduleName));


    remainingSteps = [
        'npmQuestions',         // Ask the Questions for CAS Auth
        'installDependencies',  // install any npm dependencies for a module
 //       'cloneIt',          // git clone into node_modules
 //       'installIt',        // npm install cas
 //       'updateAuthType'    // update /config/appdev.js authType = 'CAS'
    ];




    this.methodStack(remainingSteps, function() {

        // when they are all done:

        util.log();
        util.log('<yellow>finished creating plugin.</yellow>');
        util.log();
        util.log();

        process.chdir(originalDir);
        process.exit(0);

    });


};




/**
 * @function installDependencies
 *
 * Install any required dependencies for the plugin
 *
 */
Module.installDependencies = function(done) {

    var listDependencies = [

        // > npm install appdevdesigns/ad-util --save
        { command:'npm', options:[ 'install',  'appdevdesigns/ad-utils', '--save'], textFilter:['npm', 'http'], log:'<green><bold>installing:</bold> ad-utils </green>', shouldEcho:false },

    ];

    AD.spawn.series(listDependencies)
    .fail(function(err){
        AD.log();
        AD.log.error('<red><bold>Error:</bold> Installing dependencies</red>');
        AD.log(err);
        AD.log();
        process.exit(1);
    })
    .then(function(data){
        done();
    });

};



/**
 * @function npmQuestions
 *
 * Ask some basic questions concerning the initial package.json file
 *
 */
Module.npmQuestions = function(done) {
    var self = this;


    var questionKeys = {
            'author:'       :'author',
            'description:'  :'description',
            'version:'      :'version',
            'git repository:':'gitRepo',
    };


    var defaultRepo = 'appdevdesigns/'+this.templateData.moduleName;

    var qset =  {
          question:'author:',
          data: 'author',
          def:  'codingMonkey',
          then:[

                {
                    question:'description:',
                    data:'description',
                    def :'a cool project',
                },
                {
                    question:'version:',
                    data:'version',
                    def :'0.0.0',
                },
                {
                    question:'git repository:',
                    data:'gitRepo',
                    def :defaultRepo,
                    post:function(data) {

                        // enable shortcut:  [gitaccount]/[gitproject]

                        // if missing full git url:  git://github.com/appdevdesigns/appdev-hris2.git
                        if (data.gitRepo.indexOf('git://github.com/') == -1 ) {
                            data.gitRepo = 'git://github.com/' + data.gitRepo;
                        }

                        if (data.gitRepo.indexOf('.git') == -1) {
                            data.gitRepo = data.gitRepo + '.git';
                        }
                    }
                }

          ]
      };


    this.questions(qset, function(err, data) {

        // don't continue if there was an error
        if (err) {

            process.exit(1);

        } else {

            var responses = {
                    'name:':'\n',
                    'entry point:': 'module.js\n',
                    'test command:': 'make test\n',
                    'keywords': '\n',
                    'license': '\n',
                    'Is this ok?': '\n'
            };
            for (var key in questionKeys) {
                responses[key] = data[questionKeys[key]] + '\n';
            }

            util.debug('responses:');
            util.debug(responses);

            AD.spawn.command({
                command:'npm',
                options:['init'],
                shouldEcho:false,
                responses:responses,
                exitTrigger:'ok?',
            })
            .fail(function(err){
                AD.log.error('<red> NPM init exited with an error</red>');
                AD.log(err);
                process.exit(1);
            })
            .then(function(code){
                done();
            });


        }

    });

};
