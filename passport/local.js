const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { User } = require('../models');
const bcrypt = require('bcrypt');

// signin에 대한 조건을 확인하고 조건에 부합하거나 부합하지 않을 시 done으로 설정( passport가 응답을 보내주지는 않음)
// 비동기 요청시 서버 에러가 발생 할 수 있으므로 try / catch 사용
module.exports = () => {
  // local 등록
  passport.use(
    new LocalStrategy(
      {
        // req.body.email, req.body.password
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          // user에 db에 있는 모든 정보가 들어있음, user.email / user.nickname / user.password ...
          const user = await User.findOne({
            where: { email },
          });
          if (!user) {
            // done( 서버에러, 성공, 클라이언트 에러)
            return done(null, false, {
              reason: 'This e-mail does not exist. ',
            });
          }

          const result = await bcrypt.compare(password, user.password);
          if (!result) {
            return done(null, false, { reason: 'Password does not match.' });
          }

          return done(null, user);
        } catch (error) {
          console.error(error);
          return done(error);
        }
      }
    )
  );
};
