require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const port = 8000;

app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected To MongoDB Atlas Successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const UserSchema=new mongoose.Schema({
  name:String,
  email:String
})

const User=mongoose.model('User',UserSchema)


app.post('/users',async(req,res)=>{
  const {name,email}=req.body;
  try {

    const user=new User({name,email})
    await user.save()
    res.status(201).json(user)

  } catch (error) {
    console.error('Error Saving User :',err)
    res.status(500).json({error:"Internal server Error "})  }

})

app.get('/users',async(req,res)=>{
  const users=await User.find()
  res.json(users)
})

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`User Service  listening on port ${port}`);
});
