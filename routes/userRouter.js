require("dotenv").config;

const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUser, getProduct } = require("../middleware/finders");

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET one user
router.get("/:id", getUser, (req, res, next) => {
  res.send(res.user);
});

// LOGIN user with email + password
router.patch("/", async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) res.status(404).json({ message: "Could not find user" });
  if (await bcrypt.compare(password, user.password)) {
    try {
      const access_token = jwt.sign(
        JSON.stringify(user),
        process.env.JWT_SECRET_KEY
      );
      res.status(201).json({ jwt: access_token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res
      .status(400)
      .json({ message: "Email and password combination do not match" });
  }
});

// REGISTER a user
router.post("/", async (req, res, next) => {
  const { fullname, email, password, phone_number } = req.body;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    fullname,
    email,
    phone_number,
    password: hashedPassword,
  });

  try {
    const newUser = await user.save();

    try {
      const access_token = jwt.sign(
        JSON.stringify(newUser),
        process.env.JWT_SECRET_KEY
      );
      res.status(201).json({ jwt: access_token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a user
router.put("/:id", getUser, async (req, res, next) => {
  const { fullname, phone_number, password } = req.body;
  if (fullname) res.user.fullname = fullname;
  if (phone_number) res.user.phone_number = phone_number;
  if (password) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    res.user.password = hashedPassword;
  }

  try {
    const updatedUser = await res.user.save();
    res.status(201).send(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a user
router.delete("/:id", getUser, async (req, res, next) => {
  try {
    await res.user.remove();
    res.json({ message: "Deleted user" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//getting all items in cart
router.get('/:id/cart', auth,async (req, res, next)=>{
  try{
    res.json(req.user.cart)
  }catch (error){
    res.status(500).json({ msg: error})
  }
})
  
//Adds a new item to the users cart
router.post('/:id/cart',[auth,getProduct],async (req, res, next)=>{ 
    //  console.log(req.user)

     const user = await User.findById(req.user._id)
    // console.log(user)
    let product_id = res.product._id
    let title = res.product.title
    let category= res.product.category
    let img = res.product.img
    let price = res.product.price
    let quantity = req.body
    let created_by = req.user._id

  try {
    // console.log(Array.isArray(user.cart))
    // user.cart = []
    user.cart.push( {product_id, title, category, img, price,quantity, created_by})
    const updatedUser = await user.save();
    res.status(201).json(updatedUser)
  } catch (error) {
    res.status(500).json(console.log(error))
  }
})
//updates the items in the users cart
router.put('/:id/cart',[auth,getUser], (req, res, next)=>{
  
})
//clears the user cart
router.delete('/:id/cart',[auth,getProduct], async(req, res, next)=>{
 
}
)
module.exports = router;
