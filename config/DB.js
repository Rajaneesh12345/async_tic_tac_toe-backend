require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const dbUrl = process.env.MONGO_URL || "mongodb://localhost:27017/userDB";

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to db.");
    }
});

const db = mongoose.connection;
module.exports = db;