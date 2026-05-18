require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(express.json());
app.set('json spaces', 2); 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/utilizatori', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM UTILIZATORI');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/utilizatori', async (req, res) => {
  const { nume, email, parola, nivel_cunostinte, ore_disponibile_zi } = req.body;
  try {
    const query = `
      INSERT INTO UTILIZATORI (NUME, EMAIL, PAROLA, NIVEL_CUNOSTINTE, ORE_DISPONIBILE_ZI) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [nume, email, parola, nivel_cunostinte, ore_disponibile_zi];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sesiuni', async (req, res) => {
  const { user_id, materie, durata_minute } = req.body;
  try {
    const query = `
      INSERT INTO SESIUNI_STUDIU (USER_ID, DATA_SESIUNE, MATERIE, DURATA_MINUTE) 
      VALUES ($1, CURRENT_DATE, $2, $3) RETURNING *;
    `;
    const values = [user_id, materie, durata_minute];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/competente', async (req, res) => {
  const { user_id, denumire, ore_estimate } = req.body;
  try {
    const query = `
      INSERT INTO COMPETENTE (USER_ID, DENUMIRE, ORE_ESTIMATE, ORE_STUDIATE) 
      VALUES ($1, $2, $3, 0) RETURNING *;
    `;
    const values = [user_id, denumire, ore_estimate];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Serverul a pornit la http://localhost:${port}`);
});