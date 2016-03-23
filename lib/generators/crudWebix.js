
var Generator = require('./class_generator.js');
var path = require('path');
var fs = require('fs');

var AD = require('ad-utils');
var async = require('async');

var ControllerUI = require('./controllerUI.js');



var Resource = new Generator({
    key:'crudWebix',
    command:'crudWebix [name]',
    commandHelp: 'Generate a crud interface for a resource using webix',
    parameters:['tool', 'resource', '[options]'],
    newText:'Creating a new webix crud widget ...'
});



module.exports = Resource;



var KEY_CLIENT_RESOURCE_PATH = '///clientResourcePath///';


Resource.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev crudWebix <yellow><bold>[tool]</bold> <bold>[resource]</bold></yellow> <green>[type:[type]] [application:[application]]</green>',
        description:[ 
            'This command creates a quick scaffolding around a resource for the given tool.',
            '',
            '    One plugin can have several client side resources installed.'

        ].join('\n'),
        parameters:[
            '<yellow>[tool]       </yellow>  :   the name of the opstool to insert the widget into.',
            '<yellow>[resource]</yellow>     :   the name of the resource to use.',
            '<green>[type]</green>         :   [optional] the type of crud widget to generate',
            '<green>[application]</green>  :   [optional] the clientside application for this resource',
            '                              default: '+path.join('opstools', '[tool]'),
        ],

        examples:[
            '> appdev crudWebix MyTool MyResource',
            '    // uses tool: '+path.join('assets','opstools', 'MyTool') ,
            '    // <green>creates:</green> '+path.join('assets', 'opstools', 'MyTool', 'controllers', 'crud1MyResource'),
            '    // <yellow>updates:</yellow> '+path.join('assets', 'opstools', 'MyTool', 'views', 'MyTool', 'MyTool.ejs'),
            '    // <yellow>updates:</yellow> '+path.join('assets', 'opstools', 'MyTool', 'controllers', 'MyTool.js'),
            '',
        ]
    });

}



Resource.error = function(list, exitNum) {

    list.forEach(function(out) {
        AD.log(out);
    });

    process.exit(exitNum);

}


Resource.prepareControllerTemplateData = ControllerUI.prepareTemplateData;  // do all the related controllerUI data preparations

Resource.attributeToColumn = function(key, attribute) {
    var col = null;

    // don't return a function:
    if (typeof attribute != 'function') {

        // don't return embedded objects:
        if (!attribute.collection) {

            col = {
                id: key,
                header: key
            }

            switch(attribute.type) {
                case 'text':
                case 'string':
                    col.editor = 'text';
                    break;

// TODO: fill out these editor types:
                case 'something':
                    col.editor = 'checkbox';
                    col.editor = 'select';
                    col.editor = 'date';
                    break;
            }
        }
    }

    return col;
}

Resource.attributesToColumn = function(attributes, columns, ignoreKeys) {
    columns = columns || [];
    ignoreKeys = ignoreKeys || [];
    
    // Ignore Multilingual Translation keys:
    if (ignoreKeys.indexOf('language_code') == -1) {
        ignoreKeys.push('language_code');
    }

    var lastTextIndex = -1;

    for (var k in attributes) {

        // if this isn't a key to ignore:
        if (ignoreKeys.indexOf(k) == -1) {

            var attr = attributes[k];
            var col = this.attributeToColumn(k, attr);
            if (col) {
                columns.push( col );

                if (col.editor == 'text') {
                    lastTextIndex = columns.length -1;
                }
            }
            
        }
    }

    // insert fillspace:true  attribute
    if (lastTextIndex == -1) {
        // then just fillspace the last column:
        lastTextIndex = columns.length -1;
    }
    columns[lastTextIndex].fillspace = true;


    return columns;
}



/**
 * @function attributeToElement
 * 
 * convert the given attribute info into the webix.form.element 
 * definition.
 */
Resource.attributeToElement = function(key, attribute) {
    var el = null;

    // don't return a function:
    if (typeof attribute != 'function') {

        // don't return embedded objects:
        if (!attribute.collection) {

            el = {
                view:   "text",
                label:  key,
                name:   key,
                // type:   "text"
            }

            switch(attribute.type) {
                case 'text':
                case 'string':
                    el.view = 'text';
                    el.type = 'text';
                    break;

                case 'date':
                    el.view = 'datepicker';
                    el.timepicker = false;
                    break;

                case 'datetime':
                    el.view = 'datepicker';
                    el.timepicker = true;
                    break;

                case 'boolean':
                    el.view = 'checkbox';
                    el.value = 0;
                    break;

                default:
                    el.view = 'text';
                    break;

// TODO: fill out these form types:
                // case 'something':
                //     col.editor = 'select';
                //     break;
            }
        }
    }

    return el;
}


/**
 * @function attributesToElement
 * 
 * convert all the attributes to webix.form.element definitions.
 *
 */
Resource.attributesToElement = function(attributes, elements, ignoreKeys) {
    elements = elements || [];
    ignoreKeys = ignoreKeys || [];
    
    // Ignore Multilingual Translation keys:
    if (ignoreKeys.indexOf('language_code') == -1) {
        ignoreKeys.push('language_code');
    }

    for (var k in attributes) {

        // if this isn't a key to ignore:
        if (ignoreKeys.indexOf(k) == -1) {

            var attr = attributes[k];
            var el = this.attributeToElement(k, attr);
            if (el) {
                elements.push( el );
            }
            
        }
    }

    return elements;
}



/**
 * @function attributeToRule
 * 
 * convert the given attribute info into the webix.form.rule 
 * definition.
 */
Resource.attributeToRule = function(key, attribute) {
    var rule = null;
    
// console.log();
// console.log('... attributeToRule:key:', key);
// console.log('... attributeToRule:attribute:', attribute);
    // don't return a function:
    if (typeof attribute != 'function') {

        // don't return embedded objects:
        if (!attribute.collection) {

            rule = {
                key:   key
            }

            // if this is an email field:
            if (attribute.type == 'email') {
                rule.rule = 'isEmail';
            }

            // scan for any other validation settings:
            for (var a in attribute) {

                switch(a) {

                    case 'notEmpty':
                    case 'required':
                        rule.rule = 'isNotEmpty';
                        break;

                    case 'numeric':
                    case 'finite':
                    case 'int':
                    case 'integer':
                    case 'float':
                        rule.rule = 'isNumber';
                        break;
                }
            }
// console.log('... attributeToRule:rule:', rule);
            // don't keep rule if there was no validation found
            if (typeof rule.rule == 'undefined') {
                rule = null;
            }

        }
    }

    return rule;
}


/**
 * @function attributesToRules
 * 
 * convert all the attributes to webix.form.rule definitions.
 *
 */
Resource.attributesToRules = function(attributes, rules, ignoreKeys) {
    rules = rules || [];
    ignoreKeys = ignoreKeys || [];
    
    // Ignore Multilingual Translation keys:
    if (ignoreKeys.indexOf('language_code') == -1) {
        ignoreKeys.push('language_code');
    }

    for (var k in attributes) {

        // if this isn't a key to ignore:
        if (ignoreKeys.indexOf(k) == -1) {

            var attr = attributes[k];
            var rule = this.attributeToRule(k, attr);
            if (rule) {
                rules.push( rule );
            }
            
        }
    }

    return rules;
}


Resource.prepareTemplateData = function () {

    this.templateData = {};

    // 'tool' : is the opstool we are working with
    this.templateData.tool = this.options.tool || '??';
    if (this.templateData.tool == '??') {
        this.error([
            '',
            '> appdev crudWebix <red>[tool]</red>',
            '',
            '  <red><bold>[tool]</bold></red> is required.',
            ''
        ], 1);
    }
    

    // resource : is the db resource we are working with
    this.templateData.resource = this.options.resource || '??';
    if (this.templateData.resource == '??') {
        this.error([
            '',
            '> appdev crudWebix '+this.templateData.tool+' <red>[resource]</red>',
            '',
            '  <red><bold>[resource]</bold></red> is required.',
            ''
        ], 1);
    }

    // resolve the given resource info into a Sails model
    //
    // option 1: 'Model' : the name of a /api/models/Model.js stored locally
    // option 2: 'tool/Model' : the name of a sails/node_modules/[tool]/api/models/[Model].js file
    // option 3: 'sails/Model': the name of sails/api/models/[Model].js file
    var resourcePath = '';
    var parts = this.templateData.resource.split(path.sep);
    switch(parts.length) {
        case 1:
            resourcePath = path.join('api', 'models', parts[0]);
            break;

        case 2:
            if (parts[0] == 'sails') {
                // option 3
                resourcePath = path.join('..', '..', 'api', 'models', parts[1]);
                
            } else {
                // option 2
                resourcePath = path.join('..', parts[0], 'api', 'models', parts[1]);
            }
            break;
    }



    if (resourcePath == '') {
        this.error([
            '',
            '> appdev crudWebix '+this.templateData.tool+' <red>[resource]</red>',
            '',
            '  <red><bold>[resource]</bold></red> is not in an understood format:',
            '     \'resource\' : locally stored /api/models/[resource].js file',
            '     \'[tool]/[resource]\': [sails]/node_modules/[tool]/api/models/[resource].js file',
            '     \'sails/[resource]\' : [sails]/api/models/[resource].js ',
            ''
        ], 1);
    }
    resourcePath += '.js';
    if (!fs.existsSync(resourcePath)) {
        this.error([
            '',
            '> appdev crudWebix '+this.templateData.tool+' <red>'+this.templateData.resource+'</red>',
            '',
            '  <red><bold>'+this.templateData.resource+'</bold></red> I could not find the specified resource ',
            '     resource path: <yellow>'+resourcePath+'</yellow>',
            ''
        ], 1);
    }

    this.templateData.resourceData = require(path.join(process.cwd(), resourcePath));


    //// Client Side Resource Path:
    //// this is the steal definition for the client side model.
    //// NOTE: when the initial copy templates step is performed, this value isn't known,
    ////       so we just copy a template holder here: 
    ////       later once we computer the path, we patch the file with the actual data.
    ////       (see step: getModelUIKey)
    this.templateData.clientResourcePath = KEY_CLIENT_RESOURCE_PATH; //'///clientResourcePath///';
    var ignoreViaField = '';

    // if this model has a translation 
    if (this.templateData.resourceData.attributes.translations){

        ignoreViaField = this.templateData.resourceData.attributes.translations.via;

        // load the translation model as well:
        var transParts = resourcePath.split(path.sep);
        transParts.pop();
        transParts.push(this.templateData.resourceData.attributes.translations.collection + '.js')
        var transPath = transParts.join(path.sep);
        this.templateData.resourceTransData = require(path.join(process.cwd(), transPath));
    }
// console.log(this.templateData.resourceData);
// console.log(this.templateData.resourceTransData);


    ////
    //// Compile Datatable Columns
    ////
    this.templateData.columnData = [];
    // start with translation data for the labels
    if (this.templateData.resourceTransData) {
        this.attributesToColumn(this.templateData.resourceTransData.attributes, this.templateData.columnData, [ ignoreViaField ]);
    }
    // now add in the core values:
    this.attributesToColumn(this.templateData.resourceData.attributes, this.templateData.columnData);



    ////
    //// Compile Form Elements:
    ////
    this.templateData.elementData = [];
    if (this.templateData.resourceTransData) {
        this.attributesToElement(this.templateData.resourceTransData.attributes, this.templateData.elementData, [ ignoreViaField ]);
    }
    // now add in the core values:
    this.attributesToElement(this.templateData.resourceData.attributes, this.templateData.elementData);



    ////
    //// Compile Form Rules
    ////
    this.templateData.ruleData = [];
    if (this.templateData.resourceTransData) {
        this.attributesToRules(this.templateData.resourceTransData.attributes, this.templateData.ruleData, [ ignoreViaField ]);
    }
    // now add in the core values:
    this.attributesToRules(this.templateData.resourceData.attributes, this.templateData.ruleData);



    this.options.type = this.options.type || 'crud1';


    var allowedOptions = [ 'type' ];

    if (this.options.options) {

        this.options.options.forEach(function(option){


            var parts = option.split(':');
            var key = parts[0].toLowerCase();


            // this has to be one of our expected parameters:
            if (_.indexOf(allowedKeys, key) != -1) {

                // check the dir parameter:
                switch(key) {

                    case 'type':
                        if (parts[1]) {
                            this.options.type = parts[1];
                        }
                        break;
                }
        
            }

        })
    }



    // find the opstool:  
    //    Tool :  NewTool,  opstools/NewTool, some/other/NewTool
    //
    //    opstool: NewTool,  NewTool,  NewTool
    //    toolPath: 'opstools',  'opstools',  'some/other'

    var parts = this.templateData.tool.split(path.sep);

    this.options.opstool = parts.pop();
    this.options.toolPath = parts.join(path.sep);
    if (this.options.toolPath == '') {
        this.options.toolPath = 'opstools';  // defaults to an opstools
    }



    // this.options.application : the name of the application we are adding this to
    // this.options.name : the name of the controller

    this.options.application = path.join(this.options.toolPath, this.options.opstool);
    this.options.name = this.options.type+this.templateData.resource.split(path.sep).pop();  // get the last resource entry

    var oldTemplateData = this.templateData;

    this.prepareControllerTemplateData();  // from ControllerUI -> gives us: appName, ControllerName, correctControllerName

    for (var k in oldTemplateData) {
        if (!this.templateData[k]) {
            this.templateData[k] = oldTemplateData[k];
        }
    }
// console.log('... templateData:', this.templateData);

    if (this.templateData.tool) AD.log('... tool: <yellow>'+this.templateData.tool+'</yellow>');
    if (this.templateData.resource) AD.log('... resource: <yellow>'+this.templateData.resource+'</yellow>');
    if (this.options.type) AD.log('... crud type: <yellow>'+this.options.type+'</yellow>');


    this.templateData.resourceNameSpace = "??"; // "??.??."+this.templateData.resource;

    AD.log();
    AD.log('... opstool: <yellow>'+this.options.opstool+'</yellow>');
    AD.log('... toolPath: <yellow>'+this.options.toolPath+'</yellow>');
    AD.log('... appName: <yellow>'+this.templateData.appName+'</yellow>');
    AD.log('... ControllerName: <yellow>'+this.templateData.ControllerName+'</yellow>');
    AD.log('... correctControllerName: <yellow>'+this.templateData.correctControllerName+'</yellow>');

};


Resource.postTemplates = function() {
    var _this = this;

        // define the series of methods to call for the setup process
        var processSteps = [
                        'getModelUIKey',     // ask for the model UI key for the resource
                        'copyWebixTemplate',         // copy the contents of the correct template into our new controller
                        'patchController',   // update the tool controller to now use our 
                        'patchDOM'           // update the DOM to display/load our controller
        ];


        this.methodStack(processSteps, function() {

            // when they are all done:

            AD.log();
            AD.log('<yellow>> webix crud widget created.</yellow>');
            AD.log();
            process.exit(0);
        });


};


Resource.getModelUIKey = function(done) {
    // request the model UI key if it wasn't already provided
    var _this = this;


    if (this.templateData.resourceNameSpace != '??') {
        done();
    } else {

        var guess = [this.options.toolPath, this.options.opstool, this.templateData.resource.split(path.sep).pop()].join('.');
        var qset =  {
            question: 'what is the model UI reference for this resource ['+guess+']:',
            data: 'key',
            def : guess
        };
        this.questions(qset, function(err, data) {
// console.log('... data.key:', data.key );
            if (err) {
                done(err);
            } else {

                _this.templateData.resourceNameSpace = data.key;
                var parts = data.key.split('.');
                var resource = parts.pop();
                parts.push('models')
                parts.push(resource);
                _this.templateData.clientResourcePath = parts.join('/') +'.js';

                var sailsPathToResource = path.join(process.cwd(), '..', '..', 'assets', _this.templateData.clientResourcePath);
console.log('... sailsPathToResource:', sailsPathToResource);

                if (!fs.existsSync(sailsPathToResource)) {

                    AD.log('<red>oops:</red> I can\'t find the resouce from the key.');
                    AD.log('      <yellow>look for yourself at:</yellow> '+ sailsPathToResource);
                    AD.log('      Please try again:');
                    _this.templateData.resourceNameSpace = '??';
                    _this.getModelUIKey(done);

                } else {

                    // patch the controller to include the proper Model:
                    
                    var patchSet = [
                        {
                            file: _this.controllerName(),
                            tag: KEY_CLIENT_RESOURCE_PATH,
                            replace:_this.templateData.clientResourcePath
                        }
                    ];
                    _this.patchFile(patchSet, function() {
                        done();
                    });
                }
//// LEFT OFF:
// verify resourcePath
// if not found( recursively call _this.getModelUIKey(done) )
// + perform .resize() operations on webix grid/form. -> why can't I get width correct?

            }
        });

    }

}


Resource.controllerName = function(){
    return path.join('assets', this.templateData.appName,'controllers', this.templateData.ControllerName+'.js');
}



Resource.copyWebixTemplate = function(done) {
    // our normal parseTemplates step should copy over our controller shell.
    // we want to insert our template into this shell.


    var patchSet = [
        {
            file: this.controllerName(),
            tag: /\/\/\/\/crudWebixTemplateHere/,
            template:'__crudWebix_'+this.options.type+'.ejs', 
            data:this.templateData

        }

    ];
    this.patchFile(patchSet, function() {
        done();
    });


}





Resource.patchController = function(done) {
    // Now make sure the default application/tool controller will instantiate 
    // our new controller
    var _this = this;


    var controllerFilePath = path.join('assets', this.templateData.appName,'controllers', this.options.opstool+'.js');

    async.series([

        // make sure our webix crud methods exist in the main controller:
        function(next) {

            fs.readFile(controllerFilePath, {encoding:'utf8'}, function(err, data) {
                if (data.indexOf('initWebixCrud') == -1) {

                    // add our controller setup methods then:
                    var patchSet = [
                        // add the init() call
                        {
                            file: controllerFilePath,
                            tag: /this\.initDOM\(\);/,
                            replace:[
                                'this.initDOM();',
                                '            this.initWebixCrud();'
                            ].join('\n')

                        },
                        {
                            file: controllerFilePath,
                            tag: /initDOM.*\{/,
                            replace:[
                                'initWebixCrud: function() {',
                                '            var _this = this;',
                                '',
                                '            var webixCrudControllers = {',
                                '            }',
                                '',
                                '            this._crudPortals = {};',
                                '',
                                '            var initPortal = function(ref, el, options) {',
                                '                var portalKey = ref.split(\'.\').pop();',
                                '                var Controller = AD.Control.get(ref);',
                                '                _this._crudPortals[portalKey] = new Controller( el, options );',
                                '            }',
                                '',
                                '            for(var cKey in webixCrudControllers) {',
                                '                initPortal(cKey, webixCrudControllers[cKey].el, webixCrudControllers[cKey].opt);',
                                '            }',
                                '',
                                '            // insert ourself into the resize() chain:',
                                '            this._crudOldResize = this.resize;',
                                '            this.resize = function(data){',
                                '                _this._crudOldResize(data);',
                                '',
                                '                for (var p in _this._crudPortals) {',
                                '                    _this._crudPortals[p].resize(data);',
                                '                }',
                                '            }',
                                '        }, ',
                                '',
                                '        initDOM: function () {'
                            ].join('\n')

                        }

                    ];
                    _this.patchFile(patchSet, function() {
                        next();
                    });
                } else {
                    next();
                }
            })
            
        },

        // now add our new controller to the list of those being created
        function(next) {

            var includePath = _this.controllerName().replace('assets'+path.sep, '');
            var patchSet = [
                // add the steal inclusion line
                {
                    file: controllerFilePath,
                    tag: /function\(\)\{/,
                    replace:[
                        "        '/"+includePath+"',",
                        'function(){'
                    ].join('\n')

                },
                {
                    file: controllerFilePath,
                    tag: /var webixCrudControllers = \{/,
                    replace:[
                        'var webixCrudControllers = {',
                        '                "'+_this.templateData.correctControllerName+'" : { el:".'+_this.templateData.ControllerName+'", opt:{} },'
                    ].join('\n')

                }

            ];
            _this.patchFile(patchSet, function() {
                next();
            });
        }

    ], function(err, results){
        done();
    })

}





Resource.patchDOM = function(done) {
    // Now update the default View to add another tab and tab content area for this widget
    var _this = this;


    var ejsFilePath = path.join('assets', this.templateData.appName, 'views', this.options.opstool, this.options.opstool+'.ejs');

    async.series([

        // make sure our webix crud tab structure exists in file:
        function(next) {

            fs.readFile(ejsFilePath, {encoding:'utf8'}, function(err, data) {

                if (err) { next(err); } else {

console.log('... data:', data);

                    if (data.indexOf('webix-crud-tabs') == -1) {

                        var result = [
                            '<ul class="nav nav-tabs webix-crud-tabs" role="tablist">',
                            '  <li role="presentation" class="active"><a href="#home" aria-controls="home" role="tab" data-toggle="tab">NewCrud</a></li>',
                            '</ul>',
                            '<div class="tab-content">',
                            '    <div role="tabpanel" class="tab-pane active" id="home" >'+data+'</div>',
                            '</div>'
                        ].join('\n');

                        fs.writeFile(ejsFilePath, result, {encoding:'utf8'}, function(err){

                            next(err);
                        })

                    } else {
                        next();
                    }
                }
            })
            
        },

        // now add our new controller tab and content area to the file:
        function(next) {

            var includePath = _this.controllerName().replace('assets'+path.sep, '');
            var patchSet = [
                // add the steal inclusion line
                {
                    file: ejsFilePath,
                    tag: /<\/ul>/,
                    replace:[
                        '  <li role="presentation" class="'+_this.templateData.ControllerName+'"><a href="#'+_this.templateData.ControllerName+'" aria-controls="home" role="tab" data-toggle="tab">'+_this.templateData.ControllerName+'</a></li>',
                        '<\/ul>'
                    ].join('\n')

                },
                {
                    file: ejsFilePath,
                    tag: /<div\s*class=".*tab-content.*>/,
                    replace:[
                        '<div class="tab-content">',
                        '    <div role="tabpanel" class="tab-pane" id="'+_this.templateData.ControllerName+'" >Content for '+_this.templateData.ControllerName+'</div>'
                    ].join('\n')

                }

            ];
            _this.patchFile(patchSet, function() {
                next();
            });

        }

    ], function(err, results){
if (err) { console.log(' ... error:', err); }
        done(err);
    })

}




