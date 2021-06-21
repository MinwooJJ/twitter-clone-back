const express = require('express');
const { Post, Comment } = require('../models');
const { isSignedIn } = require('./middlewares');

const router = express.Router();

router.post('/', isSignedIn, async (req, res) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:postId/comment', isSignedIn, async (req, res) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });

    if (!post) {
      return res
        .status(403)
        .send(`The post you were looking for doesn't exist`);
    }

    const commnet = await Comment.create({
      content: req.body.content,
      PostId: req.params.postId,
      UserId: req.user.id,
    });
    res.status(201).json(commnet);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/', (req, res) => {
  res.json('yeah d');
});

module.exports = router;
