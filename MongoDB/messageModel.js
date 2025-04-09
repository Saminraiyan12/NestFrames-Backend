const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  text:String,
  sentBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true

  },
  receivedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true

  },
  read:{
    type:Boolean,
    default:false,
  },
  conversation:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Conversations",
    required:true
  },
  createdAt:{
    type:Date,
    default:Date.now,
    required:true
  }
});

module.exports = mongoose.model('Messages',messageSchema);