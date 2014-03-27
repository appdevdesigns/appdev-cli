
var path = require('path');


module.exports = {

    routes:function(routes) {
        combine({
            obj:routes,
            file:'./config/routes.js',
            kind:'route'
        });
    },


    policies:function(policies) {
        combine({
            obj:policies,
            file:'./config/policies.js',
            kind:'policy'
        });
    }
};



var combine = function( opts ) {

    var obj = opts.obj;
    var myObj = require(opts.file);
    for (var key in myObj) {

        if (typeof obj[key] == 'undefined') {
            obj[key] = myObj[key];
        } else {

console.log( '**** Warning '+ moduleName() + ':  '+opt.kind+' ['+key+'] already defined in sails');

        }
    }
};



var moduleName = function() {
    var dirName = __dirname;
    var parts = dirName.split(path.sep);
    return parts.pop();
};