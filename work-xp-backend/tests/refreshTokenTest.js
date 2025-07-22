require('dotenv').config(); // Load env variables
const refreshAsanaToken = require('../helpers/refreshToken'); // Adjust path as needed

(async () => {
  const test_gid = '1207290816562217'; // Replace with an actual user's gid in your DB

  try {
    const result = await refreshAsanaToken(test_gid);
    console.log('✅ Token refresh succeeded:', result);
  } catch (err) {
    console.error('❌ Token refresh failed:', err.message);
  }
})();