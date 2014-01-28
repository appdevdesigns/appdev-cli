/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 *                 This is used on policies that will redirect the user to the forbidden() response.
 *                 ** Used for UI page requests.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

    // if User is authenticated, proceed to the next policy,
    if (ADCore.auth.isAuthenticated(req)) {
        return next();
    } else {

        // call the authentication's
        if (sails.config.appdev.authType == 'CAS') {
            CAS.isAuthenticated(req, res, next);
        } else {
            ADCore.auth.local.isAuthenticated(req, res, next);
        }
    }

    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    // This is used for operations that should result in the forbidden page
    // like UI page requests.
////TODO: <2013/12/12> Johnny : This should be multilingual
//    return res.forbidden('You are not permitted to perform this action.');
};
