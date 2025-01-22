const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text:String,
  sentBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users'
  },
  receivedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users'
  },
  read:{
    type:Boolean,
    default:false
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
});
const conversationSchema = new mongoose.Schema({
  user1:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true
  },
  user2:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true
  },
  messages:[messageSchema],
  lastUpdate:{
    type:Date,
    default:Date.now
  },
  read:{
    type:Boolean,
    default:true
  }
});

conversationSchema.index({sender:1,receiver:1});

module.exports = mongoose.model('Conversations',conversationSchema);