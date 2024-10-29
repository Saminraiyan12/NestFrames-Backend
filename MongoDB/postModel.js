const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
  postedBy:{
    type:mongoose.SchemaTypes.ObjectId,
    ref:'User'
  },
  postCreated: Date,
  likes:Number,
  comments:Array
});

module.exports = mongoose.model('Post',postSchema);;