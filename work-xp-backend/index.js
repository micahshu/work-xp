const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sessionConfig = require('./sessionConfig');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const skillsRoutes = require('./routes/skills');
const userRoutes = require('./routes/user'); 
const webhookRoutes = require('./routes/webhook'); 
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));
app.use(sessionConfig);
app.use('/auth', authRoutes);
app.use('/project', projectRoutes);
app.use('/skills', skillsRoutes);
app.use('/user', userRoutes);
app.use('/webhook', webhookRoutes);
app.get('/', (req, res) => {
  res.send('Work XP Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
