module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
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
  Post.associate = (db) => {};

  return Post;
};
