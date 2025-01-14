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
    ref:"User"
  },
  likes:{
    type:Number,
    default:0
  },
  caption:String,
  privacy:Boolean
})

module.exports = mongoose.model("Posts", postSchema);