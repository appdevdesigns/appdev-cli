var path = require('path');
var fs = require('fs');
var Generator = require('./class_generator.js');

var ViewUI = new Generator({
    key:'viewUI',
    command:'vui viewUI [path/to/view.ejs] ',
    commandHelp: 'Generate a UI View',
    parameters:['name'],
    newText:'Creating a new client side view ...'
});


module.exports = ViewUI;

var util = null;

ViewUI.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.name = this.options.name || '?notFound?';

    // make sure we have proper path separators for our platform.
    this.templateData.name =
        this.pathProperSeparators( this.templateData.name );

    var targetFile = path.join(process.cwd(), 'assets', this.templateData.name);

    var parts = targetFile.split(path.sep);
    parts.pop();
    var targetDir = parts.join(path.sep);


    // if directory doesn't exist, then display an error
    if (!fs.existsSync(targetDir)) {
        util.log('<red><bold>error:</bold>  target directory doesn\'t exist!</red>');
        util.log('<red>        directory: '+ path.join('assets', targetDir)+'</red>' );
        util.log('<yellow> > check the path and try again.</yellow>');
        util.log();
        process.exit(1);
    }

    // if file already exists, then display an error
    if (fs.existsSync(targetFile)) {
        util.log('<red><bold>error:</bold>  view file already exist!</red>');
        util.log('<yellow> > try again with a unique file reference. </yellow>');
        util.log();
        process.exit(1);
    }


    util.debug('templateData:');
    util.debug(this.templateData);


}



ViewUI.postTemplates = function() {

    var self = this;

    // Read in the contents of our generic view template
    var template = path.resolve(this.templatePath(),'__viewui_view.ejs' );
//    var template = path.join(process.cwd(),'lib', 'templates','__viewui_view.ejs');
    var contents = fs.readFileSync(template);

console.log('current cwd():' + process.cwd());
    var targetFile = path.join(process.cwd(), 'assets', this.templateData.name);
    fs.writeFileSync(targetFile, contents);

    util.log('<green><bold>created:</bold> '+ path.join('assets', this.templateData.name) + '</green>');



}


