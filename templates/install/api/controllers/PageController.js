/**
 * PageController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
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

var fs = require("fs");
var path = require("path");

module.exports = {




  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to PageController)
   */
  _config: {}




  , pageAsset:function(req,res) {
      // route :  /page/*/*

      var urlParts = req.url.split('/');


      // remove 'page'
      var value = urlParts.shift();
      if (value == '') urlParts.shift();

      // if this maps to a normal asset
      var assetPath = path.join('assets', urlParts.join(path.sep));
      fs.exists(assetPath,function (exists) {

          if (exists) {

              // just return that file
              res.sendfile(assetPath);

          } else {

               // this is a page/[pageName]/[file] request:
               var filePath = path.join('assets', 'page', urlParts.join(path.sep));

               res.sendfile(filePath);
          }

       });
  }



};
