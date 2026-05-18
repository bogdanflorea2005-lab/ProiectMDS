require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM utilizatori');
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la baza de date:", err);
    res.status(500).send("Eroare internă: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`Serverul a pornit la http://localhost:${port}`);
});