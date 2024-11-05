const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    name: String,
    username: String,
    password: String,
    image: String,
    email: String,
    isAdmin: Boolean,
    createdAt: {type: Date, default: Date.now()}
})

module.exports = model("Users", userSchema) 