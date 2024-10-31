const { Schema, model } = require('mongoose')

const productSchema = new Schema({
    title: String,
    price: Number,
    discount: Number,
    stock: Number,
    category: String,
    createdBy: String,
    description: String,
    images: [String],
    date: { type: Date, default: Date.now() },
})

module.exports = model("Products", productSchema)