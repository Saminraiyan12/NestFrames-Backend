const mongoose = require('mongoose');

const notificaitonSchema = new mongoose.Schema({
  message:{
    required:true,
    type:String
  },
  sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Users"
  },
  receiver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Users"
  },
  read:{
    type:Boolean,
    default:false
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  image:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Photos"
  },
  type:{
    type:String,
    required:true,
    enum:["postLike","postComment","albumLike","friendRequest",""]
  }
})

module.exports = mongoose.model('Notifications', notificaitonSchema);