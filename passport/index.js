const passport = require('passport');
const local = require('./local');
const { User } = require('../models');

module.exports = () => {
  // cookie와 묶어줄 id만 저장
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // User 복원을 할때는 id 정보를 사용하여 db에서 복원
  // router 실행되기 전에 매번 실행
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ where: { id } });
      done(null, user); // req.user안에 저장
    } catch (error) {
      console.error(error);
      done(error);
    }
  });

  local();
};
