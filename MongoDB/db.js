const mongoose = require('mongoose');


const connectDB = async() =>{
  try{
    await mongoose.connect('mongodb+srv://saminraiyan1:Itsabigsecret24@cluster0.hcjgnsf.mongodb.net/');
    console.log('connected to Mongo');
  }
  catch(error){
    console.log(error);
  }
}

module.exports = connectDB;