
var Generator = require('./class_generator.js');

var Build = new Generator({
    key:'build',
    command:'build [app:[appName]] [config:[config]] ',
    commandHelp: 'Compress and minify the .js, .css, .ejs resources for a client application.',
    parameters:[ '[options]' ],
    newText:'Building current applicationn...',
    atRoot:false,    // don't operate from the root directory!
    usesTemplates:false
});


module.exports = Build;



Build.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev build <green><bold>[app:[buildFile]] [config:[config]] [minify:[true/false]]</bold></green>',
        description:[ 
            'This command runs steal.build on your client side application.  Use this command to build production ready compressed/minimized bundles for loading your application.',
            '',
            '    Run this command in the root directory of your '+path.join('assets', '[application]')+' folder.',
            '',
            '    By default, this app will look for a "build.js" file that specifies the steal() commands to load your app.  If you need to use a different file, override this with the <green>app:[buildFile]</green> setting. '

        ].join('\n'),
        parameters:[

        '<green>[app:[buildFile]]</green>    : <green>(optional)</green> the name of the file that specifies the ',
        '                       steal commands used to load your app.',
        '<green>[config:[config]]</green>    : <green>(optional)</green> the name of a file to use for ',
        '                       configuration options. Default:"build.config.js". ',
        '<green>[minify:[true/false]]</green>: <green>(optionsl)</green> turn on/off minification.  Default:<yellow>true</yellow>'
        
        ],

        examples:[
            '> appdev build ',
            '    // <green>reads:</green> in '+path.join('[currentDirectory]', 'build.js')+' information',
            '    // <green>reads:</green> '+path.join('[currentDirectory]','build.config.js')+' config data ',
            '    // <green>creates:</green> '+path.join('[currentDirectory]', 'app.min.js')+' minimized + compressed bundle.',
            ''
        ]
    });

}



var util = null;
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


var stealTools = require("steal-tools");

Build.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};

    this.cwd = process.cwd();

//    this.templateData.appName = this.options.application || '?notFound?';
//    this.templateData.ControllerName = this.options.name || '?resourceNotFound?';

    this.templateData.config = {
        main:'build.js',
        config: path.join(this.cwd , 'build.config.js')
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

    // a simple fn() to display a message and quit.
    var quitOut = function (message) {
        AD.log();
        AD.log(message);
        AD.log();
        process.exit(1);
    }


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

};



Build.postTemplates = function() {

    var self = this;

    var remainingSteps = [
            'callBuild',            // call the stealTools.build() method.
            // 'updateAuthType'     // update /config/appdev.js authType = 'CAS'
        ];
    


    this.methodStack(remainingSteps, function() {

        // when they are all done:

        AD.log();
        AD.log('<yellow> > build finished </yellow>');
        AD.log();

    });

};




Build.callBuild = function(done) {
    var self = this;

    

    var data = stealTools.build(self.templateData.config,  self.templateData.options);

    AD.log('... stealTools.build() return: ', data);

    done()


}


// Build.authQuestions = function( done ) {
//     var self = this;

//     var qset =  {
//         question: 'what is the base url to your cas server:',
//         data: 'baseURL',
//         def : 'https://signin.example.com:443/cas',
// //        post: function(data) { data.adaptor = data.adaptor.toLowerCase(); }
//         then:[
//                 {   
//                     question:'what is the url for your proxy server:',
//                     data:'proxyURL',
//                     def :'none'
//                 },
//         ]
//     };
//     this.questions(qset, function(err, data) {
//         if (err) {
//              process.exit(1);
//         } else {

//             var patchSet = [
//                 {  file:path.join('config', 'local.js'), tag:"\n}", template:'__config_auth_cas.ejs', data:data },
//  //               {  file:path.join('config', 'cas.js'), tag:"[[baseURL]]", replace: data.baseURL  },
//             ];
//             self.patchFile( patchSet, function() {

//                 if (done) done();
//             });
//         }

//     });

// };



// CAS.cloneIt = function( done ) {
//     // now clone the cas library from github
//     var params = [ 'clone',  'https://github.com/joshchan/node-cas.git', path.join('node_modules','cas')];
//     util.log();
//     util.log('installing cas from git');

//     AD.spawn.command({
//         command:'git',
//         options:params,
//         textFilter:['npm', 'http', '304', 'GET' ],
//         sholdPipe:true
//     })
//     .fail(function(err){
//         AD.log.error('<bold>ERROR:</bold> can\'t run \'git '+params.join(' ')+'\'');
//         process.exit(1);
//     })
//     .then(function(){

//         if (done) done();
//     });
// };



