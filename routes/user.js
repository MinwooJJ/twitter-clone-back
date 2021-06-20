const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { User } = require('../models');

const router = express.Router();

// POST /user/signin
// done의 return 값이 callback 함수처럼 authenticate로 전달됨
// next, res 사용을 위한 미들웨어 확장 -> 사용하고자 하는 미들웨어를 express 함수로 감싸고 뒤에 매개변수 정의
router.post('/signin', (req, res, next) => {
  // LocalStrategy에서 인증이 성공한 경우 다음 콜백함수로 이동
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      // 서버 에러
      return next(err);
    }

    if (info) {
      return res.status(401).send(info.reason);
    }

    // passpord signin( 내가 설계한 서비스의 로그인 후 passport에서 한 번더 로그인)
    // 동시에 serializeUser가 실행
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }

      return res.status(200).json(user);
    });
  })(req, res, next);
});

// 로그인 한 후로는 req.user에 사용자 정보가 들어있음
router.post('/user/signout', (req, res, next) => {
  req.logout();
  req.session.destroy();
  res.send('OK signout');
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
