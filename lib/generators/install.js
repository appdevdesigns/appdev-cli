
var fs = require('fs');
var path = require('path');


var util = null;

var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'install',
    command:'i install [dir_name]',
    commandHelp: 'install the appdevJS framework under given directory',
    parameters:['dirName', '[options]']
});


module.exports = Resource;


Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.appName = this.options.dirName || '?notFound?';


    util.debug('templateData:');
    util.debug(this.templateData);


};



Resource.perform = function () {
    util = this.adg;
    var self = this;

    util.log( 'Installing AppdevJS framework ');
    util.debug('install.perform():  params ');
    util.debug(this.params);

    // this command will create a new directory in the current working directory
    this.cwd = process.cwd();
    util.verbose('cwd:'+this.cwd);


    // parse Options
    this.parseOptions();

    util.debug('the provided cmd line options:');
    util.debug(this.options);

    if (this.options.dirName) {


        // if directory ! exist
        if (fs.existsSync(this.options.dirName) )  {

            util.log();
            util.log('<yellow>directory '+this.options.dirName + ' already exists.</yellow>');
            util.log('<yellow>Use this command for new installations only.</yellow>');
            util.log();
            process.exit(1);

        }


        // define the series of methods to call for the setup process
        var setupProcess = [
                        'installSailsApp',
                        'installDBAdaptor',
                        'installLibraries',
                        'installAuthentication',
                        'patchAppdevSettings',
                        'patchPluginModifications'
        ];


        this.methodStack(setupProcess, function() {

            // when they are all done:

            util.log();
            util.log('Now to run the program :');
            util.log('   > cd '+self.options.dirName);
            util.log('   > sails lift');

            process.chdir('..');
            process.exit(0);
        });

    }  // end if options.dirName


};



Resource.installAuthentication = function (done) {

    var self = this;

    var qset =  {
        question: 'which type of authentication to use [local, CAS]:',
        data: 'authType',
        def : 'local',
        post: function(data) { data.authType = data.authType.toLowerCase(); }

    };
    this.questions(qset, function(err, data) {

        if (err) {
             process.exit(1);
        } else {

            switch (data.authType )
            {
                case "local" :
                    self.installAuthLocal(done);
                    break;

                case "cas":
                    self.installAuthCAS(done);
//                    if (done) done();
                    break;

            }
        }


    });
};



Resource.installSailsApp = function (done) {

    var self = this;

    util.log('creating new SailJS application at :'+this.options.dirName);

    var params = [ 'new',  this.options.dirName];

    this.shell('sails', params, [], function(){

        process.chdir( self.options.dirName);
        self.prepareTemplateData();
        self.parseTemplates();

        if (done) done();

    });
};



Resource.installDBAdaptor = function (done) {

    var self = this;

    var qset =  {
        question: 'which db adaptor do you want to use [mysql, sqllite, memory]:',
        data: 'adaptor',
        def : 'mysql',
        post: function(data) { data.adaptor = data.adaptor.toLowerCase(); }

    };
    this.questions(qset, function(err, data) {

        if (err) {
             process.exit(1);
        } else {

            switch (data.adaptor )
            {
                case "mysql" :
                    self.defaults('adapter', 'mysql');
                    self.installMysqlAdaptor(done);
                    break;

                case "sqllite":
                case 'memory':
                    if (done) done();
                    break;

            }
        }


    });
};



Resource.installLibraries = function(done) {
    var self = this;

    var listInstall = [
            // use appdev application [dirName] to setup our application inside the framework
            { cmd:'appdev', params:[ 'application',  this.options.dirName], filter:['Creating'], log:'setting up client directories for '+this.options.dirName },

            // use git clone ssh://....  to pull down our appdev client side library.
//            { cmd:'git', params:[ 'clone',  'ssh://gitolite@git.zteam.biz/appdev_client', path.join('assets', 'appdev')], filter:['Creating'], log:'installing appdev client side library' },
            { cmd:'git', params:[ 'clone',  'https://github.com/appdevdesigns/appdev-client.git', path.join('assets', 'appdev')], filter:['Creating'], log:'installing appdev client side library', retry:3 },

            // jquery is used by ADCore controller.
            { cmd:'npm', params:[ 'install',  'jquery', '--save'], filter:['Creating'], log:'installing jquery as a dependency', retry:3 },

//// TODO: figure out the best way to package StealJS and CanJS to include in our projects
////  a) git clone ... pulls down way too much, and isn't necessary
////  b) don't want to package the whole thing with appdevgen ... too much bloat!
////  c) does windows support a similar curl url/for/steal  -o steal   ??  how do we support both Mac & Windows?
      // --> provide an appdev download url/for/steal  local/path/to/fileName.js
      //    and call that here:

            // StealJS library : git@github.com:bitovi/steal.git
//           { cmd:'git', params:[ 'clone',  'ssh://git@github.com/bitovi/steal.git', path.join('assets', 'steal')], filter:['Creating'], log:'installing stealjs ... ~10mb ' }
        ];

    var recursiveInstall = function(indx, list, cb) {

        indx = indx || 0;
        if (indx >= list.length) {
            if (cb) cb();
        } else {

            if (list[indx].log) {
                util.log();
                util.log(list[indx].log);
            }
            self.shell(list[indx].cmd, list[indx].params, list[indx].filter, function(code){
                if ((code > 0) && (list[indx].retry > 0)) {
                    // Shell command failed with an error code
                    // Retrying
                    util.error(list[indx].cmd + ' failed. Retrying...');
                    list[indx].retry -= 1;
                    recursiveInstall(indx, list, cb);
                } else {
                    // Move on to the next command
                    recursiveInstall(indx+1, list, cb);
                }
            });

        }
    };


    // start the installations
//// TODO: once the appdev library is hosted on github, we can simply do this:
//    recursiveInstall(0, listInstall, done);
//// until then we need to verify the library was downloaded:

    // start the installations
    recursiveInstall(0, listInstall,function() {


        if (!fs.existsSync(path.join('assets', 'appdev'))) {

            util.error('the appdev library did not install.  Are you calling this with the VPN on?');

            // don't continue on...

        } else {

            if (done) done();

        }
    });
};



Resource.installAuthCAS = function (done) {

//    var self = this;

    // with authType == CAS,
    // 1) ask for the CAS settings
    // 2) patch config/appdev.js with CAS value
    // 3) patch config/local.js with CAS settings
    // 4) add in config/cas.js

    // now clone the cas library from github
    var params = [ 'cas' ];
    util.log('<bold>install:</bold> installing cas ');

    this.shell('appdev', params, ['Creating'], function(){
        if (done) done();
    }, '> edit');
};



Resource.installAuthLocal = function (done) {

    var self = this;

    // with authType == local, we need to patch the config/appdev.js file
    var patchSet = [
                     {  file:path.join('config', 'appdev.js'), tag:"[[authType]]", replace: 'local'  },
                   ];
    self.patchFile( patchSet, function() {

        if (done) done();
    });

};



Resource.installMysqlAdaptor = function (done) {

    var self = this;

    var qset =  {
          question:'connect by socket or port [socket,port]:',
          data: 'connectionType',
          def:  'port',
          post: function(data) { data.connectionType = data.connectionType.toLowerCase(); },
          then:[

                {   cond:function(data) {return data.connectionType == 'port';},
                    question:'host [localhost,http://your.server.com]:',
                    data:'host',
                    def :'localhost',
					post: function(data) { self.defaults('label-host',data.host); }
                },
                {   cond:function(data) {return data.connectionType == 'port';},
                    question:'port:',
                    data:'port',
                    def :'8889',
					post: function(data) { self.defaults('label-port',data.port); }
                },
                {   cond:function(data) {return data.connectionType == 'socket';},
                    question:'socket path :',
                    data:'socketPath',
                    def :''
                },
                {
                    question:'user:',
                    data:'user',
                    def :'root',
					post: function(data) { self.defaults('label-user',data.user); }
                },
                {
                    question:'password:',
                    data:'password',
                    def :'root',
 //                   silent:true,
 //                   replace:'*',
 					post: function(data) { self.defaults('label-pass',data.password); }
                },
                {
                    question:'database:',
                    data:'database',
                    def :'develop',
					post: function(data) { self.defaults('label-db',data.database); }
                }

          ]
      };


    this.questions(qset, function(err, data) {

        // don't continue if there was an error
        if (err) {

            process.exit(1);

        } else {

            var adPublish = ["$1","      AD.comm.hub.publish('ad.sails.model.update', message);", '', '', "$2"].join('\n');

            //// patch config/local.js to include the local mysql settings
            var patchSet = [ {  file:path.join('config', 'local.js'), tag:"};", template:'__config_db_mysql.ejs', data:data },
                             {  file:path.join('config', 'adapters.js'), tag:"'default': 'disk',", replace:"'default': 'mysql'," },
                             {  file:path.join('config', 'adapters.js'), tag:"myLocalMySQLDatabase", replace:"mysql" },
                             {  file:path.join('assets', 'js', 'app.js'), tag:/(socket\.on\('message'[\s\S]+?)(\}\);)/, replace:adPublish }
                           ];
            self.patchFile( patchSet, function() {

                // now install the sails-mysql adaptor
                var params = [ 'install',  'sails-mysql', '--save'];
                util.log();
                util.log('installing sails-mysql adaptor');

                self.shell('npm', params, ['Creating'], function(){
                    if (done) done();
                });


//// use this if we need to install directly from git hub:
/*
                var params = ['clone', 'git@github.com:balderdashy/sails-mysql.git', path.join('node_modules', 'sails-mysql')];
                util.log();
                util.log('installing sails-mysql adaptor from GIT ');

                self.shell('git', params, ['Creating'], function(){

                    var sailsPath = path.join('node_modules','sails-mysql');
                    if (!fs.existsSync(sailsPath)) {
                        util.error('sails-mysql not installed.');
                        util.error('Are you sure you are connected to the internet?');
                        process.exit(1);
                    } else {

                        //// now tell NPM to install it's dependencies
                        util.log('NPM installing sails-mysql dependencies ');
                        process.chdir(sailsPath);
                        var npmParams = ['install'];
                        self.shell('npm', npmParams, [], function() {
                            process.chdir(path.join('..', '..'));
                            if (done) done();
                        });

                    }

                });
*/
            });


        }

    });
};



Resource.patchAppdevSettings = function (done) {

    var self = this;

    var routes = [
                   "  , 'get /site/config/data.js'      : 'ADCoreController.configData'",
                   "  , 'get /site/labels/:context'     : 'ADCoreController.labelConfigFile'",
                   "  , 'get /site/labels/:context/*'   : 'ADCoreController.labelConfigFile'",
                   "  , 'get /site/login'               : 'ADCoreController.login'",
                   "  , 'get /site/logout'              : 'ADCoreController.logout'",
                   "  //// only active in development environment:",
                   "  , 'get /node_modules/**' : 'ADCoreController.testingFiles'",
                   "};"
                 ].join('\n');

    var policies = [
                   ", ADCoreController: {",
                   "    configData: ['isAuthenticated'],",
                   "    labelConfigFile:[ 'isAuthenticated' ],",
                   "    logout:true",
                   "},",
                   "",
                   "};"
                   ].join('\n');
    var patchSet = [
                    {  file:path.join('config', 'routes.js'), tag:"};", replace:routes  },
                    {  file:path.join('config', 'policies.js'), tag:"};", replace:policies  }
                  ];
   self.patchFile( patchSet, function() {


       var filesToCopy = [
                    { file:path.join('views','adcore','configdata.ejs'), template:'__install_views_configdata.ejs'},
                    { file:path.join('views','adcore','labelconfigfile.ejs'), template:'__install_views_labelconfigfile.ejs'}
                    ];
       self.copyContent(filesToCopy, function() {

           if (done) done();
       });
   });
};





Resource.patchPluginModifications = function (done) {

    var self = this;

//    var expr = new RegExp("module\.exports\.(\w+) = \{");
//    var replace = 'var $1 = module.exports.$1 = {';
//    var patchSet = [
//                    {  file:path.join('config', 'routes.js'), tag:expr, replace:replace  },
//                    {  file:path.join('config', 'policies.js'), tag:expr, replace:replace  }
//                  ];
    var patchSet = [
                    {  file:path.join('config', 'routes.js'), tag:'module.exports.routes', replace:'var routes = module.exports.routes'  },
                    {  file:path.join('config', 'policies.js'), tag:'module.exports.policies', replace:'var policies = module.exports.policies'  },
                    {  file:path.join('config', 'adapters.js'), tag:'module.exports.adapters', replace:'var adapters = module.exports.adapters'  }
                 ];

   self.patchFile( patchSet, function() {

       if (done) done();
   });
};