/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets 
 * lifted. This gives you an opportunity to set up your data model, run jobs, 
 * or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://links.sailsjs.org/docs/config/bootstrap
 */


////
//// Appdev Plugin Modification:
////
var path = require('path');
var async = require('async');
var AD = require('ad-utils');
var plugins = [];


// Globally preload the ADCore service. It is needed by the policies.
ADCore = require(path.join(process.cwd(), 'api', 'services', 'ADCore.js'));


module.exports.bootstrap = function(cb) {

    async.series(plugins, function(err, results) {

        if (err) {
            AD.log.error('<bold>config/bootstrap.js</bold> encountered an error :', err);
            process.exit(1);
        }

        cb();
    })
};
plugins.push(function(next){ require('app_builder').bootstrap(next); });
plugins.push(function(next){ require('appdev-core').bootstrap(next); });
plugins.push(function(next){ require('appdev-opsportal').bootstrap(next); });
plugins.push(function(next){ require('opstool-emailNotifications').bootstrap(next); });
