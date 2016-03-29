steal(
    // List your Controller's dependencies here:
    '<%= clientResourcePath %>',
    function() {
        System.import('appdev').then(function() {
            steal.import('appdev/ad',
                'appdev/control/control').then(function() {


                // Namespacing conventions:
                // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
                AD.Control.extend('<%= correctControllerName %>', {  


////crudWebixTemplateHere


                });



            });

        });

    });