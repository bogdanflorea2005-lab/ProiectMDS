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

app.delete('/api/utilizatori', async (req, res) => {
  const { email, parola } = req.body;
  const client = await pool.connect();
  try {
    const userResult = await client.query(
      'SELECT * FROM UTILIZATORI WHERE EMAIL = $1 AND PAROLA = $2',
      [email, parola]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }
    const userId = userResult.rows[0].id;
    
    await client.query('BEGIN');
    await client.query('DELETE FROM SESIUNI_STUDIU WHERE USER_ID = $1', [userId]);
    await client.query('DELETE FROM COMPETENTE WHERE USER_ID = $1', [userId]);
    await client.query('DELETE FROM UTILIZATORI WHERE ID = $1', [userId]);
    await client.query('COMMIT');
    
    res.json({ message: 'Cont șters cu succes' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});