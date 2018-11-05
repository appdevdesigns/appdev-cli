
var fs = require('fs');
var path = require('path');


var util = null;
var AD = require('ad-utils');


var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'dockerInstall',
    command:'di dockerInstall [dir_name]',
    commandHelp: 'install the AppBuilder framework under given directory',
    parameters:['dirName', '[options]'],
    additionalOptions:[ 
    ]
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev dockerInstall <yellow><bold>[dir_name]</bold></yellow> <green>[plugins:moduleA,moduleB]</green>',
        description:[ 
            'This command creates a new AppBuilder installation with our Appdev Resources',
            '    setup and configured.'

        ].join('\n'),
        parameters:[
            '<yellow>[dir_name]</yellow>         :   the name of the directory to install everything in.',
            '<green>[plugins]</green>          :   <green>(optional)</green> specify the plugins to install.'
        ],

        examples:[
            '> appdev dockerInstall newSailsApp',
            '    // creates newSailsApp/ application ',
            '',
            '> appdev install sails plugins:appdevdesigns/appdev-core#master,appdevdesigns/appdev-opsportal',
            '    // creates sails/ application directory',
            '    // installs appdev-core using the #master branch',
            '    // installs appdevdesigns/appdev-opsportal using the #develop branch (because of the --develop param)',
            ''
        ]
    });

}





Resource.stop = function() {
    process.exit(0);
}


Resource.perform = function () {
    util = this.adg;
    var self = this;

    AD.log( '<green><bold>install:</bold> creating a new AppBuilder environment:</green>');
    util.debug('install.perform():  params ');
    util.debug(this.params);

    // this command will create a new directory in the current working directory
    this.cwd = process.cwd();
    util.verbose('cwd:'+this.cwd);


    // parse Options
    this.parseOptions();

    this.parseAllowedOptions(['plugins'], function(key, values){
        self.options[key] = values.shift().split(',');
    })


    util.debug('the provided cmd line options:');
    util.debug(this.options);

// util.log(':::: this.params:');
// util.log(this.params);
// util.log(':::: this.options:');
// util.log(this.options);
// process.exit(0);

    if (this.options.dirName) {


        // if directory ! exist
        if (fs.existsSync(this.options.dirName) )  {

            AD.log();
            AD.log.error('<bold>error:</bold> directory '+this.options.dirName + ' already exists.');
            AD.log('<yellow>Use this command for <bold>new</bold> installations only.</yellow>');
            AD.log();
            process.exit(1);

        }


        // define the series of methods to call for the setup process
        var setupProcess = [
                        'prepareTemplateData',
                        'parseTemplatesWithExceptions',
                        'gitClonePlugins',
                        // 'npmUpdatePlugins',
                        'updateDockerCompose'
        ];


        this.methodStack(setupProcess, function() {

            // when they are all done:
            AD.log();
            AD.log('Now to run the program :');
            AD.log('   $ cd '+self.options.dirName);
            AD.log('   $ docker stack deploy -c docker-compose.yml abStack');

            process.chdir('..');
            process.exit(0);
        });

    }  // end if options.dirName


};



Resource.prepareTemplateData = function (done) {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.dirName || '?notFound?';

    // this.templateData._csrf = "<%= _csrf %>";  // config/csrf.js has a stupid ejs tag in it's header comments.

    util.debug('templateData:');
    util.debug(this.templateData);

    done();
};





Resource.parseTemplatesWithExceptions = function (done) {
    util = this.adg;

    this.parseTemplates([
        path.join('config', 'csrf.js'),
        path.join('config', 'locales')
    ])
    done();
};


Resource.gitClonePlugins = function (done) {
    util = this.adg;

    // remember the current directory so we can return
    var cwd = process.cwd();

    // change into our plugin directory:
    var pathPluginDir = path.join(cwd, this.templateData.appName, 'plugins');
    process.chdir(pathPluginDir);

    // convert a git reference into an https:// url:
    function toGitURL(plugin) {
        return 'https://github.com/'+plugin+'.git'
    }

    // default to this branch:
    var branchTag = "#develop";


    // start with our basic required plugins:
    // we want each entry in :   [gitReference]#branch
    var pluginsToAdd = [
        'appdevdesigns/app_builder'+branchTag,
        'appdevdesigns/appdev-core'+branchTag,
        'appdevdesigns/appdev-opsportal'+branchTag,
        'appdevdesigns/opstool-emailNotifications'+branchTag,
    ]


    // if they added additional plugins, add them to plugins:
    // supported formats:
    //      appdevdesigns/fcf-activities
    //      appdevdesigns/[fcf-activities|fcf-core#master|opstool-XYZ]
    if (this.options.plugins) {

        this.options.plugins.forEach((plugin)=>{

            var parts = pluginDef.split('[');
            if (parts.length > 1) {
                var base = parts[0];
                parts[1] = parts[1].replace(']', '');

                var plugins = parts[1].split('|');
                plugins.forEach(function(p){
                    pluginsToAdd.push(toGitURL(base+p));
                })
            } else {
                pluginsToAdd.push(toGitURL(pluginDef));
            }
        })
    }


    this.pluginsToAdd = pluginsToAdd;

    function cloneIt(indx, cb) {
        if (indx >= pluginsToAdd.length) {
            cb();
        } else {
            var gitURLEntry = pluginsToAdd[indx];
            var parts = gitURLEntry.split('#');
            var gitURL = toGitURL(parts[0]);
            var gitBranch = parts[1] || branchTag;


            AD.spawn.command({
                command:'git',
                options:[ 'clone', '-b', gitBranch, gitURL ],
                textFilters:['Cloning'],
                shouldEcho:false,
            })
            .fail(function(err){
                util.error('error performing git clone '+gitURL+' : ', err);
                done(err);
            })
            .then(function(code){
                AD.log('<green><bold>installed plugin:</bold>'+parts[0]+'</green>');
                cloneIt(indx+1, cb);
            });


        }
    }

    cloneIt(0, function(err) {

        // return to our original directory
        process.chdir(cwd);
        done(err);
    })
};


Resource.npmUpdatePlugins = function (done) {
    util = this.adg;

    // remember the current directory so we can return
    var cwd = process.cwd();

    // change into our plugin directory:
    var pathPluginDir = path.join(cwd, this.templateData.appName, 'plugins');


    var pluginsToAdd = this.pluginsToAdd;

    function npmUpdateIt(indx, cb) {
        if (indx >= pluginsToAdd.length) {
            cb();
        } else {
            var pluginDef = pluginsToAdd[indx];

            var url = pluginDef.split("#");
            var urlParts = url[0].split("/");
            var dirName = urlParts[1] || urlParts[0];

            process.chdir(path.join(pathPluginDir,dirName));

            AD.spawn.command({
                command:'npm',
                options:[ 'update',  ],
                // shouldEcho:false,
            })
            .fail(function(err){
                util.error('error performing npm update '+dirName+' : ', err);
                cb(err);
            })
            .then(function(code){
                AD.log('<green><bold>npm update plugin:</bold>'+dirName+'</green>');
                npmUpdateIt(indx+1, cb);
            });


        }
    }

    npmUpdateIt(0, function(err) {

        // return to our original directory
        process.chdir(cwd);
        done(err);
    })
};


Resource.updateDockerCompose = function (done) {
    util = this.adg;

    var cwd = process.cwd();
    var tagVolumes = '    volumes:';

    var volumeList = [tagVolumes];

    // add in the config file volume reference:
    volumeList.push(
`      - type: bind
        source: ./config
        target: /app/config`);

    
    this.pluginsToAdd.forEach((pluginDef)=>{

        var url = pluginDef.split("#");
        var urlParts = url[0].split("/");
        var dirName = urlParts[1] || urlParts[0];
        volumeList.push(
`      - type: bind
        source: ./plugins/${dirName}
        target: /app/node_modules/${dirName}`)

    })

    var templateData = volumeList.join("\n");

    var patchSet = [
        {  file:path.join(cwd, this.templateData.appName, 'docker-compose.yml'), tag:tagVolumes, replace: templateData },
    ];

console.log('patchSet:', patchSet);

    this.patchFile( patchSet, function() {
        if (done) done();
    });
};
