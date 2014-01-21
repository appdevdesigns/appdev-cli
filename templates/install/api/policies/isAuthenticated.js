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

    // NOTE: no authentication mechanism is in place at the moment
    // so for now:
    return next();

    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    if (req.session.authenticated) {
        return next();
    }

    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    // This is used for operations that should result in the forbidden page
    // like UI page requests.
////TODO: <2013/12/12> Johnny : This should be multilingual
    return res.forbidden('You are not permitted to perform this action.');
};
