steal(
	function() {
		System.import('appdev').then(function() {
			steal.import('appdev/model/model').then(function() {

				// Namespacing conventions:
				// AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
				AD.Model.Base.extend("<%= correctModelName %>", {
					findAll: 'GET /<%= modelURL %>',
					findOne: 'GET /<%= modelURL %>/{id}',
					create: 'POST /<%= modelURL %>',
					update: 'PUT /<%= modelURL %>/{id}',
					destroy: 'DELETE /<%= modelURL %>/{id}',
					describe: function() {
						return <%- description %>;
					},
					<%- clientAssociations %>
					<%- clientMultilingualFields %>
					// validations: {
					//     "role_label" : [ 'notEmpty' ],
					//     "role_description" : [ 'notEmpty' ]
					// },
					fieldId: 'id',
					fieldLabel: '<%= fieldLabel %>'
				}, {
						// model: function() {
						//     return AD.Model.get('<%= correctModelName %>'); //AD.models.<%= appNameSpace %>.<%= ModelName %>;
						// },
						// getID: function() {
						//     return this.attr(this.model().fieldId) || 'unknown id field';
						// },
						// getLabel: function() {
						//     return this.attr(this.model().fieldLabel) || 'unknown label field';
						// }
					});

			});
		});

	});