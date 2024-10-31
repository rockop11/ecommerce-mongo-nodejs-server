const { connect } = require('mongoose');

const mongoConnection = async (url, dbName) => {
    try {
        await connect(url, { dbName })

        console.log(`Mongo db connected to:${url} - ${dbName}`)
    } catch (error) {
        console.log("mongo connection error")
        throw error
    }
}

module.exports = mongoConnection