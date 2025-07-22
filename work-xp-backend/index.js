const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sessionConfig = require('./sessionConfig');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Update to your frontend's origin
  credentials: true
}));
app.use(sessionConfig);
app.use('/auth', authRoutes);
app.use('/project', projectRoutes);

app.get('/', (req, res) => {
  res.send('Work XP Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
