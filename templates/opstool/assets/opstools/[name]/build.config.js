module.exports={
    // map: {
    //     "*": {
    //       "jquery/jquery.js" : "jquery",
    //       "can/util/util.js": "can/util/jquery/jquery.js"
    //     }
    // },
    paths: {
        
        // If you want to simplify the references to local resources you
        // can define paths for them like:

        // "dropzone.js" : "js/dropzone.min.js",
        // "dropzone.css" : "styles/dropzone.css"
    },
    shim : {

        // If you want to prevent external resources from being
        // packaged with this, then you can tell mark them like:

        // 'dropzone.js' : { packaged:false },
        // 'dropzone.css' : {packaged:false },

        // Also specify the labels for this Tool to not be included:
        'site/labels/opstools-<%= name %>.js' : { packaged:false, ignore:true }


    }
    // ext: {
    //     js: "js",
    //     css: "css",
    //     less: "steal/less/less.js",
    //     coffee: "steal/coffee/coffee.js",
    // }
};
    


