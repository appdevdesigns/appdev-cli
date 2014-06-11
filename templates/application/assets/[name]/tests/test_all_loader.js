    // Dependencies
    steal(
//        "../<%= pathAdj %>/../../../assets/appdev/appdev.js"
        "../<%= pathAdj %>/../assets/appdev/appdev.js"
    )

    // Initialization
    .then(function(){

        mocha.setup({
            ui: 'bdd',
            timeout: 9000,
            reporter: 'html'
        });
        expect = chai.expect;
        assert = chai.assert;

    })
    .then(
        // [appdev-cli] : leave this next comment! 
        // load our tests here
        "<%= name %>/tests/app.js"
    )
    .then(function() {
        // Execute the tests
        if (window.mochaPhantomJS) {
            mochaPhantomJS.run();
        } else {
            mocha.run();
        }
    })