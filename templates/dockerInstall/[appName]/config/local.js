module.exports = {
    "environment": process.env.NODE_ENV || 'development',
    "connections": {
        "appdev_default": {
            "host": "db",
            "port": 3306,
            "user": "root",
            "password": "root",
            "database": "test_docker"
        },
        "appBuilder": {
            "adapter": null,
            "host": null,
            "user": null,
            "password": null,
            "database": "appbuilder"
        }
    },
    "appbuilder": {
        "baseURL": "http://localhost:1337",
        "deeplink": null,
        "mcc": {
            "enabled": false,
            "url": "http://localhost:1337",
            "accessToken": "There is no spoon.",
            "pollFrequency": 5000,
            "maxPacketSize": 1048576
        },
        "pathFiles": "data/app_builder"
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
    "codepush": {
        "production": {
            "ios": "ios.codepush.production.key",
            "android": "android.codepush.production.key"
        },
        "staging": {
            "ios": "ios.codepush.staging.key",
            "android": "android.codepush.staging.key"
        },
        "develop": {
            "ios": "ios.codepush.develop.key",
            "android": "android.codepush.develop.key"
        }
    },
    "crontab": {}
}