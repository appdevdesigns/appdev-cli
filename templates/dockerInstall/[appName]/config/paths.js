/**
 * Appdev
 *
 * Currently the default sailsJS setup uses grunt and compiles our assets
 * into a .tmp/public  folder that sails uses as the public folder by default.
 *
 * here we remap public to the /assets folder  like we were expecting
 * previously.
 *
 * This is a temporary fix until we migrate our apps to adjust to Grunt and
 * this new setup.
 *
 */
var path = require('path');

module.exports.paths = {

    public: path.resolve(__dirname, '..', 'assets')

};




