/**
 * Appdev
 *
 * This configuration file sets common settings for the appdev framework to
 * function properly.
 *
 */

module.exports.appdev = {

  // Which Type of authentication mechanism is in place for the current setup:
  // 'local' : basic username / password, successfully stored users session
  // 'CAS'   : utilize Central Authentication Service
  // 'google': Google OAuth2
  'authType': 'local',

  'localAuth': {
      // Allow users to register new accounts?
      'canRegister': false,
      // Do new accounts need approval before being active?
      'requireApproval': true,


      ////
      //// NOTE:  these can be replaced by local Themes:
      ////

      // which login form to display:
      'localLoginView' : 'appdev-core/adcore/loginform.ejs',

      // which logout page to display:
      'localLogoutView' : 'appdev-core/adcore/logout.ejs',
  },

  // what is the uri of the login page / service?
  'authURI': 'site/login',


  // if set, will redirect to this route upon successful logout
  // probably want to redirect to the default view
  'authLogoutRedirect' : '/',


  // Full URL to this site
  //'siteBaseURL': 'http://www.example.com:1337',


  // Keys that can be passed in through the 'authorization' http request
  // header. They will cause requests with them to be seen as coming from an
  // existing user.
  'authKeys': {
    /*
        // example--
        'some_user_guid': [
            'auth_key_#1 in an array',
            'auth_key_#2 in an array',
            ...
        ],
        'some_other_guid': 'single key as a string',
        'admin_guid': [ 
            'c81878992a3b08b28781ac553db6ea1212781dd0',
            'c9009fa7de950bf5fb69185ba1d5e619b7a993a3'
        ],
        ...
    */
  },


  // Which language is the default language to use when none specified:
  'lang.default': 'en',


  // // Authenticate as a Default Test User: 
  // // (note: this will only be used in a non "production" mode environment)
  // // if you want to auto login the user to a specific user,
  // // then place their guid here:
  // "test": {
  //     "user":{
  //         "guid":'the.site.user.guid.to.default.to'
  //     }
  // },


  test: { 
    anonymousUserID:'admin'
  }
};