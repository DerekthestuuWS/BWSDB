require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

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
        process.exit(1); // Stop execution if connection fails
    }
    console.log('Connected to the database!');
});

app.get('/', (req, res) => {
    res.send('Hello, world!');
});


// Route to fetch all users
app.get('/get', (req, res) => {
    const sql = 'SELECT * FROM users';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Error fetching data' });
        }
        res.send(results);
        //res.json(results);
    });
});

app.post('/addUser', (req, res) => {
    const { first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite } = req.body;

    if (!first_name || !last_name || !email || !public_id || !phone_number || !birthday || credit_score === undefined || !secret_favorite) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO users (first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'User added successfully', userId: result.insertId });
    });
});

function addUserToDatabase(first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite, callback) {
    const sql = `INSERT INTO users (first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [first_name, last_name, email, public_id, phone_number, birthday, credit_score, secret_favorite], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return callback(err, null);
        }
        callback(null, { message: 'User added successfully', userId: result.insertId });
    });
}
addUserToDatabase("John", "Doe", "johndoe@example.com", "abc123xyz", "123-456-7890", "2000-01-15", 750, "Chocolate", (err, result) => {
    if (err) {
        console.log("Failed to insert user:", err);
    } else {
        console.log(result);
    }
});

// Error handling for unhandled exceptions
process.on('uncaughtException', (err) => {
    console.error('Unhandled exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
});

// Start the server on port 80
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://derkbackend.duckdns.org`);
});
