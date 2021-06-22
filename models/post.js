module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    // mb4는 이모티콘 사용 옵션
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
  Post.associate = (db) => {
    db.Post.belongsTo(db.User); // post.addUser
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' }); // post.addLikers, post.removeLikers
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' }); // 다 대 다 관계
    db.Post.hasMany(db.Comment); // post.addComents
    db.Post.hasMany(db.Image); // post.addImages
    db.Post.belongsTo(db.Post, { as: 'Retweet' }); // re-tweet 관계, 일 대 다
  };

  return Post;
};
