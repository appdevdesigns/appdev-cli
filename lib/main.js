(function() {

    var ADG = require('./utils.js');   // our common AppDevGenerator object.


    // read in our command line arguments
    var params = require('commander');

    params
        .version('0.0.1');

    ADG.registerParams(params);         // make sure utiltiy options registered


    //// Setup all our generators
    var Generators = require('./init.js');

    Generators.init(ADG);               // scan and load all generators

    Generators.registerParams(params);  // have generators register their params/command


    //// the helpGenerator is a special generator that needs a list of all the 
    //// other generators passed into it's perform() routine.
    //// so we setup that one here.
    var helpGenerator = Generators.generators()['help'];
    helpGenerator.params = params;

    params
        .command('help')
        .description('see further instructions on a command')
        .action(function(){
            helpGenerator.perform(Generators);
        });


    // process the parameters
    params.parse(process.argv);

    // pass operation off to proper generator
//    Generators.perform();


}).call(this)