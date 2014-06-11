
var Generator = require('./class_generator.js');

var Module = new Generator({
    key:'plugin',
    command:'plugin [pluginName]',
    commandHelp: 'Create a new plugin definition in the current directory',
    parameters:[ 'moduleName'],
    newText:'creating a new NPM plugin package ... '
});


module.exports = Module;

var util = null;
var fs = require('fs');
var path = require('path');

var AD = require('ad-utils');





Module.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev plugin [pluginName]',
        parameters:[
            '[pluginName]  :   the new name for the plugin. '
        ],

        examples:[
            '> appdev plugin spiffyPlugin'
        ]
    });

}


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


    // initial guess at gitRepo
    this.templateData.gitRepo = 'appdevdesigns/'+this.templateData.moduleName;


    util.debug('templateData:');
    util.debug(this.templateData);

    //  only use this command to create new plugins
    var pathToModule = path.join(process.cwd(), this.templateData.moduleName);
    if ( fs.existsSync(pathToModule)) {

        var displayPath = pathToModule.replace(process.cwd(), '');
        AD.log();
        AD.log("<yellow>directory " + displayPath + " already exists.</yellow>");
        AD.log("<yellow>use this command to only create new modules.</yellow>");
        AD.log();

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
        'pluginQuestions',      // Ask questions about the plugin setup
        'npmQuestions',         // Ask the Questions for making the npm package
        'installDependencies',  // install any npm dependencies for this plugin
        'addScripts',           // add the postinstall & postupdate scripts
        'patchFiles'            // make any final patches to files
    ];




    this.methodStack(remainingSteps, function() {

        // when they are all done:

        AD.log();
        AD.log('<yellow>finished creating plugin.</yellow>');
        AD.log();

        process.chdir(originalDir);
        process.exit(0);

    });


};




/**
 * @function addScripts
 *
 * Our plugins need a 'postinstall' & 'postupdate' script setting:
 *
 */
Module.addScripts = function(done) {

    // read in the current package.json file
    var packageContents = fs.readFileSync('./package.json', { encoding:'utf8'});


    // convert to an object
    var packageObj = JSON.parse(packageContents);
    if (typeof packageObj.scripts == 'undefined') {
        packageObj.scripts = {};
    }


    // add the script references
    packageObj.scripts.postinstall = 'node setup/setup.js';
    packageObj.scripts.postupdate  = 'node setup/setup.js';


    // convert back to string and save
    var packageObjData = JSON.stringify(packageObj, null, 4);
    fs.writeFileSync('./package.json', packageObjData);


    done();
};




/**
 * @function installDependencies
 *
 * Install any required dependencies for the plugin
 *
 */
Module.installDependencies = function(done) {

    var textFilters = ['npm', 'http', 'GET', '304', '200'];

    var listDependencies = [

        // > npm install appdevdesigns/ad-util --save
        { command:'npm', options:[ 'install',  'appdevdesigns/ad-utils', '--save'], textFilter:textFilters, log:'<green><bold>installing:</bold> ad-utils </green>', shouldEcho:false },

        // > npm install mocha --save-dev
        { command:'npm', options:[ 'install',  'mocha', '--save-dev'], textFilter:textFilters, log:'<green><bold>installing:</bold> mocha (dev: unit testing)</green>', shouldEcho:false },

        // > npm install chai --save-dev
        { command:'npm', options:[ 'install',  'chai', '--save-dev'], textFilter:textFilters, log:'<green><bold>installing:</bold> chai (dev: unit testing)</green>', shouldEcho:false },

    ];


    // if we should install the client side unit tests capabilities:
    if (this.templateData.clientTests) {

        // > npm install phantomjs --save-dev
        listDependencies.push({ command:'npm', options:[ 'install',  'phantomjs', '--save-dev'], textFilter:textFilters, log:'<green><bold>installing:</bold> phantomjs (dev: unit testing client)</green>', shouldEcho:false });

        // > npm install mocha-phantomjs --save-dev
        listDependencies.push({ command:'npm', options:[ 'install',  'mocha-phantomjs', '--save-dev'], textFilter:textFilters, log:'<green><bold>installing:</bold> mocha-phantomjs (dev: unit testing client)</green>', shouldEcho:false });
    }


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
 * @function pluginQuestions
 *
 * Ask some basic questions concerning the plugin 
 *
 */
Module.pluginQuestions = function(done) {
    var self = this;



    var qset =  {
            question:'install client side unit test capabilities',
            data: 'clientTests',
            def:  'yes',
            post:function(data){
                data.clientTests = data.clientTests.toLowerCase();

                if ((data.clientTests == 'yes')
                    ||(data.clientTests == 'y')
                    ||(data.clientTests == 't')
                    ||(data.clientTests == 'true')) {

                    self.templateData.clientTests = true;

                } else {

                    self.templateData.clientTests = false;
                }
            }
    };


    this.questions(qset, function(err, data) {

        // don't continue if there was an error
        if (err) {

            process.exit(1);

        } else {

            done();

        }

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


                          // save this to our templatesData
                          var parse = data.gitRepo.split('/');
                          var tdGitRepo = [];
                          tdGitRepo.push( parse[parse.length-2]);
                          tdGitRepo.push( parse[parse.length-1].split('.')[0]);
                          self.templateData.gitRepo = tdGitRepo.join('/');

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
                AD.log.error('<red> NPM init exited with an error</red>', err);
                AD.log(err);
                process.exit(1);
            })
            .then(function(code){
                done();
            });


        }

    });

};



/**
 * @function patchFiles
 *
 * Make any modifications to existing files
 *
 */
Module.patchFiles = function(done) {

    var reGitRepo = new RegExp("\\[gitRepo\\]", "g");

    var patchSet = [
                    // stick our gitRepo from npm init  into our README.md build status icon
                    {  file:'README.md', tag:"[[gitRepo]]", replace:this.templateData.gitRepo  },
                    {  file:'.travis.yml', tag:reGitRepo, replace:this.templateData.gitRepo  }
                  ];
    this.patchFile( patchSet, function() {


           if (done) done();

    });

};
