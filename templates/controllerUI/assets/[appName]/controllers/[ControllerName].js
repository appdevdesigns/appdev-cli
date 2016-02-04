
steal(
        // List your Controller's dependencies here:
        'appdev',
//        '<%= appName %>/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        '<%= appName %>/views/<%= ControllerName %>/<%= ControllerName %>.ejs',
function(){

    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('<%= correctControllerName %>', {  


        init: function (element, options) {
            var self = this;
            options = AD.defaults({
                    templateDOM: '//<%= appName %>/views/<%= ControllerName %>/<%= ControllerName %>.ejs'
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);


            this.dataSource = this.options.dataSource; // AD.models.Projects;

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