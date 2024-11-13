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
    updatedAt: { type: Date, default: Date.now() },
    date: { type: Date, default: Date.now() },
})

module.exports = model("Products", productSchema)