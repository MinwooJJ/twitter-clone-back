const express = require('express');
const path = require('path');
const fs = require('fs');
const { Post, Comment, Image, User, Hashtag } = require('../models');
const { isSignedIn } = require('./middlewares');
const multer = require('multer');

const router = express.Router();

// uploads 폴더 생성
try {
  fs.accessSync('uploads');
} catch (error) {
  console.log('Create uploads folder because it does not exist');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads'); // uploads 폴더에 저장
    },
    filename(req, file, done) {
      // ex minwoo.png
      const ext = path.extname(file.originalname); // 확장자 추출(.png)
      const basename = path.basename(file.originalname, ext); // minwoo
      done(null, basename + '_' + new Date().getTime() + ext); // minwoo20210623.png
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

router.post('/', isSignedIn, upload.none(), async (req, res, next) => {
  try {
    const hashtags = req.body.content.match(/(#[^\s#]+)/g);

    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });

    if (hashtags) {
      // [[node, true],[node, false]...]
      const result = await Promise.all(
        hashtags.map((tag) =>
          Hashtag.findOrCreate({
            where: { name: tag.slice(1).toLowerCase() },
          })
        )
      );

      await post.addHashtags(result.map((v) => v[0]));
    }

    // image를 여러개 올리면 image: [1, 2, 3, ...], 1개면 image: 1
    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(
          req.body.image.map((image) => Image.create({ src: image }))
        );
        await post.addImages(images);
      } else {
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }

    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        { model: Image },
        {
          model: Comment,
          include: [{ model: User, attributes: ['id', 'nickname'] }], // 댓글 작성자
        },
        { model: User, attributes: ['id', 'nickname'] }, // 게시글 작성자
        { model: User, as: 'Likers', attributes: ['id'] }, // 좋아요 누른 사람
      ],
    });

    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId', isSignedIn, async (req, res, next) => {
  try {
    await Post.destroy({
      where: { id: req.params.postId },
      UserId: req.user.id, // 내가 쓴 게시글
    });

    res.status(200).json(parseInt(req.params.postId, 10));
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:postId/comment', isSignedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });

    if (!post) {
      return res
        .status(403)
        .send(`The post you were looking for doesn't exist`);
    }

    const comment = await Comment.create({
      content: req.body.content,
      PostId: parseInt(req.params.postId, 10),
      UserId: req.user.id,
    });

    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [{ model: User, attributes: ['id', 'nickname'] }],
    });

    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:postId/like', isSignedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('The post does not exist');
    }
    await post.addLikers(req.user.id);

    res.status(201).json({ UserId: req.user.id, PostId: post.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId/like', isSignedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('The post does not exist');
    }
    await post.removeLikers(req.user.id);

    res.status(201).json({ UserId: req.user.id, PostId: post.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post(
  '/images',
  isSignedIn,
  upload.array('image'), // 한 장만 올리고 싶으면 single
  async (req, res, next) => {
    console.log(req.files); // image에 대한 정보
    res.json(req.files.map((v) => v.filename));
  }
);

module.exports = router;
