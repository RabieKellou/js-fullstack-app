const dotenv = require('dotenv')
dotenv.config()
const mongodb = require('mongodb')

//connect to the database
mongodb.connect(process.env.CONNECTIONSTRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err, client) {
    //start the application from here
    //export the mongodb database
    module.exports = client
    const app = require('./app')
    app.listen(process.env.PORT)
})