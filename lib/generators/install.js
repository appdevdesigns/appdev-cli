
var fs = require('fs');
var path = require('path');


var util = null;
var AD = require('ad-utils');


var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'install',
    command:'i install [dir_name]',
    commandHelp: 'install the appdevJS framework under given directory',
    parameters:['dirName'],
    additionalOptions:[ 
        { key:'--noDependencies', desc: 'do not install any dependencies for this action'}, 
        { key:'--develop', desc:'setup in development mode'},
        { key:'--travisCI', desc:'setup for a travis ci run'}
    ]
});


module.exports = Resource;



Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev install <yellow><bold>[dir_name]</bold></yellow> <green>[--develop] [--travisCI]</green>',
        description:[ 
            'This command creates a new SailsJS installation with our Appdev Resources',
            '    setup and configured.'

        ].join('\n'),
        parameters:[
            '<yellow>[dir_name]</yellow>         :   the name of the directory to install everything in.',
            '<green>--develop</green>          :   <green>(optional)</green> install the latest #develop branches of our required packages.',
            '<green>--travisCI</green>         :   <green>(optional)</green> default setup for a travis ci build'
        ],

        examples:[
            '> appdev install newSailsApp',
            '    // creates newSailsApp/ application ',
            '',
        ]
    });

}


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

    AD.log( '<green><bold>install:</bold> creating a new Appdev-SailsJS environment:</green>');
    util.debug('install.perform():  params ');
    util.debug(this.params);

    // this command will create a new directory in the current working directory
    this.cwd = process.cwd();
    util.verbose('cwd:'+this.cwd);


    // parse Options
    this.parseOptions();

    util.debug('the provided cmd line options:');
    util.debug(this.options);

//util.log(this.params);

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
                        'installSailsApp',
                        'installDBAdaptor',
                        'installTestDBAdaptor',
                        'setModelMigrate',
                        'patchPluginModifications',  // NOTE: keep this before installLibraries
                        'installLibraries',
                        'patchDeveloperSettings',
                        'installSSL',
                        'installAuthentication',
                        'patchAppdevSettings',
                        'moveGruntFile',


                        // these are additional steps for the --develop option:
                        'developSailsLift',
                        'developActionKeys',
                        'developPermissions',
                        'developCreateOpsPortal',


        ];


        this.methodStack(setupProcess, function() {

            // when they are all done:

            AD.log();
            AD.log('Now to run the program :');
            AD.log('   > cd '+self.options.dirName);
            AD.log('   > sails lift');

            process.chdir('..');
            process.exit(0);
        });

    }  // end if options.dirName


};



Resource.installSSL = function (done) {

    var self = this;

    if (this.params.travisCI) {

        // no SSL in travisCI normally:
        done && done();

    } else {

    
        var qset =  {
            question: 'do you want to enable SSL [yes, no]:',
            data: 'enableSSL',
            def : 'no',
            post: function(data) { 
                if (data.enableSSL.toLowerCase() == 'yes') 
                    data.enableSSL = true;
                else 
                    data.enableSSL = false;
            },
            then: [
                {
                    cond: function(data) { return data.enableSSL; },
                    question: 'do you already have your SSL certificate and private key [yes, no]:',
                    data: 'haveCert',
                    def: 'no',
                    post: function(data) { 
                        if (data.haveCert.toLowerCase() == 'yes')
                            data.haveCert = true;
                        else
                            data.haveCert = false;
                    }
                },
                {
                    cond: function(data) { return data.enableSSL && data.haveCert; },
                    question: 'enter the filesystem location of your SSL private key:',
                    data: 'privateKeyFile',
                    def: '',
                    post: function(data) {}
                },
                {
                    cond: function(data) { return data.enableSSL && data.haveCert; },
                    question: 'enter the filesystem location of your SSL certificate:',
                    data: 'certificateFile',
                    def: '',
                    post: function(data) {}
                },
                {
                    cond: function(data) { return data.enableSSL && !data.haveCert; },
                    question: 'enter the 2-letter country code to use for your certificate:',
                    data: 'country',
                    def: 'AU',
                    post: function(data) {}
                },
                {
                    cond: function(data) { return data.enableSSL && !data.haveCert; },
                    question: 'enter the state or province name:',
                    data: 'state',
                    def: 'Narnia',
                    post: function(data) {}
                },
                {
                    cond: function(data) { return data.enableSSL && !data.haveCert; },
                    question: 'enter the city name:',
                    data: 'city',
                    def: '',
                    post: function(data) {}
                },
                {
                    cond: function(data) { return data.enableSSL && !data.haveCert; },
                    question: 'enter the organization name:',
                    data: 'orgname',
                    def: '',
                    post: function(data) {}
                },
                {
                    cond: function(data) { return data.enableSSL && !data.haveCert; },
                    question: 'enter the domain name for your certificate:',
                    data: 'domain',
                    def: '',
                    post: function(data) {}
                }
            ]
        };
        this.questions(qset, function(err, data) {

            if (err) {
                 process.exit(1);
            } else {
                if (data.enableSSL) { 
                    self.generateCertificate(data)
                    .done(function(){
                        // add cert & key location to config/local.js ...
                        var patchSet = [
                            {
                                file: path.join('config', 'local.js'),
                                tag: /^/,
                                replace: 'var fs = require("fs");\n\n'
                            },
                            { 
                                file: path.join('config', 'local.js'),
                                tag: /\s*};?\s*$/,
                                template: '__config_ssl.ejs',
                                data: {
                                    key: data.privateKeyFile,
                                    cert: data.certificateFile
                                }
                            },
                            {
                                file: path.join('config', 'session.js'),
                                tag: 'secure: false',
                                replace: 'secure: true'
                            }
                        ];
                        self.patchFile(patchSet, function() {
                            done && done();
                        });
                    });
                }
                else {
                    done && done();
                }
            }

        });

    } // end if --travisCI
};



Resource.generateCertificate = function (data) {
    var dfd = AD.sal.Deferred();
    
    if (data.haveCert) {
        dfd.resolve();
    }
    else {
        data.certificateFile = path.join('config', 'cert.pem');
        data.privateKeyFile = path.join('config', 'privatekey.pem');
        this.batchShell([
            {
                cmd: 'openssl',
                params: [ 'genrsa', '-out', data.privateKeyFile, '2048' ],
                log: 'Generating private key with openssl'
            },
            {
                cmd: 'openssl',
                params: [ 
                    'req', '-new', '-x509', 
                    '-key', data.privateKeyFile, 
                    '-out', data.certificateFile, 
                    '-days', '1095',
                    '-subj', '/C='+data.country+'/ST='+data.state+'/L='+data.city
                                +'/O='+data.orgname+'/CN='+data.domain
                ],
                log: 'Generating certificate with openssl'
            }
        ], function(){
            dfd.resolve();
        });
    }
    
    return dfd;
};



Resource.installAuthentication = function (done) {

    var self = this;

    if (this.params.travisCI) {

        // no auth local in travisCI:
        self.installAuthLocal(done);

    } else {


        var qset =  {
            question: 'which type of authentication to use [local, CAS, Google]:',
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
                        break;
                    
                    case "google":
                        self.installAuthGoogle(done);
                        break;
                }
            }

        });

    } // end if --travisCI

};



Resource.installSailsApp = function (done) {

    var self = this;

    AD.log('creating new SailJS application at :'+this.options.dirName);

    var params = [ 'new',  this.options.dirName];

//    this.shell('sails', params, [], function(){
    AD.spawn.command({
        command:'sails',
        options:params
    })
    .fail(function(err){
        AD.log.error('<bold>error:</bold> unable to spawn \'sails new\' command', err);
        process.exit(1);
    })
    .then(function() {

        process.chdir( self.options.dirName);
        self.prepareTemplateData();
        self.parseTemplates();

        var pathSessionAuth = path.join('api', 'policies', 'sessionAuth.js');
        if (fs.existsSync(pathSessionAuth)) {

            AD.log('<yellow><bold>removed:</bold></yellow><green> '+pathSessionAuth+'</green>');
            // Sails includes an sessionAuth.js policy we want to remove.
            fs.unlinkSync(pathSessionAuth);
        } else {
            AD.log('<yellow><bold>warn:</bold> expected to remove '+pathSessionAuth+' but it was not there? </yellow>');
        }  

        if (done) done();

    });
};



Resource.installDBAdaptor = function (done) {

    var self = this;

    if (this.params.travisCI) {

        // DB: memory in travisCI:
        self.installDiskAdaptor(done);

    } else {


        var qset =  {
            question: 'which db adaptor do you want to use [mysql, sqllite, disk, memory]:',
            data: 'adaptor',
            def : 'mysql',
            post: function(data) { data.adaptor = data.adaptor.toLowerCase(); }

        };
        this.questions(qset, function(err, data) {

            if (err) {
                 process.exit(1);
            } else {

                // we create an adaptor agnostic default connection.
                // this will be set as the default connection in the config/models.js
                // models generated by appdev resource will list this as their default 
                // connection if none is listed.
                self.defaults('connection', 'appdev_default');

                switch (data.adaptor )
                {
                    case "mysql" :
                        self.installMysqlAdaptor(done);
                        break;


                    case "sqllite":
                        if (done) done();
                        break;


                    case 'memory':
                        self.installMemoryAdaptor(done);
                        break;


                    case 'disk':
                        self.installDiskAdaptor(done);
                        break;

                }
            }


        });

    } // end if --travisCI
};






Resource.installTestDBAdaptor = function (done) {

    var self = this;

    if (this.params.travisCI) {

        self.doInstallTestDBAdaptor(done);

    } else {


        var qset =  {
            question: 'do you wish to install a separate db adaptor for running tests[y, n]:',
            data: 'wantTest',
            def : 'y',
            post: function(data) { data.wantTest = data.wantTest.toLowerCase(); }

        };
        this.questions(qset, function(err, data) {

            if (err) {
                 process.exit(1);
            } else {


                if (data.wantTest == 'y') {
                    self.doInstallTestDBAdaptor(done);
                }
                else {
                    done && done();
                }
                
            }


        });

    } // end if --travisCI
};


Resource.doInstallTestDBAdaptor = function(done){


    var connectionInfo = [
        'module.exports.connections = {',
        '',
        '  // Appdev Unit Testing Connection:',
        '  test: {',
        '    adapter: \'sails-disk\'',
        '  },'
    ].join('\n');

    //// patch config/local.js to include the memory settings
    var patchSet = [
         {  file:path.join('config', 'connections.js'), tag:/module.exports.connections\s=\s{/, replace:connectionInfo }
    ];
    this.patchFile( patchSet, function() {

        //// But wait!  It comes installed by default!  
        if (done) done();
    });
}



Resource.patchDeveloperSettings = function (done) {

    var self = this;

    // if we are in --develop  mode then make these changes:
    if (this.params.develop) {

        var patchSet = [
                        {  file:path.join('config', 'models.js'), tag:/migrate:\s*'.+?'/, replace:'migrate: \'alter\''  },
        ];

        self.patchFile( patchSet, function() {

            done();

        });


    } else {
        done();
    }
};



Resource.installLibraries = function(done) {
    var self = this;

    var textFilters = ['Creating', 'GET', 'npm', 'http', '─', '> ', '304', '200'];

    var listInstall = [
            // use appdev application [dirName] to setup our application inside the framework
            { command:'appdev', options:[ 'application',  this.options.dirName], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow> setting up client directories for '+this.options.dirName },
    ];

    // if they did not specify to skip dependencies then:
    if (!this.params.noDependencies) {

            // use git clone ssh://....  to pull down our appdev client side library.
//            { cmd:'git', params:[ 'clone',  'ssh://gitolite@git.zteam.biz/appdev_client', path.join('assets', 'appdev')], filter:['Creating'], log:'installing appdev client side library' },
//            { command:'git', options:[ 'clone',  'https://github.com/appdevdesigns/appdev-client.git', path.join('assets', 'appdev')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  appdev client side library', retry:3 },

        var branchTag = '';
        if (this.params.develop) {
// AD.log('<green><bold>****** --develop mode ******</bold></green>');
            branchTag = '#develop';
        }
        // install our appdev-core library
        if ( /^win/.test(process.platform)) {   // if running on windows:
            AD.log('<yellow>**** windows install ****</yellow>');
            listInstall.push({ command:'npm', options:[ 'install',  'appdevdesigns/appdev-core#windows', '--save'], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  appdev-core#windows as a dependency', retry:3 });
        } else {
            listInstall.push({ command:'npm', options:[ 'install',  'appdevdesigns/appdev-core'+branchTag, '--save'], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  appdev-core'+branchTag+' as a dependency', retry:3 });
        }

        // install async :  our plugin modifications to config/bootstrap.js requires this.
        listInstall.push({ command:'npm', options:[ 'install',  'async', '--save'], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  async as a dependency', retry:3 });

        // install ad-utils :  our plugin modifications to config/bootstrap.js requires this.
        listInstall.push({ command:'npm', options:[ 'install',  'appdevdesigns/ad-utils'+branchTag, '--save'], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  ad-utils'+branchTag+' as a dependency', retry:3 });


        // in --develop mode, install opsportal, hrisAdminObjects and hrisUserProfile tools in #develop mode.
        if (this.params.develop) {   

            listInstall.push({ command:'npm', options:[ 'install',  'appdevdesigns/appdev-opsportal'+branchTag, '--save'], textFilter:textFilters, log:'<yellow><bold>develop:</bold></yellow>  appdev-opsportal'+branchTag+' as a dependency', retry:3 });
            
            // skip these if --travisCI
            if (!this.params.travisCI) {
                listInstall.push({ command:'npm', options:[ 'install',  'appdevdesigns/opstool-hrisAdminObjects'+branchTag, '--save'], textFilter:textFilters, log:'<yellow><bold>develop:</bold></yellow>  appdev-hrisAdminObjects'+branchTag+' as a dependency', retry:3 });
                listInstall.push({ command:'npm', options:[ 'install',  'appdevdesigns/opstool-hrisUserProfile'+branchTag, '--save'], textFilter:textFilters, log:'<yellow><bold>develop:</bold></yellow>  appdev-hrisUserProfile'+branchTag+' as a dependency', retry:3 });
            }
        }


        // install CanJS :  our client side apps : 
        //    curl -o assets/canjs.zip https://codeload.github.com/bitovi/canjs/zip/master
        //    unzip assets/canjs.zip
        //    mv canjs-master assets/can
        listInstall.push({ command:'curl',  options:[ '-o',  path.join('assets', 'canjs.zip'), 'https://codeload.github.com/bitovi/canjs/zip/master'], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  curl CanJS', retry:3 });
        listInstall.push({ command:'unzip', options:[ path.join('assets', 'canjs.zip')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  unzip CanJS', retry:3 });
        listInstall.push({ command:'mv',    options:[ 'canjs-master', path.join('assets', 'can')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  mv: CanJS', retry:3 });
    

console.log('... well im here!');

        // install StealJS :  our client side apps : 
        //    curl -o assets/javascriptmvc.zip http://www.javascriptmvc.com/dist/javascriptmvc-3.3.zip
        //    unzip assets/canjs.zip
        //    mv canjs-master assets/can
        listInstall.push({ command:'curl',  options:[ '-o',  path.join('assets', 'javascriptmvc.zip'), 'http://www.javascriptmvc.com/dist/javascriptmvc-3.3.zip'], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  curl StealJS', retry:3 });
        listInstall.push({ command:'unzip', options:[ path.join('assets', 'javascriptmvc.zip')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  unzip StealJS', retry:3 });
        listInstall.push({ command:'mv',    options:[ path.join('assets', 'javascriptmvc', 'steal'), path.join('assets', 'steal')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  mv: StealJS', retry:3 });
        listInstall.push({ command:'mv',    options:[ path.join('assets', 'javascriptmvc', 'js'), path.join('assets', 'cjs')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  mv: StealJS:cjs', retry:3 });
        listInstall.push({ command:'rm',    options:[ '-R', path.join('assets', 'javascriptmvc')], textFilter:textFilters, log:'<yellow><bold>install:</bold></yellow>  rm: javascriptmvc', retry:3 });

    }


    AD.spawn.series(listInstall)
    .fail(function(err){
        AD.log.error('<bold>error:</bold> installing libraries : ',err);
        process.exit(1);
    })
    .then(function(){
        if (done) done();       
    });

/*
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
    recursiveInstall(0, listInstall,function() {


        if (!fs.existsSync(path.join('assets', 'appdev'))) {

            util.error('the appdev library did not install.');
            util.error('Please verify you are connected to the internet and try again.');

            // ? don't continue on... ?

        } else {

            if (done) done();

        }
    });
*/


};



Resource.installAuthCAS = function (done) {

    // with authType == CAS,
    // 1) ask for the CAS settings
    // 2) patch config/appdev.js with CAS value
    // 3) patch config/local.js with CAS settings
    // 4) add in config/cas.js

    var params = [ 'cas' ];
    AD.log('<bold>install:</bold> installing cas ');

    AD.spawn.command({
        command:'appdev',
        options:params,
        textFilters:['npm', 'http', '304'],
        exitTrigger:'> edit',
        shouldPipe:true
    })
    .fail(function(err){
        AD.log.error('<bold>ERROR:</bold> can\'t run \'appdev '+params.join(' ')+'\'');
        done(err);
    })
    .then(function() {

        if (done) done();
    });
};



Resource.installAuthGoogle = function (done) {

    // with authType == google,
    // 1) ask for the google aith settings
    // 2) patch config/appdev.js with google value
    // 3) patch config/local.js with google settings

    var params = [ 'googleAuth' ];
    AD.log('<bold>install:</bold> installing Google OAuth2 settings ');

    AD.spawn.command({
        command:'appdev',
        options:params,
        textFilters:['npm', 'http', '304'],
        exitTrigger:'> edit',
        shouldPipe:true
    })
    .fail(function(err){
        AD.log.error('<bold>ERROR:</bold> can\'t run \'appdev '+params.join(' ')+'\'');
        done(err);
    })
    .then(done);
};



Resource.installAuthLocal = function (done) {

    var self = this;

    // with authType == local, we need to patch the config/appdev.js file
    var patchSet = [
                     {  file:path.join('config', 'appdev.js'), tag:"[[authType]]", replace: 'local'  },
                   ];

    // if we are in --develop mode, then put in the anonymousUserID:
    if (this.params.develop) {
        patchSet.push({  file:path.join('config', 'appdev.js'), tag:"};", replace: '  test: { \n    anonymousUserID:\'admin\'\n  }\n};'  })
    }
    self.patchFile( patchSet, function() {

        if (done) done();
    });

};



Resource.installMemoryAdaptor = function (done) {

    var self = this;


    var connectionInfo = [
        '  // Appdev Default Connection:',
        '  ,appdev_default: {',
        '    adapter: \'sails-memory\'',
        '  }'
    ].join('\n');

    //// patch config/local.js to include the memory settings
    var patchSet = [
         {  file:path.join('config', 'local.js'), tag:"};", template:'__config_db_memory.ejs', data:{} },
         {  file:path.join('config', 'models.js'), tag:/\/*\s*connection: '.+?',/, replace:"connection: 'appdev_default'," },
         {  file:path.join('config', 'connections.js'), tag:"};", replace:connectionInfo + '\n};' },
//                             {  file:path.join('assets', 'js', 'app.js'), tag:/(socket\.on\('message'[\s\S]+?)(\}\);)/, replace:adPublish }
    ];
    self.patchFile( patchSet, function() {

        // now install the sails-mysql adaptor

        var params = [ 'install',  'balderdashy/sails-memory', '--save'];
        AD.log();
        AD.log('<green><bold>installing:</bold>  sails-memory adaptor </green>');

        AD.spawn.command({
            command:'npm',
            options:params,
            textFilter:['Creating', '─', 'npm', 'http', '304', 'GET' ],
//shouldEcho:false
        })
        .fail(function(err){
            AD.log.error('<bold>error:</bold> unable to \'npm '+ params.join(' ') +'\' ', err);
            process.exit(1);
        })
        .then(function(){

            if (done) done();
        });

    });

};



Resource.installDiskAdaptor = function (done) {

    var self = this;


    var connectionInfo = [
        '  // Appdev Default Connection:',
        '  ,appdev_default: {',
        '    adapter: \'sails-disk\'',
        '  }'
    ].join('\n');

    //// patch config/local.js to include the memory settings
    var patchSet = [
         {  file:path.join('config', 'local.js'), tag:"};", template:'__config_db_memory.ejs', data:{} },
         {  file:path.join('config', 'models.js'), tag:/\/*\s*connection: '.+?',/, replace:"connection: 'appdev_default'," },
         {  file:path.join('config', 'connections.js'), tag:"};", replace:connectionInfo + '\n};' },
//                             {  file:path.join('assets', 'js', 'app.js'), tag:/(socket\.on\('message'[\s\S]+?)(\}\);)/, replace:adPublish }
    ];
    self.patchFile( patchSet, function() {

        // now install the sails-disk adaptor

        //// But wait!  It comes installed by default!  
        if (done) done();

//         var params = [ 'install',  'balderdashy/sails-memory', '--save'];
//         AD.log();
//         AD.log('<green><bold>installing:</bold>  sails-memory adaptor </green>');

//         AD.spawn.command({
//             command:'npm',
//             options:params,
//             textFilter:['Creating', '─', 'npm', 'http', '304', 'GET' ],
// //shouldEcho:false
//         })
//         .fail(function(err){
//             AD.log.error('<bold>error:</bold> unable to \'npm '+ params.join(' ') +'\' ', err);
//             process.exit(1);
//         })
//         .then(function(){

//             if (done) done();
//         });

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

            AD.log.error('<bold>error:</bold> getting answers for mysql information. ',err);
            process.exit(1);

        } else {

//// TODO: <Johnny> figure out how sails now handles socket messages and pass those onto our CanJS models.
//            var adPublish = ["$1","      AD.comm.hub.publish('ad.sails.model.update', message);", '', '', "$2"].join('\n');

            //// patch config/local.js to include the local mysql settings
            var patchSet = [ {  file:path.join('config', 'local.js'), tag:"};", template:'__config_db_mysql.ejs', data:data },
                             {  file:path.join('config', 'models.js'), tag:/\/*\s*connection: '.+?',/, replace:"connection: 'appdev_default'," },
                             {  file:path.join('config', 'connections.js'), tag:"someMysqlServer", replace:"appdev_default" },
//                             {  file:path.join('assets', 'js', 'app.js'), tag:/(socket\.on\('message'[\s\S]+?)(\}\);)/, replace:adPublish }
                           ];
            self.patchFile( patchSet, function() {

                // now install the sails-mysql adaptor

                var params = [ 'install',  'balderdashy/sails-mysql', '--save'];
                AD.log();
                AD.log('<green><bold>installing:</bold>  sails-mysql adaptor </green>');

                AD.spawn.command({
                    command:'npm',
                    options:params,
                    textFilter:['Creating', '─', 'npm', 'http', '304', 'GET' ],
//shouldEcho:false
                })
                .fail(function(err){
                    AD.log.error('<bold>error:</bold> unable to \'npm '+ params.join(' ') +'\' ', err);
                    process.exit(1);
                })
                .then(function(){

                    if (done) done();
                });
 
/*
////
//// Example of how to install directly from github:
////


// But, npm doesn't have the latest working copy of sails-mysql that works with sails v0.10.x
// so for now we need to
//     - git clone sails-mysql
//     - git merge with another patch
//     - npm install to fill out the sails-mysql dependencies

// NOTE: until the 'npm sails-mysql' is compatibale with sailsjs v0.10.x  we need to do this:
// npm install sails-mysql@0.10.x
                //var params = [ 'install',  'sails-mysql', '--save'];
                var sailsPath = path.join('node_modules','sails-mysql');
                var params = ['clone', 'https://github.com/balderdashy/sails-mysql.git', sailsPath ];
                util.log();
                util.log('installing sails-mysql adaptor from GIT ');

                self.shell('git', params, ['Creating'], function(){


                    if (!fs.existsSync(sailsPath)) {

                        util.error('sails-mysql not installed.');
                        util.error('Are you sure you are connected to the internet?');
                        process.exit(1);

                    } else {

                        process.chdir(sailsPath);

                        util.log();
                        util.log('merging sails-mysql with patch ...');

                        var mergeParams = ['pull', '--no-ff', 'https://github.com/generalov/sails-mysql.git', 'patch-1'];
                        self.shell('git', mergeParams,['Creating'], function() {

                            //// now tell NPM to install it's dependencies
                            util.log('NPM installing sails-mysql dependencies ');

                            var npmParams = ['install'];
                            self.shell('npm', npmParams, [], function() {
                                process.chdir(path.join('..', '..'));
                                if (done) done();
                            });


                        });


                    }

                });
*/
            });


        }

    });
};



Resource.moveGruntFile = function (done) {

//    var self = this;

    // yeah, so for now v10-rc2 has introduced some default changes that
    // break our setup.  Until we fix all that, the easiest thing to do
    // is to disable Grunt's auto linking so we don't inject js into
    // our pages incorrectly.

    AD.log('<yellow><bold>disable:</bold> *** disabling Grunt: </yellow>');

    var hookData = [
        '{',
        '  "hooks":{',
        '    "grunt":false',
        '  },'
    ].join('\n');

    var patchSet = [
        {  file:'.sailsrc', tag:"{", replace:hookData  },
    ];
    this.patchFile( patchSet, function() {
        done();
    });
    
};



Resource.patchAppdevSettings = function (done) {

    //// NOTE: these are now contained in the appdev-core plugin:
/*    var self = this;

    var routes = [
                   "  'get /site/config/data.js'      : 'ADCoreController.configData'",
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
*/
    done();
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
                    {  file:path.join('config', 'connections.js'), tag:'module.exports.connections', replace:'var connections = module.exports.connections'  },
                    // Enable CSRF tokens
                    {  file:path.join('config', 'csrf.js'), tag:'// module.exports.csrf = false;', replace:'module.exports.csrf = true;'  },
                    // Set session cookies to expire after 1 hour
                    {  file:path.join('config', 'session.js'), tag:/(\/\/ cookie:[^}]+?\},?)/m, replace:'$1\n  cookie: { maxAge: 1*60*60*1000, secure: false },'  },

                    //// NOTE: sails v0.10.4 has all config options commented out, so we need to uncomment one for our 
                    ////       current method of patching config/local.js to work.
                    {  file:path.join('config', 'local.js'), tag:'// environment:', replace:'environment:'  }
                 ];

   self.patchFile( patchSet, function() {

        var responses = {
            'remove':'y\n'
        };

        
        // remove the existing config/bootstrap.js  file
        AD.spawn.command({
            command:'rm',
            options:[ path.join('config', 'bootstrap.js')],
            shouldEcho:false,
            responses:responses
        })
        .fail(function(err){
            AD.log.error('<bold>install:</bold> error removing config/bootstrap.js ', err);
            process.exit(1);
        })
        .then(function(code){

            // now copy over our bootstrap.js template:
            var filesToCopy = [
                        { file:path.join('config','bootstrap.js'), template:'__install_config_bootstrap.ejs'}
                        ];
           self.copyContent(filesToCopy, function() {

               if (done) done();
           });

        });

   });
};







Resource.setModelMigrate = function (done) {

    var self = this;

    //// This step ensures there is a migrate:'safe' setting in the config/models.js

    //// // migrate: 'alter'  
    //// to 
    //// migrate: 'safe'
    ////


    //// patch config/local.js to include the memory settings
    var patchSet = [
         {  file:path.join('config', 'models.js'), tag:/\/*\s*migrate: '.+?'/, replace:"migrate: 'safe'" },
    ];
    self.patchFile( patchSet, function() {

        if (done) done();

    });


};



Resource.developSailsLift = function(done) {
// in the setup process, if a --develop command is given,
// make sure to start sails so the initial DB tables are created.
    var _this = this;


    // if we are in --develop mode
    if (this.params.develop) {

        var currPath = process.cwd();

        // we need to start Sails and get Sails to create the DB tables:
        AD.log('<yellow>develop:</yellow> starting sails to create db tables');
        AD.test.sails.load()
        .fail(function(err){
            done(err);
        })
        .then(function(sailsInst){

            // should be loaded now, so continue on:
            // sailsInst.lower();   // <-- don't do this so we keep Sails resources available for later

            _this.options.sailsInst = sailsInst; // keep this for later

            // make sure we end up at our original dir location
            process.chdir(currPath);
            done();

        })

    } else {

        done();
    }

}



var processActions = function(actionList, cb) {

    // if we have actions to process
    if (actionList.length) {

        // get next action definition
        var def = actionList.shift();


        // look for an existing definition
        PermissionAction.find({action_key: def.action_key } )
        .then(function(list) {

            // if no existing definitions then create it.
            if (list.length == 0) {

                def.language_code = def.language_code || 'en';
                AD.log('<green>creating:</green> permission action:'+def.action_key);
                Multilingual.model.create({
                    model:PermissionAction,
                    data:def
                })
                .fail(function(err){
                    cb(err);
                })
                .then(function(data){

                    // do the next one
                    processActions(actionList, cb);

                })

            } else {

                // AD.log('exists: permission action:'+def.action_key);

                // do the next one
                processActions(actionList, cb);
            }

        })
        .catch(function(err) {
            cb(err);
        });

    } else {

        // successfully done
        cb();
    }
}



var recurseActionFiles = function(list, cb) {

    // if we are done, then return
    if (list.length == 0) {
        cb();
    } else {

        // get next file name
        var file = list.shift();


        // pull in the definitions and process the Actions
        var def = require(file);       
        if (def.actions) {

            processActions(def.actions, function(err) {
                if (err) {
                    cb(err);
                } else {

                    recurseActionFiles(list,cb);

                }
            })

        } else {

            AD.log('<yellow><bold>warn :</bold></yellow> no actions defined in :'+file);

            recurseActionFiles(list, cb);

        }
        

    }

}



Resource.developActionKeys = function(done) {
// in the setup process, if a --develop command is given,
// we need to make sure our Action Keys are installed:

    var _this = this;

    // if we are in --develop mode
    if (this.params.develop) {


        var listModules = ['appdev-core', 'appdev-opsportal'];
        var listActionDefs = [];
        listModules.forEach(function(module){
            listActionDefs.push( path.join(process.cwd(), 'node_modules', module, 'setup', 'permissions', 'actions.js'));
        })

        recurseActionFiles(listActionDefs, function(err) {

            // now let's close our 1st sails instance, so those changes are saved:
// AD.log('>>> lowering sails to persist local data ');

            _this.options.sailsInst.lower(function(){

// AD.log('<<< sails lowered: continue:');
                done(err);
            })

        });


    } else {

        done();
    }

}



Resource.developPermissions = function(done) {
// in the setup process, if a --develop command is given,
// go ahead and setup the permissions:
    var _this = this;



    // if we are in --develop mode
    if (this.params.develop) {

        var currPath = process.cwd();

        process.chdir(path.join('node_modules','appdev-opsportal','setup', 'install'));

        var responses = {
            'admin userid:':'\n',
            'password':'\n',
            'System Admin Role:': '\n',
            'scope of all users:': '\n',
            'production': 'dev\n',
            'languages' : 'en:English,ko:Korean,zh-hans:Chinese\n',

            // if you are reinstalling in an existing setup:
            // assume you still want the default settings.
            'use this account': 'yes\n',
            'use this role': 'yes\n',
            'use this scope': 'yes\n'
        };

        
        // install.js => setups up initial permissions
        AD.spawn.command({
            command:'node',
            options:[ 'install.js' ],
//            shouldEcho:false,
            responses:responses
        })
        .fail(function(err){
            AD.log.error('<bold>develop:</bold> error running permission install ', err);
            process.exit(1);
        })
        .then(function(code){

            process.chdir(currPath);
            done();

        });

    } else {

        done();
    }

}



Resource.developCreateOpsPortal = function(done) {
    // now step through the process to actually create and setup the opsportal
    // on a web page:

    var _this = this;


    // if we are in --develop mode
    if (this.params.develop) {

        async.series([

            // 1) run the appdev page portal  command:
            function(next) {


                AD.spawn.command({
                    command:'appdev',
                    options:['page', 'opsportal'],
                    exitTrigger:'access your page at:',
                })
                .fail(function(err){
                    AD.log.error('<bold>develop:</bold> unable to run: appdev page opsportal', err);
                    next(err);
                })
                .then(function() {

                    next();

                });

            },


            // 2) insert the HTML div for the opsportal widget
            function(next) {

                var patchSet = [
                    {
                        file: path.join('views', 'page', 'opsportal.ejs'),
                        tag: /<script(.|\n)*\/steal.js.*<\/script>/,
                        replace: [ 
                            "<div id='portal'></div>",
                            "<script type='text/javascript' src='../steal/steal<%- sails.config.environment == 'development'? '': '.production' %>.js?OpsPortal'></script>"
                        ].join('\n')

                    }

// This should now be done in: appdev page opsportal                    
                    // {
                    //     file: path.join('config', 'policies.js'),
                    //     tag: /module.*\{/,
                    //     replace: [ 
                    //         "module.exports.policies = {",
                    //         "  PageController:{",
                    //         "    opsportal:['sessionAuth']",
                    //         "  },"
                    //     ].join('\n')

                    // }
                ];
                _this.patchFile(patchSet, function() {
                    next();
                });

            },


            // 3) remove the unwanted opsportal.js definitions:
            function(next) {

                var patchSet = [
                    {
                        file: path.join('config', 'opsportal.js'),
                        tag: /,\s*{\n(.)*\/\/ MPD(.|\n)*},/,
                        replace: ""
                    }
                ];
                _this.patchFile(patchSet, function() {
                    next();
                });

            }

        ], function(err, results) {
            done(err);
        })

    } else {

        done();
    }

}


