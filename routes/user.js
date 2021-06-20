const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { User } = require('../models');

const router = express.Router();

// POST /user/signin
// done의 return 값이 callback 함수처럼 authenticate로 전달됨
// next, res 사용을 위한 미들웨어 확장 -> 사용하고자 하는 미들웨어를 express 함수로 감싸고 뒤에 매개변수 정의
router.post('/signin', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      // 서버 에러
      return next(err);
    }

    if (info) {
      return res.status(401).send(info.reason);
    }

    // passpord signin( 내가 설계한 서비스의 로그인 후 passport에서 한 번더)
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }

      return res.json(user);
    });
  })(req, res, next);
});

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
