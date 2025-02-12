require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(express.json()); // Ensure JSON parsing

// Create MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to the database!');
});



// Route to fetch all users
app.get('/get', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Error fetching data' });
        }
        res.json(results);
    });
});

// Route to add a new user
app.post('/addUser', (req, res) => {
    const { first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite } = req.body;

    if (!first_name || !last_name || !email || !public_id || !phone_number || !birthday || credit_score === undefined || !secret_favorite) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO users (first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite, money) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite, 100], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'User added successfully', userId: result.insertId });
    });
});

app.post('/sendMoney', (req, res) => {
    const { public_id, amount } = req.body;

    if (!public_id || amount === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ error: "YOUR BA TRYNA SCAM" });
    }

    const query = 'UPDATE users SET money = money + ? WHERE public_id = ?';

    connection.execute(query, [amount, public_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        if (results.affectedRows === 0) {
            return res.status(400).json({ error: 'No database matches for this ID' });
        }
        res.status(200).json({ message: 'Money successfully sent' });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        res.status(200).json({ message: 'Login successful', user: results[0] });
    });
});
app.post('/transaction', (req, res) => {
    const { public_id, amount } = req.body;

    if (!public_id || amount === undefined) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(amount)) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const checkBalanceQuery = 'SELECT money FROM users WHERE public_id = ?';
    connection.query(checkBalanceQuery, [public_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: 'No user found with this ID' });
        }

        const currentBalance = results[0].money;
        const updateQuery = 'UPDATE users SET money = money + ? WHERE public_id = ?';
        connection.execute(updateQuery, [amount, public_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Server Error' });
            }
            if (results.affectedRows === 0) {
                return res.status(400).json({ error: 'No database matches for this ID' });
            }
            res.status(200).json({ message: `Transaction successful. New balance: ${currentBalance + amount}` });
        });
    });
});



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://derkbackend.duckdns.org`);
});
