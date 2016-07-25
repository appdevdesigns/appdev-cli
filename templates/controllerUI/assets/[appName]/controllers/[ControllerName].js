
steal(
	// List your Controller's dependencies here:
	//'<%= appName %>/models/Projects.js',
	'<%= appName %>/views/<%= ControllerName %>/<%= ControllerName %>.ejs',
	function() {
        System.import('appdev').then(function() {
			steal.import('appdev/ad',
				'appdev/control/control').then(function() {		

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('<%= correctControllerName %>', {


						init: function(element, options) {
							var self = this;
							options = AD.defaults({
								templateDOM: '/<%= appName %>/views/<%= ControllerName %>/<%= ControllerName %>.ejs'
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);


							this.initDOM();
						},



						initDOM: function() {
							var _this = this;

							// Async view loading.
							can.view(this.options.templateDOM, {}, function(frag){
								_this.element.html(frag);

								//// Now the DOM for this controller is in place. 


								/* place the rest of your init code here. */
							});

						},



						'.ad-item-add click': function($el, ev) {

							ev.preventDefault();
						}


					});

				});
		});

	});