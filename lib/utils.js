

var colog = require('colog');

var Utilities = function (options) {

    this.outputEnabled = {

        v:false,  // verbose messages   : more non technical info
        d:false,  // debug messages     : technical details
        l:true    // log messages       : basic info about actions
    };




};

module.exports = new Utilities();



Utilities.prototype.registerParams = function(params) {

    var self = this;

    params.option('-v', 'verbose output messages');
    params.option('-d', 'display debugging messages  (turns on verbose by default)');
    params.option('-silent', 'disable all messages');


    params.on('-v', function() {
        self.outputEnabled.v = true;
        self.log('<yellow> verbose mode ... </yellow>');
    });

    params.on('-d', function() {
        self.outputEnabled.v = true;
        self.outputEnabled.d = true;
        self.log('<yellow> debugging mode ... </yellow>');
    });


    params.on('-silent', function() {

        self.outputEnabled.v = false;
        self.outputEnabled.d = false;
        self.outputEnabled.l = false;
    });


};





var argsToString = function (args) {

    var all = [];
    for (var a in args) {

        if (typeof args[a] == 'object')  all.push(JSON.stringify(args[a],null, 4));
        else all.push(args[a]);
    }

    return all.join('');
};


Utilities.prototype.verbose = function() {

    if (this.outputEnabled.v)  colog.format('<white>... '+argsToString(arguments)+'</white>');

};



Utilities.prototype.debug = function() {

    if (this.outputEnabled.d)  colog.format('<white>    '+argsToString(arguments)+'</white>');

};



Utilities.prototype.error = function() {

    if (this.outputEnabled.l)  this.log('<red>*** '+argsToString(arguments)+'</red>');

};



Utilities.prototype.log = function() {

    if (this.outputEnabled.l)  colog.format('   '+argsToString(arguments));

};



Utilities.prototype.warn = function() {

    this.log('<yellow>--- '+argsToString(arguments)+'</yellow>');

};




var utilObj = {};
utilObj.string = {};
utilObj.string.replaceAll = function (origString, replaceThis, withThis) {
    var re = new RegExp(RegExpQuote(replaceThis),"g");
    return origString.replace(re, withThis);
};


utilObj.string.render = function(template, obj, tagOpen, tagClose) {

    if (tagOpen === undefined) tagOpen = '[';
    if (tagClose === undefined) tagClose = ']';

    for (var o in obj) {
        var key = tagOpen+o+tagClose;
        template = utilObj.string.replaceAll(template, key, obj[o]); //orig.replace('['+o+']', obj[o]);
    }
    return template;
};


/**
 * @function replaceAll
 *
 * Replace all occurrences of replaceThis with withThis  inside the provided origString.
 *
 * NOTE: this returns a copy of the string.  origString is left as is.
 *
 * @codestart
 * var origString = 'Hello [name]. What is the Matrix, [name]?';
 * var replaceThis = '[name]';
 * withThis = 'Neo';
 *
 * var newString = Utilities.String.replaceAll(origString, replaceThis, withThis);
 *
 * console.log(origString);  // Hello [name]. What is the Matrix, [name]?
 * console.log(newString);  // Hello Neo. What is the Matrix, Neo?
 * @codeend
 *
 * @param {string} origString the string to check
 * @return {bool}
 */
Utilities.prototype.String = {};

Utilities.prototype.String.replaceAll = function (origString, replaceThis, withThis) {
    return utilObj.string.replaceAll(origString, replaceThis, withThis);
};



/**
 * @function render
 *
 * Treat the given string as a template, that has placeholders to be filled
 * by the given obj properties.
 *
 * NOTE: place holders will be the obj properties with a '[' & ']' around it.
 * @codestart
 * var data = { name:'myModule', id:1 };
 * var template = '/module/[name]/[id]';
 * var actual = Utilities.String.render(template, data);
 * // actual == '/module/myModule/1'
 * @codeend
 *
 * @param {string} template string with placeholders
 * @param {object} obj  template data
 * @param {string} tagOpen  the template tag opening (default: '[')
 * @param {string} tagClose the closing template tag (default: ']')
 * @return {string} template with given data replaced
 */
Utilities.prototype.String.render = function(template, obj, tagOpen, tagClose) {

    return utilObj.string.render(template, obj, tagOpen, tagClose);
};



RegExpQuote = function(str) {
     return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
};





