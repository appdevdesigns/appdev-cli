module.exports = {

    // DB Adaptor settings
    adaptor:"mysql",            // which DB adaptor to use? 
    connectionType: "port",     // connect by port
    socketPath : "na",          // needs to be present, but not used.
    host: "128.199.104.41",          // url of host
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

    installLanguages:"en",

    // 
    copyConfigs:true,
    configDir:"settings/config"
}