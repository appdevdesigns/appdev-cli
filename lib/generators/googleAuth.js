
var Generator = require('./class_generator.js');

var GoogleAuth = new Generator({
    key:'googleAuth',
    command:'googleAuth googleAuth ',
    commandHelp: 'Install Google authentication to the existing installation',
    parameters:[],
    newText:'Adding Google authentication to sails...',
    usesTemplates:false
});


module.exports = GoogleAuth;



GoogleAuth.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev googleAuth',
        description:[ 
            'This command adds the config settings for using Google OAuth2 as an authentication ',
            '    mechanism for your sails project.'

        ].join('\n'),
        parameters:[
        
        ],

        examples:[
            '> appdev googleAuth ',
            '    // use google as the authentication for the current SailsJS project ',
            '',
        ]
    });

}

var util = null;
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


GoogleAuth.prepareTemplateData = function () {
    util = this.adg;
    this.templateData = {};

    util.debug('templateData:');
    util.debug(this.templateData);

};



GoogleAuth.postTemplates = function() {

    var self = this;
    var remainingSteps = [
        'authQuestions',    // Ask the Questions for configuration
        'updateAuthType'    // update /config/appdev.js authType = 'google'
    ];

    this.methodStack(remainingSteps, function() {

        // when they are all done:
        util.log();
        util.log('<yellow>updated Google authentication.</yellow>');
        util.log('<yellow> > edit config/local.js  to configure the Google auth settings.</yellow>');
        util.log();
        util.log();

    });

};



GoogleAuth.authQuestions = function(done) {
    var self = this;

    var qset =  {
        question: 'what is your site\'s public URL:',
        data: 'baseURL',
        def : 'autodetect',
        then:[
                {   
                    question:'enter your Google developer OAuth2 clientID:',
                    data:'clientID',
                    def :'edit config later'
                },
                {   
                    question:'enter your Google developer OAuth2 clientSecret:',
                    data:'clientSecret',
                    def :'edit config later'
                },
        ]
    };
    this.questions(qset, function(err, data) {
        if (err) {
             process.exit(1);
        } else {
            // patch the application's local.js
            var patchSet = [
                {  
                    file: path.join('config', 'local.js'), 
                    tag:"\n}", 
                    template:'__config_auth_google.ejs', 
                    data: data
                },
            ];
            self.patchFile(patchSet, done);
        }

    });

};



GoogleAuth.updateAuthType = function(done) {

    // we need to patch the config/appdev.js file to mark authType="google"
    var regex = /["']authType["']\s*:\s*[^,]+/;
    var patchSet = [
        {  file: path.join('config', 'appdev.js'), tag: regex, replace: "'authType': 'google'"  },
        {  file: path.join('config', 'appdev.js'), tag: "[[authType]]", replace: 'google'  },
    ];
    this.patchFile(patchSet, done);

};


