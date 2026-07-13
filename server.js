// server.js
// HomieLink — Connect Instantly. Stay Close.
// Section 1: bare-bones server so we know the lights turn on.

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🏠 HomieLink server is up! Come back after Section 3 for the real UI.');
});

app.listen(PORT, () => {
  console.log(`🏠 HomieLink is listening on http://localhost:${PORT}`);
});