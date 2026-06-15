require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(express.json());
app.set('json spaces', 2);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },   // Supabase pooler necesită SSL
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

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/agent/estimare-competenta', async (req, res) => {
  const { denumire_competenta, nivel_cunostinte } = req.body;
  try {
    const prompt = `Estimează de câte ore de studiu are nevoie o persoană cu nivelul "${nivel_cunostinte}" pentru a învăța: "${denumire_competenta}".
Răspunde DOAR cu JSON în formatul:
{ "ore_estimate": 40, "explicatie": "scurtă justificare" }
"ore_estimate" trebuie să fie un număr întreg (doar numărul de ore).`;

    const response = await genereazaCuRetry({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/program', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id lipsește' });
  }

  try {
    const userRes = await pool.query(
      'SELECT NUME, ORE_DISPONIBILE_ZI, NIVEL_CUNOSTINTE FROM UTILIZATORI WHERE ID = $1',
      [user_id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizator inexistent' });
    }
    const user = userRes.rows[0];

    const sesiuniRes = await pool.query(
      `SELECT MATERIE, DURATA_MINUTE, DATA_SESIUNE
       FROM SESIUNI_STUDIU
       WHERE USER_ID = $1 AND DATA_SESIUNE >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY DATA_SESIUNE`,
      [user_id]
    );

    const rezumatSesiuni = sesiuniRes.rows.length > 0
      ? sesiuniRes.rows.map(s => `- ${s.materie}: ${s.durata_minute} minute`).join('\n')
      : '(nicio sesiune înregistrată în ultima săptămână)';

    const prompt = `Ești un asistent care planifică timpul de studiu pentru un student.

Date despre utilizator:
- Nume: ${user.nume}
- Ore disponibile pe zi: ${user.ore_disponibile_zi}
- Nivel cunoștințe: ${user.nivel_cunostinte} (1=începător, 2=intermediar, 3=avansat)

Sesiunile de studiu din ultima săptămână:
${rezumatSesiuni}

Generează un program de studiu pentru săptămâna viitoare (Mon–Sun).
Reguli:
- Nu depăși ${user.ore_disponibile_zi} ore (${user.ore_disponibile_zi * 60} minute) pe zi.
- Distribuie echilibrat materiile studiate recent. Dacă nu există sesiuni, propune un program general de început.
- Fiecare sesiune are între 30 și 120 de minute.
- Lasă cel puțin o zi mai ușoară pentru odihnă.

Răspunde DOAR cu JSON în acest format exact:
{
  "program": [
    { "zi": "Mon", "materie": "nume materie", "durata_minute": 60 }
  ]
}
Valorile pentru "zi" trebuie să fie exact: Mon, Tue, Wed, Thu, Fri, Sat, Sun.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const program = JSON.parse(response.text);
    res.json(program);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la generarea programului' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, parola } = req.body;

  if (!email || !parola) {
    return res.status(400).json({ error: 'Email și parolă necesare' });
  }

  try {
    const result = await pool.query(
      `SELECT ID, NUME, EMAIL, NIVEL_CUNOSTINTE, ORE_DISPONIBILE_ZI
       FROM UTILIZATORI
       WHERE EMAIL = $1 AND PAROLA = $2`,
      [email, parola]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    res.json(result.rows[0]);   // utilizatorul, fara parola
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la autentificare' });
  }
});

app.get('/api/competente/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT ID, DENUMIRE, ORE_ESTIMATE, ORE_STUDIATE
       FROM COMPETENTE WHERE USER_ID = $1 ORDER BY ID`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/utilizatori/:id', async (req, res) => {
  const { id } = req.params;
  const { nume, email, nivel_cunostinte, ore_disponibile_zi } = req.body;
  try {
    const result = await pool.query(
      `UPDATE UTILIZATORI
       SET NUME = $1, EMAIL = $2, NIVEL_CUNOSTINTE = $3, ORE_DISPONIBILE_ZI = $4
       WHERE ID = $5
       RETURNING ID, NUME, EMAIL, NIVEL_CUNOSTINTE, ORE_DISPONIBILE_ZI`,
      [nume, email, nivel_cunostinte, ore_disponibile_zi, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizator inexistent' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/utilizatori/:id/parola', async (req, res) => {
  const { id } = req.params;
  const { parola_veche, parola_noua } = req.body;

  if (!parola_veche || !parola_noua) {
    return res.status(400).json({ error: 'Parola veche și cea nouă sunt necesare' });
  }

  try {
    // verificam parola veche
    const check = await pool.query(
      'SELECT ID FROM UTILIZATORI WHERE ID = $1 AND PAROLA = $2',
      [id, parola_veche]
    );
    if (check.rows.length === 0) {
      return res.status(401).json({ error: 'Parola veche este incorectă' });
    }

    // o setam pe cea noua
    await pool.query(
      'UPDATE UTILIZATORI SET PAROLA = $1 WHERE ID = $2',
      [parola_noua, id]
    );

    res.json({ message: 'Parolă schimbată cu succes' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/competente/:id/studiu', async (req, res) => {
  const { id } = req.params;
  const { ore } = req.body;
  try {
    const result = await pool.query(
      `UPDATE COMPETENTE SET ORE_STUDIATE = ORE_STUDIATE + $1
       WHERE ID = $2
       RETURNING ID, DENUMIRE, ORE_ESTIMATE, ORE_STUDIATE`,
      [ore, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competență inexistentă' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function genereazaCuRetry(params, maxIncercari = 3) {
  for (let i = 0; i < maxIncercari; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const esteSupraincarcat = err.status === 503 || err.status === 429;
      if (esteSupraincarcat && i < maxIncercari - 1) {
        const asteptare = 1000 * Math.pow(2, i);   
        console.log(`Model supraîncărcat, reîncerc în ${asteptare}ms...`);
        await new Promise(r => setTimeout(r, asteptare));
        continue;
      }
      throw err;  
    }
  }
}

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
