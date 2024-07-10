const mongoose = require("mongoose")
const dotenv = require("dotenv").config()

const MONGO_URL = process.env.MONGO_URL || ""

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URL)
    console.log("db connected successfully", conn.connection.id)
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  connectDB,
}
