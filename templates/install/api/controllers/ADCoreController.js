/**
 * ADCoreController
 *
 * @module      :: Controller
 * @description :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var path = require('path');
var fs = require('fs');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to ADCoreController)
     */
    _config: {},



    /**
     * configData
     * returns the configuration data back to the requester as a javascript
     * code file.
     */
    configData: function(req, res) {
//console.log(sails);
     // prepare proper content type headers
        res.setHeader('content-type', 'application/javascript');

        // render this view with data
        return res.view({
            settings:sails.config.appdev,
            layout:false
        });
    },



    /**
     * Action blueprints:
     *    `/adlanguage/labelConfigFile`
     *    route: /site/label/:context (applicationkey)
     */
     labelConfigFile: function (req, res) {

         var context = req.param('context');

//// TODO: pull user's default language from their session and save to template:
         // var currLangCode = req.session.languageCode
         //                    || req.session.preferences.defaultLanguage;
         var currLangCode = 'en';

         ADCore.labelsForContext(context, currLangCode, function(err, data) {

             if (err) {

                 // error handler
                 console.log(err);
                 res.error(err);

             } else {

                 // prepare proper content type headers
                 res.setHeader('content-type', 'application/javascript');

                 // render this view with data
                 return res.view({
                     langCode:currLangCode,
                     labels: data,
                     layout:false
                 });
             }

         });


    }



    , testingFiles:function(req,res) {
        // in order to allow mocha-phantomjs to include files in our
        // installed node_modules/ folders we add this action that
        // will return those files.
        //
        // route :  /node_modules/*
        //


        // this method is NOT active in production environment
        if (sails.config.environment != 'production') {

            var urlParts = req.url.split('/');

            // if this maps to a normal asset
            var assetPath = path.join(process.cwd(), urlParts.join(path.sep));
            fs.exists(assetPath,function (exists) {

                if (exists) {

                    // just return that file
                    res.sendfile(assetPath);

                } else {

    console.log('path not found:'+assetPath);
                     res.error();

                }

             });

        } else {

            // sorry, not allowed in production.
            res.forbidden();
        }

    }


};
