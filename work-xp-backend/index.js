const express = require('express');
const dotenv = require('dotenv');
const sessionConfig = require('./sessionConfig');
const authRoutes = require('./routes/auth');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(sessionConfig);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Work XP Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
