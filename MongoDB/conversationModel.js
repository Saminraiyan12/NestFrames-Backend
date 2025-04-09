const mongoose = require('mongoose');
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
  lastMessage:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Messages",
    default:null
  },
  lastUpdate:{
    type:Date,
    default:Date.now
  },
});

conversationSchema.index({user1:1,user2:1});

module.exports = mongoose.model('Conversations',conversationSchema);