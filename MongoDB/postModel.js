const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  photo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Photos"
  },
  album:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Albums"
  },
  postedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Users"
  },
  likes:{
    type:Number,
    default:0
  },
  timestamp:Date,
  caption:String,
  privacy:Boolean
})

module.exports = mongoose.model("Posts", postSchema);