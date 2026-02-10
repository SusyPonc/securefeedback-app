require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const { body, validationResult } = require('express-validator');
const xss = require('xss-clean');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(xss());

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.get('/', (req, res) => {
    res.send(`
        <form method="POST" action="/register">
            <input name="name" placeholder="Nombre" required />
            <input name="email" placeholder="Email" required />
            <button type="submit">Registrar</button>
        </form>
    `);
});

app.post('/register',
    body('name').trim().escape(),
    body('email').isEmail(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send("Datos inválidos");
        }

        try {
            await sql.connect(dbConfig);
            await sql.query`
                INSERT INTO Users (name, email)
                VALUES (${req.body.name}, ${req.body.email})
            `;
            res.send("Usuario registrado");
        } catch (err) {
            res.send("Error al registrar");
        }
    }
);

app.get('/users', async (req, res) => {
    await sql.connect(dbConfig);
    const result = await sql.query`SELECT * FROM Users`;
    res.json(result.recordset);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor activo en puerto ${port}`);
});