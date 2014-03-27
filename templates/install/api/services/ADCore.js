/**
 * ADCore
 *
 * @module      :: Service
 * @description :: This is a collection of core appdev features for an application.

 *
 */
var $ = require('jquery');

module.exports = {


    auth: {

        isAuthenticated: function( req ) {

            if (req.session.authenticated) {
                return true;
            } else {
                return false;
            }

        },



        local: {
            isAuthenticated:function(req, res, next) {
            ////TODO: <2014/1/24> Johnny : Implement a Local Auth option
                // this is used by service isAuthenticated to determine if a
                // user is authenticated, and if not, what to do to begin the
                // process of authenticating them...
                // handle both web service request & web page requests

                next();
            }
        },



        markAuthenticated: function(req, guid) {
            req.session.authenticated = true;
            req.session.appdev = req.session.appdev || { auth:{}, user:{} };
            req.session.appdev.auth.guid = guid;
        },



        markNotAuthenticated: function(req) {
            req.session.authenticated = false;
            req.session.appdev = { auth:{}, user:{} };  // drop all appdev info
        }
    },


    comm:{

        error:function(res, err, code) {

            var packet = {
                status:'error',
                data:err
            };

            // add in optional properties: id, message
            if (err.id) packet.id = err.id;
            if (err.message) packet.message = err.message;

            // default to HTTP status code: 400
            if ('undefined' == typeof code) code = 400; //AD.Const.HTTP.OK;  // 200: assume all is ok

            res.header('Content-type', 'application/json');
            res.send(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
        },



        reauth:function(res) {

            var packet = {
                id:5,
                message:'Reauthenticate.'
            };

            // add in additional auth info depending on
            // authType
            if ('CAS' == sails.config.appdev.authType) {
                // include CAS: { uri:'cas/url/here' }
                packet.CAS = {
                        uri:sails.config.cas.baseURL
                }
            }

            // NOTE: this == ADCore.comm
            this.error(res, packet, 401);
        },



        success:function(res, data, code) {

            var packet = {
                status:'success',
                data:data
            };

            // default to HTTP status code: 200
            if ('undefined' == typeof code) code = 200; //AD.Const.HTTP.OK;  // 200: assume all is ok

            res.header('Content-type', 'application/json');
            res.send(JSON.stringify(packet).replace('"false"', 'false').replace('"true"', 'true'), code);
        }

    },



    hasPermission: function(req, res, next, actionKey) {
        // only continue if current user has an actionKey in one of their
        // permissions.

//// TODO: <2013/12/12> Johnny : uncomment the unit tests for this action
////       when implemented.

// console.log('ADCore.hasPermission() :  actionKey:' + actionKey);
        // pull req.session.appdev.user
        // if (user.hasPermission( actionKey) ) {
        //     next();
        // } else {
        //     res.forbidden('you dont have permission to access this resource.');
        // }

        // for now just
        next();
    },



    labelsForContext: function(context, code, cb) {
        var dfd = $.Deferred();

        // verify cb is properly set
        if (typeof code == 'function') {
            if (typeof cb == 'undefined') {
                cb = code;
                code = sails.config.appdev['lang.default']; // 'en';    // <-- this should come from site Default
            }
        }


        // options is the filter for our SiteMultilingualLabel.find()
        // make sure something is set for context
        var options = {
            label_context: context || ''
        };


        // optionally set code if provided
        if (code) {
            options.language_code = code;
        }


        SiteMultilingualLabel.find(options)
        .then(function(data){

            if (cb) cb(null, data);
            dfd.resolve(data);

        })
        .fail(function(err){

            if (cb) cb(err);
            dfd.reject(err);
        });

        return dfd;
    },



    user:{

        /*
         * Return who the system should think the current user is.
         *
         * Note: this will report what switcheroo wants you to think.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.user
         *                 field.
         */
        current: function (req) {
//            return req.session.appdev.user;

//// TODO: implement the authentication so we can have a user object.
            return {
                    hasPermission:function() {return true;}
            };
        },



        /*
         * Return who the current user actually is.
         *
         * Note: switcheroo can not spoof this.
         *
         * @param {object} req,  the express/sails request object.  User
         *                 info is stored in the req.session.appdev.actualUser
         *                 field.
         */
        actual: function (req) {
//            return req.session.appdev.actualUser;
//// TODO: implement the authentication so we can have a user object.
            return {
                    hasPermission:function() {return true;}
            };
        }
    }
};


//// LEFT OFF:
//// - figure out unit tests for testing the controller output.