
var fs = require('fs');
var path = require('path');

var AD = require('ad-utils');

var util = {};

var Generator = function (options) {

    this._type = 'generator';  // The type of plugin we are using.
    this.key = '?';            // the unique key for this generator
    this.command = '? unspecified';
    this.commandHelp = ' ?  youre on your own! ';
    this.parameters = [];
    this.atRoot = true;
    this.usesTemplates = true;
    this.additionalOptions = [];


    for (var o in options) {

        this[o] = options[o];
    }


    this.values = {
        application:null
    };

};


module.exports = Generator;





/**
 * This method will process an array of shell commands and call the given
 * callback when finished.
 *
 * The provided list should be in the following format:
 * [{
 *      cmd:'npm',             // the shell command to perform
 *      params:[ 'install', 'mysql', '--save'],     // an array of additional parameters
 *      filter: ['Creating'],  // array of filter items to suppress on the output
 *      log:'installing mysql' // {string} log message to display for this command
 * },...]
 * parameter types:
 * @param {array} list  the list of shell commands to perform
 */
Generator.prototype.batchShell = function(batch, done) {
    var self = this;


    var recursiveShell = function(indx, list, cb) {

        indx = indx || 0;
        if (indx >= list.length) {
            if (cb) cb();
        } else {

            if (list[indx].log) {
                AD.log();
                AD.log(list[indx].log);
            }
            self.shell(list[indx].cmd, list[indx].params, list[indx].filter, function(){

                recursiveShell(indx+1, list, cb);
            });

        }
    };

    recursiveShell(0, batch, done);

};



/**
 * method to copy the contents of files without attempting to render the contents.
 *
 * parameter types:
 * @param {array} files  an array of objects that specify the files to copy
 *                [{ file:'path/to/destination/file.js', template:'nameOfTemplateFile.js' }, {} ]
 * @param {fn} done  the value of the param we are saving.
 */
Generator.prototype.copyContent = function(files, done) {

    for (var i=0; i < files.length; i++ ) {

        var file = files[i];

        var pathFileToCopy = path.join(this.templatePath(), file.template);
        var pathFile = path.join(process.cwd(), file.file);

        var contents = fs.readFileSync(pathFileToCopy);
        fs.writeFileSync(pathFile,contents);
        AD.log('<yellow><bold>copied:</bold></yellow><green>'+file.file+'</green>');

    }

    if (done) done();

};



/**
 * method to either retrieve or store a default value in our local .adn config file.
 *
 * parameter types:
 * @param {string} param  the name of the value we are trying to access
 * @param {string} value  the value of the param we are saving.
 */
Generator.prototype.defaults = function(param, value ) {

    param = param || null;
    value = value || null;

    if((!param)&&(!value)) {
        AD.log.error('call to .defaults() with no parameters ... why?');
        return;
    } else {

        if (!this._adn) {
            // must be calling this from the install routine.
            this._adn = {
                    toRoot:'.',
                    name:this.options.dirName,
                    defaults:{}
            };
        }

        // make sure .defaults exists
        this._adn.defaults = this._adn.defaults || {};

        if (value) {

            // we are setting a value
            // .defaults('adapter', 'mysql');
            this._adn.defaults = this._adn.defaults || {};
            this._adn.defaults[param] = value;

            // Change environment to production in config file
            fs.writeFileSync('.adn', 'module.exports = ' + JSON.stringify(this._adn, null, 4));
            return value;

        } else {

            // we are just returning a value
            // .default('adapter');
            return this._adn.defaults[param];
        }
    }

};








/**
 * Provide more detailed help info for this specific command.
 *
 */
Generator.prototype.help = function() {

    AD.log('<yellow><bold>help not available</bold></yellow>');

};



Generator.prototype.init = function( adg ) {
    this.adg = adg;
    util = adg;

};



var isArray = function( name ) {

    return name.indexOf('[') != -1;
};



/**
 * step through the parameter object and pull off the parameters as they are
 * defined in this.parameters.
 *
 * parameter types:
 *  'name'      : a single value.  becomes this.options['name']
 *  '[name]'    : an array of values.  remaining options get put in this.options['name'][] array.
 *
 */
Generator.prototype.parseOptions = function( ) {

    // in most cases, the first parameter will show up as a value for our
    // this.param[this.key]

//    this.params.args.unshift(this.params[this.key]);



    // now step through the provided this.parameters entries, and read in an
    // options object

    this.options = {};

    for (var p in this.parameters) {
        var key = this.parameters[p];

        // does this look like an array definition?
        if (isArray(key)) {

            // remove the [, ]
            key = key.replace('[', '').replace(']','');

            // now push on the remaining values.
            this.options[key] = [];
            var val = null;
            while( val = this.params.args.shift()) {
                if (typeof val == 'string') {
                    this.options[key].push(val);
                }
            }

        } else {

            // store this option normally
            var val = this.params.args.shift();

            // ok, really we should only be getting 'strings' back.  if we don't
            // get that string ... then assume a problem and store null.
            if (typeof val != 'string') { val = null; }

            
            this.options[key] = val;

        }

    }

};



/**
 * find the templates for this generator and recreate them.
 *
 * The templates for a generator will be found in  templates/[key]/
 *
 * The templates/[key] folder will contain a series of directory & files that
 * describe what is to be created.  They will be assumed to be in the appdevJS
 * root directory.
 *
 * Directory names can be renamed using simple string replacements with matching
 * values in this.templateValues.
 * ex:
 *      this.templateValues.name = 'foo';
 *
 *      will turn a directory named '[name]'  into a directory named 'foo';
 *
 *
 * Files in a directory will be assumed to be ejs templates.  Each template will
 * be passed this.templateValues, to use in constructing the contents of that
 * file.
 *
 */
Generator.prototype.parseTemplates = function() {

//    var templateName = this.key;

    if (this.usesTemplates) {



        var templatePath = path.join(this.templatePath(), this.key );
        util.verbose('searching templates at:'+templatePath);

        // if our template directory isn't found
        if (!fs.existsSync(templatePath) )  {

            // this might be a problem.  But not necessarilly.
            // some generators don't actually have any Templates to copy over.
            AD.log('<yellow><bold>warn:</bold> can\'t find the template directory for this generator!  key['+this.key+'] </yellow>');
AD.log('cwd:'+process.cwd());
AD.log('templatePath:'+templatePath);
            
            AD.log('<yellow><bold>note:</bold></yellow> if this command doesn\'t have templates, be sure to set .usesTemplates:false in it\'s constructor.');
            

        } else {

            recursiveScan(this.templateData || {}, templatePath);
        }

    }

};



var shouldCopyFile = function(name) {

    // files that are images, or canjs/...  should be copied.
    var fileTypes = {

            // images:
            '.jpg': 'jpeg',
            '.png': 'png',
            '.gif': 'gif',

            // packaged libraries:  CanJS & Bootstrap
            'canjs':'canjs',
            'bootstrap':'bootstrap'

    };

    var isBinary = false;
    for (var f in fileTypes) {

        if (name.indexOf(f) != -1) {
            isBinary = true;
        }
    }
    return isBinary;
};

var recursiveScan = function( data, templatePath, currPath ) {

    currPath = currPath || '';

    // get all files in the directory at path:
    var files = fs.readdirSync(path.resolve(templatePath, currPath));
    util.debug('files found at:'+path.join(templatePath, currPath));
    util.debug(files);
    for (var f in files) {

        var fileName = files[f];


        var templateFilePath = path.join(currPath, fileName);

        util.verbose('found: '+templateFilePath);

        var stats = fs.statSync(path.resolve(templatePath, templateFilePath ));


        // find path to where new instance should be:
        var newFilePath = util.String.render(path.resolve(currPath, fileName), data);
        var displayPath = newFilePath.replace(process.cwd(), '');

        if (stats.isDirectory()) {

            util.verbose('   -> is a directory');

            // if dir ! exists
            if (!fs.existsSync(newFilePath)) {
                // create directory
                fs.mkdirSync(newFilePath);
                AD.log('<green><bold>created:</bold>'+displayPath+'</green>');
            } else {
                AD.log('<white><bold>exists:</bold>'+displayPath+'</white>');
            }

            recursiveScan( data, templatePath, path.join(currPath, fileName) );

        }


        if (stats.isFile()) {

            util.verbose('   -> is a file');

            // if !file exists then
            if (!fs.existsSync(newFilePath)) {

                // if file is not a binary file (image type)
                if (!shouldCopyFile(newFilePath)) {
                    // create file
                    var contents = renderFile(path.join(templatePath, templateFilePath), data);

                    fs.writeFileSync(newFilePath, contents);
                    AD.log('<green><bold>created:</bold>'+displayPath+'</green>');

                } else {

                    // copy file

                    var contents = fs.readFileSync(path.join(templatePath, templateFilePath));
                    fs.writeFileSync(newFilePath,contents);
                    AD.log('<yellow><bold>copied:</bold></yellow><green>'+displayPath+'</green>');
                }

            } else {
                AD.log('<white><bold>exists:</bold>'+displayPath+'</white>');
            }
        }


    }

};



var ejs = require('ejs');
var renderFile = function( filePath, data) {

    data.filename = data.filename || filePath;

    var contents = fs.readFileSync(filePath, 'utf8');
    var ret = ejs.render(contents, data);

    return ret;
};


Generator.prototype.templatePath = function() {
    return path.resolve(__dirname, '../../templates' );
};



Generator.prototype.patchFile = function(set, done) {

    set = set || [];
    done = done || null;

//    var templatePath = path.resolve(__dirname, '../../templates' );
    var templatePath = this.templatePath();


    // can call this 2 ways:

    // with data embedded in the patch object:
    //    [ {  file:'config/local.js', tag:"});", template:'templates/__config_db.ejs', data:data }];

    // with patch object pointing to a template file to render:
    //    [ {  file:'config/local.js', tag:"});", template:'templates/__config_db.ejs', data:data }];

    var recursivePatch = function( index, list, cb) {

        if (index >= list.length) {
            if (cb) cb();
        } else {

            var curr = list[index];
            var patchData = '';

            // if a template was provided
            if (curr.template) {
                patchData = renderFile(path.join(templatePath, curr.template), curr.data);
            } else {

                // else use the given replace string
                patchData = curr.replace;
            }

            if (fs.existsSync(curr.file)) {


                var contents = fs.readFileSync(curr.file, 'utf8');


                // note:  make sure patchData properly replaces curr.tag
                contents = contents.replace(curr.tag, patchData);

                fs.writeFileSync(curr.file, contents);
                AD.log('<yellow><bold>patched:</bold></yellow><green>'+curr.file+'</green>');


            } else {

                util.log('<yellow><bold>warning:</bold> file ('+curr.file+') not found </yellow>');
            }

            recursivePatch(index+1, list, cb);

        }
    };

    recursivePatch(0, set, done);

};







/**
 * This method returns a path with proper platform specific seperators.
 *
 * @param {string} path  the path to manipulate
 */
Generator.prototype.pathProperSeparators = function(origPath) {

    var returnPath;

    // make sure any '/' separators converted to path.sep
    returnPath = origPath.split('/').join(path.sep);

    // make sure any '\' separators converted to path.sep
    returnPath = returnPath.split('\\').join(path.sep);

    return returnPath;
};



/**
 * function stub for the actual perform method.
 *
 * It performs a basic template copy/render to a target.
 *
 * Child Objects can overridden to provide to provide custom actions.
 */
Generator.prototype.perform = function () {
        var util = this.adg;

        AD.log( this.newText || 'Creating a new '+this.key+' ... ');
        util.debug(this.params);

        // move us to the Root/
            // commands can be run from anywhere in directory structure
            // so move us to appdevJS root directory since all our templates will be
            // created/modified as from there.
        this.toRoot();

        // parse Options
        this.parseOptions();
        util.debug('the provided cmd line options:');
        util.debug(this.options);


        // give child class chance to custom format the data it sends to
        // the templates
        this.prepareTemplateData();


        // get template files
        this.parseTemplates();


        // give child objects a chance to do further processing.
        this.postTemplates();

    };


/**
 * function prepareAppDirectory
 *
 * make sure the application directory exists before we attempt to
 * copy any templates there.  This is needed for application Names
 * where they are including a path:  opstool/CoolApp 
 */
Generator.prototype.prepareAppDirectory = function( appName, baseDir ) {

    baseDir = baseDir || 'assets';  // assume assets directory if none provided.

    // for our template copying to work with appName's that have separators:
    // we need to make sure the initial directories exist:
    var partsAppName = appName.split(path.sep);
    partsAppName.pop(); // remove the last dirName since it's created later
    var currDir = "";

    partsAppName.forEach(function(part) {

        if (currDir != "") {
            currDir += path.sep;
        }
        currDir += part;
        var checkPath = path.join(baseDir,currDir);

        // if this directory doesn't exist, create it.
        if (!fs.existsSync(checkPath)) {
            AD.log('<green><bold>prep-created:</bold>' + checkPath + '</green>');
            fs.mkdirSync(checkPath);
        }
    });

};


Generator.prototype.prepareTemplateData = function() {

    // child objects should implement this method()

};


Generator.prototype.postTemplates = function() {

    // child objects should implement this method()

};



/**
 * Allows you to send in an array of method names, and execute each one in
 * series.  Each method needs to take a done() callback and call that fn()
 * when it is finished executing.
 *
 * These methods need to exist on the current object instance.
 *
 * When all methods have been completed, the provided cb() will be called.
 *
 * @param {array} stack  an array of method names to call in order
 * @param {function} cb  the callback function to call when finished.
 */
Generator.prototype.methodStack = function( stack, cb) {
    var self = this;

    var recurseProcess = function(index, list, done) {

        if (index >= list.length) {
            if (done) done();
        } else {
            self[list[index]](function(){
                recurseProcess(index+1, list, done);
            });
        }
    };

    recurseProcess(0, stack, cb);

};



/**
 * This method performs a series of command line questions and returns the
 * answers as the 2n parameter in the callback done(err, data);
 *
 * Each question should be in the format:
 *
 * @codestart
 * {    cond:function(data) {return data.connectionType == 'port'},
 *      question:'host [localhost,http://your.server.com]:',
 *      data:'host',
 *      def :'localhost',
 *      post: function(data) { data.host = data.host.toLowerCase(); },
 *      then: [
 *              { cond:fn(){}, question:'follow up:', data:'fup', def:'yo', then: [] }
 *      ]
 * }
 * @codeend
 *
 * cond:  is a function that returns true or false.  If the result is false,
 *        the question is skipped.  The function will be passed in the current
 *        data result at the time of the question.
 *        If omitted, the default is true.
 *
 * post:  is a function that is run after the input data has been given by the
 *        user.  In this function you can modify the data, or update other
 *        values based on the current values of data.
 *
 * question: the question that is displayed on the command line
 *
 * data:  the name of the variable to store the answer as.  In the above ex,
 *        data.host will receive the result of the question.
 *
 * def:   The default value.  If the user hits [return] without any data, this
 *        will be the value.
 *
 * then:  An array of follow up questions that will be asked after this one is
 *        answered.
 *
 * @param {array} questions  an array of question objects to process
 * @param {function} done    the callback to call when all questions are done
 */
var q = require('read');
Generator.prototype.questions = function(questions, done) {

    questions = questions || null;
    done = done || null;
    var data = {};

    if (questions) {
        var template = {
                cond: function() {return true;},
                post: function() {},
                question:'no question given',
                data:'',
                def :'default',
                then:[]
        };

        var completeTemplate = function (curr) {
            for (var t in template) {
                if (typeof curr[t] == 'undefined') {
                    curr[t] = template[t];
                }
            }
            return curr;
        };

        var recurseQuestion = function(currentPrompt, cb) {

            currentPrompt = completeTemplate(currentPrompt);

            // if the condition is true for this entry
            if ( currentPrompt.cond(data) ) {

                // ask your question:
                var opt = {};
                if (currentPrompt.silent) opt.silent = currentPrompt.silent;
                if (currentPrompt.replace) opt.replace = currentPrompt.replace;
                opt.prompt = '?  '+currentPrompt.question;
                opt['default'] = currentPrompt.def;

                q(opt, function(err, value, isDefault) {


                    if (err) {

                        AD.log.error('Error from question.  Did you hit ctl^c ?');
                        AD.log.error(err);
                        if (cb) cb(err, data);

                    } else {

//console.log('value:['+value+']');
//console.log('isDefault:'+isDefault);

                        //store the value
                        data[currentPrompt.data] = value;

                        // post process the given value
                        currentPrompt.post(data);


                        // if there are followup questions
                        if (currentPrompt.then.length > 0 ) {

                            var recurseThen = function( indx, list, cb) {
                                if (indx >= list.length) {
                                    if (cb) cb(null);
                                } else {
                                    recurseQuestion(list[indx], function(err){
                                        if (err) {
                                            if (cb) cb(err);
                                        } else {
                                            recurseThen(indx+1, list, cb);
                                        }
                                    });
                                }
                            };

                            recurseThen(0, currentPrompt.then, function(err){
                                // all then:[] processed now:
                                if (cb) cb(err);
                            });

                        } else {
                            // nothing else to do,
                            if (cb) cb(null);
                        }

                    }

                });

            } else {

                // condition is not valid, so don't process this one.
                if (cb) cb(null);  // return with no error
            }

        }; // end recurseQuestions


        recurseQuestion(questions, function(err){
          if (done) {done(err, data);}
        });

    } else {
        if (done) done(null, data);
    }

};




/**
 * register our command/help to the given params object (commander.js).
 *
 * @param {Object} params  paramater object.
 */
Generator.prototype.registerParams = function(params) {

    var self = this;

    this.params = params;
 //   params.option(this.command, this.commandHelp);

    params
        .command(this.key)
        .description(this.commandHelp)
        .action(function(){
            self.perform();
        });

    this.additionalOptions.forEach(function(option){

        params.option(option.key, option.desc);
    })

};




function consoleResponse (cmd, data, responses) {

    var dataString = data.toString();

    for (var r in responses) {
        if (dataString.indexOf(r) != -1) {

            cmd.stdin.write( responses[r]);
        }
    }
}

/**
 * spawn a command on the shell
 *
 * @param {string} cmd  the shell command
 * @param {array}  params the list of additional command parameters
 * @param {array} textFilter a list of string filters to not display to the shell
 * @param {function} cb  a callback to call when operation is done.
 * @param {string} exitTrigger  a string that marks the end of the shell script
 * @param {obj} responses  a key:value hash of string markers=>responses for a script
 */
Generator.prototype.shell = function(cmd, params, textFilters, cb, exitTrigger, responses) {

    textFilters = textFilters || [];

    // begin to migrate to using an object for the params:
    var opt = {};
    opt.responses = responses;

    var spawn = require('child_process').spawn,
        sails = spawn(cmd, params);

    sails.stdout.on('data', function(data) {

        var out = data + '';

        var isFiltered = false;

        for (var t in textFilters) {
            if (out.indexOf(textFilters[t]) != -1) isFiltered = true;
        }
        if (!isFiltered) {

            out.replace('\n', '');
            AD.log(out.trim());
        }

        // any responses to handle?
        if (opt.responses) {
            consoleResponse(sails, data, opt.responses);
        }

        // Catch the final response text and then continue
        if (exitTrigger) {
            if (data.toString().indexOf(exitTrigger) != -1){
                process.stdin.unpipe(sails.stdin);
                process.stdin.pause();
                if (cb) cb(0);
            }
        }


    });

    sails.stderr.on('data', function(data) {

    ////TODO: figure out Buffer parsing and detecting the lack of "debug:" in the response.
    /*            if (data.indexOf('debug') == -1) {
            // and actual error ...
            util.log('sails : '+data);
            process.exit(1);
        }
    */
        // seems that sails puts out normal/debugging info on stderr ... why?
        util.debug('err : '+data);

    });


    sails.on('close', function(code) {

        util.verbose('command ['+cmd+'] exited with code: '+code);

        process.stdin.unpipe(sails.stdin);
        process.stdin.pause();
        if (cb) cb(code);

    });

    // try to hook up current stdin to our spawned command

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.pipe(sails.stdin);

};



/**
 * makes sure we operate from the appdevJS root directory.
 *
 * @param {String} filename  [optional] file in root directory to search for.
 */
Generator.prototype.showMoreHelp = function(options) {
    /*
    {
        commandFormat:'appdev command [parameter1] [parameter2]',
        parameters:[
            '   [parameter1]  :   just put this in there',
            '   [parameter2]  :   and this one',
            '   [parameter3]  :   [optional] default is false '
        ],

        options: [
            ' -1    :   relevant option 1',
            ' -L    :   L something ',
        ]
    }
    */

    var possibleSections = [
        { key:'parameters', title:'Parameters:'},
        { key:'options', title:'Options:'},
        { key:'examples', title:'Examples:'}
    ]


    AD.log();
    if ( options.commandFormat ) {
        AD.log(options.commandFormat);
        AD.log();
    }
    
    if (options.description) {
        AD.log(options.description);
        AD.log();
    }

    possibleSections.forEach(function(section){

        if (options[section.key]) {
            AD.log(section.title);
            options[section.key].forEach(function(item){
                AD.log('  '+item);
            })
            AD.log();
        }
    });

    AD.log();
    AD.log();


}


/**
 * makes sure we operate from the appdevJS root directory.
 *
 * @param {String} filename  [optional] file in root directory to search for.
 */
Generator.prototype.toRoot = function(fileName) {

//    var self = this;

    // does this generator want to run from the root directory?
    if (this.atRoot) {
        
        // mark our current working directory
        this.cwd = process.cwd();
        util.verbose('cwd() : ' + this.cwd );


        // what file to search for
        var adnFileName = fileName || '.adn';   // default: look for our .adn file in root of directory.


        // function to step up wards in our directory structure to find our root
        var recursiveSearchUP = function( searchFor, limit, current) {

            // some sanity checks here ...
            limit = limit || 20;
            current = current || 0;

            // where are we at now?
            var currDir = process.cwd();

            // if we are at filesystem root,  or have passed our limit
            if (currDir == path.sep || current >= limit) {

                // exit with error!
                var str = 'could not determine root folder for appdevJS framework';
                if (current >= limit) str += ' after '+current+'attempts.';
                util.error(str);
                util.warn('make sure you are inside appdevJS framework before running this command.');
                return false;
            }


            util.debug('path.join : ' + path.join(currDir , searchFor) );


            // if we didn't find our searchfor file in our current directory
            if (!fs.existsSync(path.join(currDir , searchFor))) {

                // move up a level
                process.chdir('..');
                return recursiveSearchUP(searchFor, limit, current);

            } else {

                // HEY!  found it.
                return true;
            }


        };

        var foundRoot = recursiveSearchUP(adnFileName);

        // if we couldn't find the root
        if (!foundRoot) {

            // exit with an error message
            AD.log.error('You are not in a valid appDevJS project.');
            AD.log('     Create one first. ');
            AD.log('     eg.  appdev install  [directoryName]');
            process.exit(1);  // couldn't find a root directory!
        }


        // all good if we got to here:
        util.verbose('found Root at cwd(): '+process.cwd() );

        // read in our adn file
        var adn = require(path.join(process.cwd(), adnFileName));

        util.debug(adnFileName + ' = ');
        util.debug(adn);


        // Make sure we have a valid defined adn file.
        if (typeof adn.toRoot == 'undefined') {
            // exit with an error message
            AD.log.error('found an .adn file at:'+ process.cwd());
            AD.log('     but there was to toRoot parameter defined. ');
            AD.log('     make sure the root directory of your project has a valid .adn file.');
            process.exit(1);  // couldn't find a root directory!
        }


        // OK, application root files have an .adn file too ...
        // check to make sure that we are using the root version
        if (adn.toRoot != '.') {

            util.verbose('we are in a sub application');
            this.values.application = adn.application || '??';

            // our application .adn will have a path toRoot
            if (fs.existsSync(path.resolve(process.cwd(), adn.toRoot , adnFileName))) {

                util.debug('adn.toRoot value: '+adn.toRoot);

                // move there.
                process.chdir(adn.toRoot);

                util.verbose('<bold>we should now be at root: </bold>'+process.cwd());

            }
        }


        //  All should be good now.
        this._adn = adn;

    }
};



