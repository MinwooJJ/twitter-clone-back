const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const passport = require('passport');
const { Post, User, Image, Comment } = require('../models');
const { isSignedIn, isNotSignedIn } = require('./middlewares');

const router = express.Router();

// GET /user
// 새로고침시 로그인 정보를 보내주기 위한 API
router.get('/', async (req, res, next) => {
  try {
    if (req.user) {
      const fullUserWithoutPassword = await User.findOne({
        where: { id: req.user.id },
        attributes: {
          exclude: ['password'],
        },
        include: [
          { model: Post, attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] },
          { model: User, as: 'Followers', attributes: ['id'] },
        ],
      });
      res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 특정 사용자 데이터 가져오기
router.get('/:userId', async (req, res, next) => {
  try {
    const fullUserWithoutPassword = await User.findOne({
      where: { id: req.params.userId },
      attributes: {
        exclude: ['password'],
      },
      include: [
        { model: Post, attributes: ['id'] },
        { model: User, as: 'Followings', attributes: ['id'] },
        { model: User, as: 'Followers', attributes: ['id'] },
      ],
    });
    if (fullUserWithoutPassword) {
      // 개인정보 보호
      const data = fullUserWithoutPassword.toJSON();
      data.Posts = data.Posts.length;
      data.Followings = data.Followings.length;
      data.Followers = data.Followers.length;

      res.status(200).json(data);
    } else {
      res.status(404).json('That user does not exist');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /user
router.post('/', isNotSignedIn, async (req, res, next) => {
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

// POST /user/signin
// done의 return 값이 callback 함수처럼 authenticate로 전달됨
// next, res 사용을 위한 미들웨어 확장 -> 사용하고자 하는 미들웨어를 express 함수로 감싸고 뒤에 매개변수 정의
router.post('/signin', isNotSignedIn, (req, res, next) => {
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

      // include는 model에서 관계를 해줬던 데이터들을 가져 올 수 있음
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclude: ['password'],
        },
        include: [
          { model: Post, attributes: ['id'] },
          { model: User, as: 'Followings', attributes: ['id'] },
          { model: User, as: 'Followers', attributes: ['id'] },
        ],
      });
      return res.status(200).json(fullUserWithoutPassword);
    });
  })(req, res, next);
});

// 로그인 한 후로는 req.user에 사용자 정보가 들어있음
router.post('/signout', isSignedIn, (req, res, next) => {
  req.logout();
  req.session.destroy();
  res.send('OK signout');
});

router.patch('/nickname', isSignedIn, async (req, res, next) => {
  try {
    await User.update(
      {
        nickname: req.body.nickname, // 프론트에서 온 데이터
      },
      {
        where: { id: req.user.id }, // 변경하고자 하는 데이터
      }
    );

    res.status(201).json(req.body.nickname);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:userId/follow', isSignedIn, async (req, res, next) => {
  // PATCH /user/1/follow
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(403).send('This user does not exist');
    }
    await user.addFollower(req.user.id);

    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:userId/follow', isSignedIn, async (req, res, next) => {
  // DELETE /user/1/follow
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(403).send('This user does not exist');
    }
    await user.removeFollower(req.user.id);

    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/follower/:userId', isSignedIn, async (req, res, next) => {
  // DELETE /user/follow/1
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(403).send('This user does not exist');
    }
    await user.removeFollowing(req.user.id);

    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/followers', isSignedIn, async (req, res, next) => {
  // GET /user/followers
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.status(403).send('This user does not exist');
    }
    const followers = await user.getFollowers();

    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/followings', isSignedIn, async (req, res, next) => {
  // GET /user/followings
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.user(id).send('This user does not exist');
    }
    const followings = await user.getFollowings();

    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:userId/posts', async (req, res, next) => {
  try {
    const where = { UserId: req.params.userId };
    // 초기 로딩이 아닐 경우( 값이 존재)
    if (parseInt(req.query.lastId, 10)) {
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) }; // lastId보다 작은
    }

    const posts = await Post.findAll({
      where,
      limit: 10,
      // 1차로 게시글들의 데이터를 최신순으로 정렬하고 그 안의 댓글들을 최신순으로 정렬하는 것
      order: [
        ['createdAt', 'DESC'],
        [Comment, 'createdAt', 'DESC'],
      ],
      include: [
        { model: User, attributes: ['id', 'nickname'] },
        { model: Image },
        {
          model: Comment,
          include: [{ model: User, attributes: ['id', 'nickname'] }],
        },
        { model: User, as: 'Likers', attributes: ['id'] },
        {
          model: Post,
          as: 'Retweet',
          include: [
            {
              model: User,
              attributes: ['id', 'nickname'],
            },
            {
              model: Image,
            },
          ],
        },
      ], // 작성자 정보
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
