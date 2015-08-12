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
  // 'CAS'   : utilize Central Authentication System
  'authType': '[[authType]]',


  // what is the uri of the login page / service?
  'authURI': 'site/login',




  // Which language is the default language to use when none specified:
  'lang.default': 'en',


  // // for testing purposes: 
  // // note: this will only be used in "development" mode
  // test: {
  // 	anonymousUserID:'specify.User.id'
  // }


};