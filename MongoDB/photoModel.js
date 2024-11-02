const mongoose = require('mongoose');


const photoSchema = new mongoose.Schema({
    filename:String,
    fileUrl:String,
    userId:String,
    timestamp:Date,
});

module.exports = mongoose.model('Photos',photoSchema);;