
steal(
        // List your Controller's dependencies here:
        'appdev',
        'OpsPortal/classes/OpsTool.js',
        'opstools/<%= name %>/views/<%= name %>/<%= name %>.ejs',
function(){

    // Namespacing conventions:
    // AD.Control.OpsTool.extend('[ToolName]', [{ static },] {instance} );
    AD.Control.OpsTool.extend('<%= name %>', {

        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                    templateDOM: '/opstools/<%= name %>/views/<%= name %>/<%= name %>.ejs',
                    resize_notification: '<%= name %>.resize',
                    tool:null   // the parent opsPortal Tool() object
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);

            this.initDOM();
        },



        initDOM: function () {

            this.element.html(can.view(this.options.templateDOM, {} ));

        },



        '.ad-item-add click': function ($el, ev) {

            ev.preventDefault();
        }


    });


});