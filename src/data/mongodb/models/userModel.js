const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    name: String,
    username: String,
    password: String,
    image: String,
    email: String,
    isAdmin: Boolean
})

module.exports = model("Users", userSchema) 