const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.fields;
    if (username && email && password && newsletter) {
      const userExists = await User.findOne({ email: email });
      if (!userExists) {
        const token = uid2(64);
        const salt = uid2(16);
        const hash = SHA256(salt + password).toString(encBase64);

        const newUser = new User({
          email,
          account: {
            username,
          },
          newsletter,
          token,
          salt,
          hash,
        });

        await newUser.save();
        res.json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(409).json({ message: "This email already has an account" });
      }
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // Réceptionner un body
    console.log(req.fields);
    const { email, password } = req.fields;
    // Aller chercher si on a bien un user qui correspond au mail reçu
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(userExists);
      // On concatène le MDP reçu avec le salt en BDD et on encrypte le tout
      const newHash = SHA256(userExists.salt + password).toString(encBase64);
      // Si on obtient le même Hash que celui en BDD, c'est bon

      //   console.log(newHash);
      //   console.log(userExists.hash);

      if (newHash === userExists.hash) {
        res.status(200).json({
          _id: userExists._id,
          token: userExists.token,
          account: userExists.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
