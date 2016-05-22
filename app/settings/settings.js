module.exports = {

    // DB Adaptor settings
    adaptor:"mysql",            // which DB adaptor to use? 
    connectionType: "port",     // connect by port
    socketPath : "na",          // needs to be present, but not used.
    host: "192.168.99.100",          // url of host
    port: "3306",               
    user: "root",
    password: "root", 
    database: "develop",

    wantTest:"n",        // want test adaptor?

    // SSL Settings:
    enableSSL:false,    // no ssl


    // Authentication
    // authType:"local",
    authType:"Local",
    baseURL:"",
    pgtURL:"",
    guidKey:"",

    // 
    copyConfigs:false,
    configDir:"settings/config"
}