const express = require("express");
const { Op } = require("sequelize");
const { Post, User, Image, Comment } = require("../models");

const router = express.Router();

router.get("/", async (req, res, next) => {
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
        ["createdAt", "DESC"],
        [Comment, "createdAt", "DESC"],
      ],
      include: [
        { model: User, attributes: ["id", "nickname"] },
        { model: Image },
        {
          model: Comment,
          include: [{ model: User, attributes: ["id", "nickname"] }],
        },
        { model: User, as: "Likers", attributes: ["id"] },
        {
          model: Post,
          as: "Retweet",
          include: [
            {
              model: User,
              attributes: ["id", "nickname"],
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

router.get("/related", async (req, res, next) => {
  try {
    const followings = await User.findAll({
      attributes: ["id"],
      include: [
        {
          model: User,
          as: "Followers",
          where: { id: req.user.id },
        },
      ],
    });
    const where = {
      UserId: { [Op.in]: followings.map((v) => v.id) },
    };
    if (parseInt(req.query.lastId, 10)) {
      // 초기 로딩이 아닐 때
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) };
    } // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
    const posts = await Post.findAll({
      where,
      limit: 10,
      order: [
        ["createdAt", "DESC"],
        [Comment, "createdAt", "DESC"],
      ],
      include: [
        {
          model: User,
          attributes: ["id", "nickname"],
        },
        {
          model: Image,
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ["id", "nickname"],
            },
          ],
        },
        {
          model: User, // 좋아요 누른 사람
          as: "Likers",
          attributes: ["id"],
        },
        {
          model: Post,
          as: "Retweet",
          include: [
            {
              model: User,
              attributes: ["id", "nickname"],
            },
            {
              model: Image,
            },
          ],
        },
      ],
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
