const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tableSchema = new Schema({
    roomId: {
        type: String,
        required: true,
        unique : true
    },
    player1 : {
        type : String,
        required : true
    },
    player2 : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    board : {
        type : Array,
        required : true
    },
    turn : {
        type : String,
        required : true
    },
    winner : {
        type : String,
    },
    draw : {
        type : Boolean,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
});

module.exports = mongoose.model('table', tableSchema);