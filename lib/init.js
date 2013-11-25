/**
 * lib/init.js
 *
 * Prepare our Generator object to be used:
 *   - gather the available generators into a single Generator Object.
 *
 */

 var fs = require('fs');
 var util = null;
 var paramDebug = null;
 var p = require('path');

 /**
  * Generator Class
  *
  * @constructor
  */
function Generators() {

    this.listGenerators = {};  //
    this.activeKey = null;        // which generator was found by the parameter commander
}


function isClassFile (name) {
    return name.toLowerCase().indexOf('class_') != -1;
}


(function() {

    // return the list of generators:
    this.generators = function() {
        return this.listGenerators;
    }


    // scan the directory for generators to load
    this.init = function( adg ) {

        this.adg = adg;
        util = adg;


        // scan the directory
        var path = p.join(__dirname , 'generators');
        var files = fs.readdirSync(path);

        // for each file
        for( var f in files) {
            var name = files[f];

            // if not a class definition then
            if (! isClassFile(name) ) {

                // import
                var obj = require( p.join(path , name));

                // get generator Key as obj.key or as filename if no obj.key found
                var genKey = obj.key || name.split('.')[0];

                // store generator
                this.listGenerators[genKey] = obj;

                // pass along our adg object
                obj.init(adg);

            } // end if
        }


    };


    // install the generator
    this.install = function() {
        console.info.apply(console, arguments);
    };



    // perform() : run the active generator
    this.perform = function() {


        if (this.activeKey) {

            if (this.listGenerators[this.activeKey]) {

                // all good, so perform();
                this.listGenerators[this.activeKey].perform();

            } else {

                // uhhhh ... some unknown key?
                util.error(__filename+': ['+this.activeKey+'] is not a registered Generator. ');
            }
        } else {

            // shoot!  a generator didn't get it's on('key',fn()) called!

            // let's check to see if we find a stored generator value:
            for (var o in this.params.options) {
                var key = this.params.options[o].long;
                if (this.params[key]) {
                    this.activeKey = key;
                }
            }

            // None of our Generators were triggered ... ??
            util.error(__filename+': None of our Generators were triggered by command line options. ');
            util.debug('parse info:');
            util.debug(paramDebug);
            util.debug('params:');
            util.debug(this.params);

        }
    }



    // register the generators with the Parameter commander:
    this.registerParams = function( params ) {

        var self = this;
        this.params = params;


        for (var g in this.listGenerators) {

            var obj = this.listGenerators[g];


            if (obj.command) {

                obj.registerParams(params);

                // closure to remember current key
                var onEvent = function(key) {
                    params.on(key, function() {

                        util.verbose(__filename + ': Active Key:'+key);

                        if (self.listGenerators[key]) {
                            self.activeKey = key;
                        }

                    });
                }
                onEvent(obj.key);
            }
        }
    }



}).call(Generators.prototype);


module.exports = new Generators();  // return the instance of this object