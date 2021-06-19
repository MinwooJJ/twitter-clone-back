const express = require('express');
const postRouter = require('./routes/post');
const app = express();

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

app.use('/post', postRouter);

app.listen(3065, () => {
  console.log('Server On');
});
