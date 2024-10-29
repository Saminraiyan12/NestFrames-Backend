const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text:String,
  sentBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  receivedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
});
const conversationSchema = new mongoose.Schema({
  user1:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  user2:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  messages:[messageSchema]
});

conversationSchema.index({sender:1,receiver:1});

module.exports = mongoose.model('Conversations',conversationSchema);