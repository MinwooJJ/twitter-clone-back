const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  res.json('yeah');
});

router.delete('/', (req, res) => {
  res.json('yeah d');
});

module.exports = router;
