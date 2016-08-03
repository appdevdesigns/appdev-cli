module.exports = {
    "environment": process.env.NODE_ENV || 'development',
    "connections": {
        "appdev_default": {
            "host": "128.199.104.41",
            "port": 3306,
            "user": "root",
            "password": "root",
            "database": "develop"
        },
        "fcf": {
            "adapter": "sails-mysql",
            "host": "128.199.104.41",
            "port": 3306,
            "user": "root",
            "password": "root",
            "database": "develop"
        }
    },
    "nodemailer": {
        "default": "smtp",
        "smtp": {
            "type": "SMTP",
            "host": "SMTP.HOST.ADDR",
            "secureConnection": false,
            "port": 25
        }
    },
    "sockets": {},
    "crontab": {}
}