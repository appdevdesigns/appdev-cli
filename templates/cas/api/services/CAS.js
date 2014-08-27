/**
 * CAS related functions
 */

var AD = require('ad-utils');
var CASObject = require('cas');
var cas;

// The sails.config object is not available yet, so delay initialization
// until the bootstrapping is done.
//// PERHAPS: this should be in /config/bootstrap.js instead?
var tick = function() {
    if (typeof sails != 'undefined') {
        cas = new CASObject({
            base_url: sails.config.cas.baseURL,
            version: 2.0,
            external_pgt_url: sails.config.cas.proxyURL // can be undefined
        });
    } else {
        // nope, still not ready, so wait some more.
        setImmediate(tick);
    }
};
setImmediate(tick);



module.exports.authenticate = function(req, res, callback)
{

    cas.authenticate(req, res, function(err, status, username, extended) {

        if (err) {
console.log('CAS.js:authenticate.cb() : error!');
console.log(err);

            // Error authenticating a proxied JSON request
            if (req.wantsJSON) {
                // unexpected CAS error. proxy issue?
                if (ADCore) {
                    ADCore.comm.error(res, err, 500);
                } else {
                    res.send({
                        success: false,
                        message: err.message
                    }, 500);
                }
            }
            // Error authenticating a normal web page
            else {
                var date = new Date();
                var token = Math.round(date.getTime() / 60000);
                if (req.query['_cas_retry'] != token) {
                    // There was a CAS error. A common cause is when the
                    // `ticket` portion of the querystring remains after the
                    // session times out and the user refreshes the page.
                    // So remove the `ticket` and try again.
                    var url = req.url
                        .replace(/_cas_retry=\d+&?/, '')
                        .replace(/([?&])ticket=[\w-]+/, '$1_cas_retry='+token);
                    res.redirect(url, 307);
                } else {
                    // Already retried. There is no way to recover from this.
                    res.send("<dt>CAS login failed</dt><dd>" + err.message + "</dd>", 401);
                }
            }
        }
        // Successful CAS authentication
        else {
            return callback(username, extended);
        }
    });
};



// Obtain a CAS proxy ticket for a given service URL.
// This requires that the site has been set up with a working proxyURL option.
//
// @param req httpRequest
// @param targetService string
//      The URL you are going to fetch with the proxy ticket
// @param function callback
//      (Optional) The proxy ticket will be delivered this callback function.
// @return Deferred
module.exports.getProxyTicket = function(req, targetService, callback) {
    var dfd = AD.sal.Deferred();
    
    if (!req.session.cas.PGTIOU) {
        var err = new Error('PGTIOU not found in session. Make sure proxyURL is working.');
        dfd.reject(err);
        callback && callback(err);
    }
    else {
        cas.getProxyTicket(req.session.cas.PGTIOU, targetService, function(err, PT) {
            if (err) {
                dfd.reject(err);
            } else {
                dfd.resolve(PT);
            }
            callback && callback(err, PT);
        });
    }
    
    return dfd;
};



module.exports.isAuthenticated = function(req, res, ok)
{
 // User is already authenticated, proceed to controller
    if (ADCore.auth.isAuthenticated(req)) {
      return ok();

    } else {
        //// User is not yet authenticated
        // Handle unproxied JSON service request
        if (req.wantsJSON && !req.query.ticket) {

            // No ticket, so that means the requester is not a CAS proxy.
            // This is an expected normal scenario for JSON requests.
            // Tell the client to open a frame with an HTML page
            ADCore.comm.reauth(res);

        } else {
            //// Handle HTML page requests & proxied JSON requests
            // Automatically redirect to CAS login page
            CAS.authenticate(req, res, function(username, extended) {
                // Successful CAS authentication
                
                // If we are using a CAS proxy, the PGTIOU will be stored
                // as extended['PGTIOU']

                
                var guid = extended.username;
                if (extended.attributes) {
                    if (extended.attributes.eaguid) {
                        guid = extended.attributes.eaguid;
                    }
                }

                ADCore.auth.markAuthenticated(req, guid); //req.session.authenticated = true;
                req.session.cas = extended;
                return ok();
            });
        }

    }
};



module.exports.logout = function(req, res, returnURL) {
    ADCore.auth.markNotAuthenticated(req);
    req.session.casExtended = undefined;
    cas.logout(req, res, returnURL, true);
};


module.exports.baseURI = function() {
    return sails.config.cas.baseURL;
}

