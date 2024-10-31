const mongoose = require('mongoose');
const dotenv = require('dotenv')

const connectDB = async() =>{
  try{
    await mongoose.connect(process.env.MONGO_URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,   
    });
    console.log('connected to Mongo');
  }
  catch(error){
    console.log(error);
  }
}

module.exports = connectDB;