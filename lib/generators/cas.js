
var Generator = require('./class_generator.js');

var CAS = new Generator({
    key:'cas',
    command:'cas cas ',
    commandHelp: 'Install CAS authentication to the existing installation',
    parameters:[],
    newText:'Adding CAS authentication to sails...'
});


module.exports = CAS;

var util = null;
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


CAS.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
//    this.templateData.appName = this.options.application || '?notFound?';
//    this.templateData.ControllerName = this.options.name || '?resourceNotFound?';

    this.templateData.updateOnly = false;

    util.debug('templateData:');
    util.debug(this.templateData);

    var pathToCAS = path.join(process.cwd(), 'api', 'services', 'CAS.js');
    if ( fs.existsSync(pathToCAS)) {

        var displayPath = pathToCAS.replace(process.cwd(), '');
        util.log();
        util.log("<yellow>directory " + displayPath + " already exists.</yellow>");
        util.log("<yellow>so I'll only update the CAS files.</yellow>");
        util.log();

        this.templateData.updateOnly = true;

        // Remove existing services/CAS.js file  so we copy our template back in.
        fs.unlink(pathToCAS);
    }

};



CAS.postTemplates = function() {

    var self = this;

    var remainingSteps;

    if (! self.templateData.updateOnly) {

        remainingSteps = [
            'authQuestions',    // Ask the Questions for CAS Auth
//            'cloneIt',          // git clone into node_modules
            'installIt',        // npm install cas --save
            'updateAuthType'    // update /config/appdev.js authType = 'CAS'
        ];

    } else {

        remainingSteps = [
            'pullIt',            // git pull the latest changes
            'updateAuthType'     // update /config/appdev.js authType = 'CAS'
        ];
    }


    this.methodStack(remainingSteps, function() {

        // when they are all done:

        util.log();
        if (self.templateData.updateOnly) {
            util.log('<yellow>updated CAS authentication.</yellow>');
        } else {
            util.log('<yellow>updated CAS authentication.</yellow>');
        }
        util.log('<yellow> > edit config/cas.js  to configure the cas settings.</yellow>');
        util.log();
        util.log();

    });

};



CAS.authQuestions = function( done ) {
    var self = this;

    var qset =  {
        question: 'what is the base url to your cas server:',
        data: 'baseURL',
        def : 'https://signin.example.com:443/cas',
//        post: function(data) { data.adaptor = data.adaptor.toLowerCase(); }
    };
    this.questions(qset, function(err, data) {
        if (err) {
             process.exit(1);
        } else {

            var patchSet = [
                {  file:path.join('config', 'local.js'), tag:"};", template:'__config_auth_cas.ejs', data:data },
 //               {  file:path.join('config', 'cas.js'), tag:"[[baseURL]]", replace: data.baseURL  },
            ];
            self.patchFile( patchSet, function() {

                if (done) done();
            });
        }

    });

};



CAS.cloneIt = function( done ) {
    // now clone the cas library from github
    var params = [ 'clone',  'https://github.com/joshchan/node-cas.git', path.join('node_modules','cas')];
    util.log();
    util.log('installing cas from git');

    AD.spawn.command({
        command:'git',
        options:params,
        textFilter:['npm', 'http', '304', 'GET' ],
        sholdPipe:true
    })
    .fail(function(err){
        AD.log.error('<bold>ERROR:</bold> can\'t run \'git '+params.join(' ')+'\'');
        process.exit(1);
    })
    .then(function(){

        if (done) done();
    });
};



CAS.installIt = function( done ) {
/*
    var oldCWD = process.cwd();

    process.chdir(path.join('node_modules','cas'));
    // now clone the cas library from github
    var params = [ 'install'];
    util.log();
    util.log('npm install to update the cas dependencies');

    this.shell('npm', params, ['Creating',"├", "└", ">", "CXX", "SOLINK"], function(){
        process.chdir(oldCWD);
        if (done) done();
    });
*/
    AD.spawn.command({
        command:'npm',
        options:['install', '--save', 'joshchan/node-cas'],
        textFilter:['Creating',"├", "└", ">", "CXX", "SOLINK", "npm", 'http', '304', 'WARN']
    })
    .fail(function(err){
        AD.log.error('<bold>error:</bold> attempting to npm install joshchan/node-cas :', err);
        process.exit(1);
    })
    .then(function(){
        if (done) done();
    });

};



CAS.pullIt = function( done ) {
    var oldCWD = process.cwd();

    process.chdir(path.join('node_modules','cas'));
    // now git pull the cas library from github
    var params = [ 'pull', 'origin', 'master'];
    util.log();
    util.log('"git pull" to update the cas dependencies');

    this.shell('git', params, ['Creating'], function(){
        process.chdir(oldCWD);
        if (done) done();
    });
};



CAS.updateAuthType = function (done) {

    // we need to patch the config/appdev.js file to mark authType="CAS"
    var regExpLocal = new RegExp("('authType'[\s\S]*:[\s\S]*[^/]'local')");
    var patchSet = [
        {  file:path.join('config', 'appdev.js'), tag:regExpLocal, replace: "'authType': 'CAS'"  },
        {  file:path.join('config', 'appdev.js'), tag:"[[authType]]", replace: 'CAS'  },
    ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });

};


