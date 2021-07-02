const express = require('express');
const { User, Post, Hashtag, Comment, Image } = require('../models');

const router = express.Router();

router.get('/:hashtag', async (req, res, next) => {
  try {
    const where = {};
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
        {
          model: Hashtag,
          where: { name: decodeURIComponent(req.params.hashtag) },
        },
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
