(function() {

    var ADG = require('./utils.js');   // our common AppDevGenerator object.


    // read in our command line arguments
    var params = require('commander');

    params
        .version('0.0.1')
        .option('g generate [type] [resource options]', 'Generate a set of files for a given resource');


    ADG.registerParams(params);         // make sure utiltiy options registered


    //// Setup all our generators
    var Generators = require('./init.js');

    Generators.init(ADG);               // scan and load all generators

    Generators.registerParams(params);  // have generators register their params/command

    // process the parameters
    params.parse(process.argv);

    // pass operation off to proper generator
    Generators.perform();


}).call(this)