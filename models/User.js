const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')

//Object blueprint
let User = function (data, getAvatar) {
    this.data = data
    this.errors = []
    if (getAvatar == undefined) {
        getAvatar = false
    }
    if (getAvatar) {
        this.getUserAvatar()
    }
}

User.prototype.cleanUp = function () {
    if (typeof (this.data.username) != "string") {
        this.data.username = ""
    }
    if (typeof (this.data.email) != "string") {
        this.data.email = ""
    }
    if (typeof (this.data.password) != "string") {
        this.data.password = ""
    }

    //get rid of any bogus properties and  format input data
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password,
    }
}
//validate new user data
User.prototype.validate = function () {
    return new Promise(async (resolve, reject) => {

        if (this.data.username == "") {
            this.errors.push("You must provide a username")
        }
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push("username can only contain letters and numbers")
        }
        if (!validator.isEmail(this.data.email)) {
            this.errors.push("You must provide a valid email address")
        }
        if (this.data.password == "") {
            this.errors.push("You must provide a password")
        }
        if (this.data.password.length > 0 && this.data.password.length < 12) {
            this.errors.push("password must at least 12 characters")
        }
        if (this.data.password.length > 50) {
            this.errors.push("password cannot exceed 50 characters")
        }
        if (this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push("username must at least 3 characters")
        }
        if (this.data.username.length > 30) {
            this.errors.push("username cannot exceed 30 characters")
        }

        //Only if the username is valid then check if it's already taken

        if (this.data.username.length > 2 && this.data.username.length < 21 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({
                username: this.data.username
            })
            if (usernameExists) {
                this.errors.push("That username already taken.")
            }
        }
        //Only if the email is valid then check if it's already taken

        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({
                email: this.data.email
            })
            if (emailExists) {
                this.errors.push("That email already taken.")
            }
        }

        resolve()
    })
}
//login a user
User.prototype.login = function (callback) {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({
            username: this.data.username
        }).then((attemptedUser) => {
            if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                this.data = attemptedUser
                this.getUserAvatar()
                resolve("congrats")
            } else {
                reject("invalid username/password")

            }
        }).catch((err) => {
            reject("Please try again later")
        })
    })

    //callback approach
    // this.cleanUp()
    // usersCollection.findOne({
    //     username: this.data.username
    // }, (err, attemptedUser) => {
    //     if (attemptedUser && attemptedUser.password == this.data.password) {
    //         callback("congrats")
    //     } else {
    //         callback("invalid username/password")

    //     }
    // })
}

//register a user
User.prototype.register = function () {
    return new Promise(
        async (resolve, reject) => {
            // Step #1 : validate user data
            this.cleanUp()

            await this.validate()

            // Step #2 : only if there are no validation errors 
            // then save the user into a database
            if (!this.errors.length) {
                //hash user password 
                let salt = bcrypt.genSaltSync(10)
                this.data.password = bcrypt.hashSync(this.data.password, salt)
                //save the user in the db
                await usersCollection.insertOne(this.data)
                this.getUserAvatar()
                resolve()
            } else {
                reject(this.errors)
            }

        }
    )
}

User.prototype.getUserAvatar = function () {
    this.avatar = `https://www.gravatar.com/avatar/${md5(this.data.email)}?s=128`
}


User.findByUsername = function (username) {
    return new Promise(function (resolve, reject) {
        if (typeof (username) != "string") {
            reject()
            return
        }
        usersCollection.findOne({
            username: username
        }).then(function (userDoc) {
            if (userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }

                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function () {
            reject()
        })
    })
}

User.doesEmailExist = function (email) {
    return new Promise(async (resolve, reject) => {
        if (typeof (email) != "string") {
            resolve(false)
            return
        }

        let user = await usersCollection.findOne({
            email: email
        })

        if (user) {
            resolve(true)
        } else {
            resolve(false)
        }
    })
}


module.exports = User