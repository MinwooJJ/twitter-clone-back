module.exports = (sequelize, DataTypes) => {
  // User의 경우 mySql에서 자동으로 users로 이름이 변경
  // id는 mySql에서 자동으로 생성
  const User = sequelize.define(
    'User',
    {
      email: {
        type: DataTypes.STRING(30),
        allowNull: false, // false: 필수 데이터
        unique: true, // 고유한 값( 중복불가)
      },
      nickname: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(100), // 비밀번호가 암호화 할 시 길이가 길어짐
        allowNull: false,
      },
    },
    // User 모델 관련 설정
    {
      charset: 'utf8',
      collate: 'utf8_general_ci', // 한글 데이터 저장
    }
  );
  User.associate = (db) => {
    db.User.hasMany(db.Post); // 1 대 다 관계
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.Post, { through: 'Like', as: 'Liked' }); // 사용자와 게시글의 좋아요 기능 관계
    db.User.belongsToMany(db.User, {
      through: 'Follow',
      as: 'Followers',
      foreignKey: 'FollowingId',
    });
    db.User.belongsToMany(db.User, {
      through: 'Follow',
      as: 'Followings',
      foreignKey: 'FollowerId',
    });
  };

  return User;
};
