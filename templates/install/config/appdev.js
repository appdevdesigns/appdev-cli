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
  'authType': '[[authType]]',

  'localAuth': {
      // Allow users to register new accounts?
      'canRegister': false,
      // Do new accounts need approval before being active?
      'requireApproval': true
  },

  // what is the uri of the login page / service?
  'authURI': 'site/login',




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


};