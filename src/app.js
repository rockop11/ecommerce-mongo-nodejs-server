// Dependencies
const express = require('express')
const app = express()
const cors = require('cors')

const { envs } = require("./config/plugins")

//Routes
const mainRoutes = require("./routes/mainRoutes")
const authRoutes = require("./routes/auth/authRoutes")
const productsRoutes = require("./routes/products/productsRoutes")

//Database
const mongoConnection = require("./data/mongodb")
require("./data/firebase/firebaseConfig")

const PORT = envs.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(cors())

app.use('/', mainRoutes)
app.use('/auth', authRoutes)
app.use('/products', productsRoutes)

const connectMongo = async () => {
    await mongoConnection(envs.MONGO_URL, envs.MONGO_DB_NAME)
}

connectMongo()

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})