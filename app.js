const express = require('express');
const app = express();
const cors = require('cors');

const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const db = require('./models');

// db와 sequelize 연결
db.sequelize
  .sync()
  .then(() => {
    console.log('db is connected!');
  })
  .catch(console.error);

// 모든 요청 허용
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('hello express');
});

app.get('/', (req, res) => {
  res.send('hello api');
});

app.get('/posts', (req, res) => {
  res.json([
    { id: 1, content: 'hello' },
    { id: 2, content: 'hello' },
    { id: 3, content: 'hello' },
  ]);
});

app.use('/user', userRouter);
app.use('/post', postRouter);

app.listen(3065, () => {
  console.log('Server On!');
});
