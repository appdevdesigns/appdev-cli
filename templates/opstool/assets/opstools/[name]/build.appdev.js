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
var async = require('async');
var fs = require('fs');


module.exports = {

    /* 
     * command()
     *
     * This is the actual command to execute.
     * 
     * This method is required.
     *
     * @param {fn} cb   The callback fn to run when command is complete.
     *                  The callback follows the usual node: cb(err) format.
     */
    command:function(builder, cb) {

        var self = this;

        // this is expected to be running the /assets directory

        // build command:  ./cjs steal/buildjs OpsPortal opstools/<%= name %>


        //// NOTE: the build command will attempt to rebuild OpsPortal/production.[js,css].  We don't
        //// want to do that here, so we'll have to backup the original files and return them when we are done.

        var backUpName= '';
        var backUpCSS = '';

        async.series([


            // step 1:  backup the original OpsPortal/production.* files.
            function (next) {


                backUpName = builder.backupProduction({ base:'OpsPortal', file:'production.js'});
                backUpCSS = builder.backupProduction({ base:'OpsPortal', file:'production.css'});

                next();
            },



            // step 2:  run our build command
            function(next){

                // build command:  ./cjs steal/buildjs OpsPortal opstools/<%= name %>

                AD.log('<green>building</green> opstools/<%= name %>');

                AD.spawn.command({
                    command:'./cjs',
                    // options:[path.join('opstools', '<%= name %>', 'build.js')],
                    options:[path.join('steal', 'buildjs'), 'OpsPortal', path.join('opstools', '<%= name %>')],
shouldEcho:true,
                    // exitTrigger:'opstools/<%= name %>/production.css'
                })
                .fail(function(err){
                    AD.log.error('<red>could not complete opstools/<%= name %> build!</red>');
                    next(err);
                })
                .then(function(){

                   next();

                });

            },



            // step 3:  replace our original OpsPortal/production.* files
            function(next) {

                builder.replaceProduction({ base:'OpsPortal', file:'production.js', backup: backUpName });
                builder.replaceProduction({ base:'OpsPortal', file:'production.css', backup: backUpCSS });
                next();
            },



            // step 4:  patch our production.js to reference OpsPortal/production.js 
            function(next) {

                var patches = [
                    { file:path.join('opstools', '<%= name %>', 'production.js'), tag:'packages/OpsPortal-<%= name %>.js', replace:'OpsPortal/production.js'}
                ];

                builder.patchFile(patches, next);
            }


        ], function( err, results) {

            cb(err);
        });

    }
}

