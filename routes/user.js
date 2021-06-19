const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const router = express.Router();

// POST /user
router.post('/', async (req, res, next) => {
  try {
    // db에서 email 중복 확인, 없다면 null
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (exUser) {
      return res.status(403).send('Sorry, that e-mail already exists!');
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
    });

    res.status(201).json('OK signup');
  } catch (error) {
    console.error(error);
    next(error); // status 500
  }
});

module.exports = router;
