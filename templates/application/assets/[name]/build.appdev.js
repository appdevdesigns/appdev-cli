/*
 * build.appdev.js
 *
 * This file is intended to be used by the appdev build command line tool.
 *
 * This file exports the actual command() to run when trying to build this 
 * application/widget.
 *
 * Create your command() to run from the [root]/assets  directory.
 *
 */



var AD = require('ad-utils');
var path = require('path');
var fs = require('fs');
var async = require('async');
var transform = require("steal-tools").transform;


module.exports = {

    /* 
     * command()
     *
     * This is the actual command to execute.
     * 
     * This method is required.
     *
     * @param {obj} builder The appdev.build object that is running this command.
     * @param {fn} cb   The callback fn to run when command is complete.
     *                  The callback follows the usual node: cb(err) format.
     */
    command:function(builder, cb) {

        var self = this;


        //// NOTE:  this is expected to be running the /assets directory


        async.series([

            // step 1:  check to make sure appdev exists:
            function(next) {

                 fs.exists(path.join(process.cwd(), 'appdev'), function(exists) {

                    if (exists) {
                        next();
                    } else {
                        AD.log('<red>error:</red> building <%= name %> requires appdev module to be installed as well.');
                        var err = new Error('building <%= name %> requires appdev module to be installed as well. ');
                        next(err);
                    }

                });

            }, 



            // step 2:  build js files
            function (next) {

                // 1) We are going to run the steal/buildjs against appdev and <%= name %>
                //    so that the <%= name %> doesn't package together the appdev library.

                AD.log('<green>building</green> <%= name %> JS files');

                // Minify js/ejs files
                transform({
                    main: path.join('<%= name %>', '<%= name %>'),
                    config: "stealconfig.js"
                }, {
                        minify: true,
                        ignore: [
                            /^.*(.css)+/, // Ignore css files
                            /^(?!opstools\/<%= name %>.*)/, // Ignore all are not plugin scripts
                        ]
                    }).then(function (transform) {
                        // Get the main module and it's dependencies as a string
                        var main = transform();

                        fs.writeFile(path.join('<%= name %>', 'production.js'), main.code, "utf8", function (err) {
                            if (err) {
                                AD.log.error('<red>could not write minified <%= name %> JS file !</red>');
                                next(err);
                            }

                            next();
                        });
                    })
                    .catch(function (err) {
                        AD.log.error('<red>could not complete opstools/<%= name %> JS build!</red>');
                        next(err);
                    });
            },


            // step 3:  build css files
            function (next) {
                AD.log('<green>building</green> <%= name %> CSS files');

                // Minify css files
                transform({
                    main: path.join( '<%= name %>', '<%= name %>'),
                    config: "stealconfig.js"
                }, {
                        minify: true,
                        ignore: [
                            /^(?!.*(.css)+)/, // Get only css files
                            /^(?!opstools\/<%= name %>.*)/, // Ignore all are not plugin scripts
                        ]
                    }).then(function (transform) {
                        var main = transform();

                        fs.writeFile(path.join('<%= name %>', 'production.css'), main.code, "utf8", function (err) {
                            if (err) {
                                AD.log.error('<red>could not write minified CSS file !</red>', err);
                                next(err);
                            }

                            next();
                        });
                    })
                    .catch(function (err) {
                        AD.log.error('<red>could not complete <%= name %> CSS build!</red>', err);
                        next(err);
                    });
            },


            // step 4: cleanup the production.js file to point to 
            //         appdev/production.js
            function(next) {

                AD.log('<green>cleaning</green> the <%= name %>/production.js file');

                var patches = [
                    { file:path.join('<%= name %>', 'production.js'), tag:'id:"packages/<%= name %>-appdev.js",', replace:'id:"appdev/production.js",'}
                ];
                builder.patchFile(patches, next);

            }

        ], function(err, results) {
            if (cb) cb(err);
        });

    }

}