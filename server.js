const express = require("express");
const cron = require('node-cron');
const mysql = require("mysql");
const cors = require("cors");
const session = require("express-session"); 
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


// Create MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Rmdec@2001",  
  database: "food_forward_db",
  port : 3307
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err);
    return;
  }
  console.log("Connected to MySQL Database");
});


// API Route to Insert Donation Data 

app.post('/api/donate', (req, res) => {
    const { donorname, foodType, quantity, location, contact, expiry } = req.body;

    if (!donorname || !foodType || !quantity || !location || !contact || !expiry) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const donationNumber = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit donation number

    const sql = `INSERT INTO donors (donor_name, food_type, quantity, location, contact_info, expiry_time, donation_number) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [donorname, foodType, quantity, location, contact, expiry, donationNumber], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Failed to store donation data' });
        }
        res.status(200).json({ message: 'Donation submitted successfully!', donationNumber: donationNumber });
        //res.status(200).json({ message: 'Donation successfully submitted!' });
    });
});



//  API to Search for Available Food
app.get("/api/search", (req, res) => {
  const { location } = req.query;
  const sql = "SELECT * FROM donors WHERE location LIKE ?";
  
  db.query(sql, [`%${location}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) {
      return res.json({ message: "Nothing found" });
    }
    res.json(results);
  });
});

//API to insert contact form details
app.post('/submit-contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  const sql = 'INSERT INTO contact (name, email, phone, message) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [name, email, phone, message], (err, result) => {
      if (err) {
          console.error(err);
          res.status(500).json({ success: false, message: 'Database error' });
      } else {
          res.json({ success: true, message: 'Message submitted successfully!' });
      }
  });
});

app.post("/api/collect-food", (req, res) => {
    const { id, donationNumber } = req.body;

    if (!id || !donationNumber) {
        return res.status(400).json({ message: "Food ID and Donation Number are required" });
    }

    // Check if the donation number is correct
    const checkQuery = "SELECT * FROM donors WHERE id = ? AND donation_number = ?";
    db.query(checkQuery, [id, donationNumber], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid donation number! Please check with the donor." });
        }

        // Move food to collected_food table
        const moveQuery = `INSERT INTO collected_food (id, donor_name, food_type, quantity, location, contact_info, expiry_time, donation_number) 
                           SELECT id, donor_name, food_type, quantity, location, contact_info, expiry_time, donation_number 
                           FROM donors WHERE id = ?`;

        db.query(moveQuery, [id], (err) => {
            if (err) {
                console.error("Error moving food:", err);
                return res.status(500).json({ message: "Failed to collect food" });
            }

            // Delete from donors table
            const deleteQuery = "DELETE FROM donors WHERE id = ?";
            db.query(deleteQuery, [id], (err) => {
                if (err) {
                    console.error("Error deleting food:", err);
                    return res.status(500).json({ message: "Failed to remove food from donors" });
                }

                res.json({ message: "Food collected successfully!" });
            });
        });
    });
});


// Scheduled job to run every minute
cron.schedule('* * * * *', () => {
  console.log('Checking for expired food donations...');
  
  const query = `SELECT * FROM donors WHERE expiry_time <= NOW()`;
  db.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching expired food donations:', err);
          return;
      }
      
      if (results.length > 0) {
          results.forEach(food => {
              const moveQuery =` INSERT INTO expired_food (id, donor_name, food_name, expiry_time) VALUES (?, ?, ?, ?)`;
              db.query(moveQuery, [food.id, food.donor_name, food.food_type, food.expiry_time], (err) => {
                  if (err) {
                      console.error('Error moving expired food:', err);
                      return;
                  }
                  console.log(`Moved expired food ID ${food.id} to expired_food table.`);
              });
              
              const deleteQuery = `DELETE FROM donors WHERE id = ?`;
              db.query(deleteQuery, [food.id], (err) => {
                  if (err) {
                      console.error('Error deleting expired food:', err);
                  }
              });
          });
      } else {
          console.log('No expired food donations found.');
      }
  });
});



// API Route to Register Receiver
app.post("/register", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        // Check if email already exists
        const checkUserQuery = "SELECT * FROM receivers WHERE email = ?";
        db.query(checkUserQuery, [email], async (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error!" });
            }

            if (result.length > 0) {
                return res.status(400).json({ message: "Email already registered!" });
            }

            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into MySQL
            const insertQuery = "INSERT INTO receivers (name, email, phone, password) VALUES (?, ?, ?, ?)";
            db.query(insertQuery, [name, email, phone, hashedPassword], (err, result) => {
                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).json({ message: "Failed to register user!" });
                }
                res.status(200).json({ message: "Registration successful!" });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error!" });
    }
});



// Add session middleware
app.use(session({
    secret: "foodforward_secret", 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// API Route to Handle Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        // Check if user exists
        const sql = "SELECT * FROM receivers WHERE email = ?";
        db.query(sql, [email], async (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ message: "Database error!" });
            }

            if (result.length === 0) {
                return res.status(401).json({ message: "Invalid email or password!" });
            }

            const user = result[0];

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password!" });
            }

            // Start a session
            req.session.user = { id: user.id, name: user.name, email: user.email };

            res.status(200).json({ message: "Login successful!", redirect: "search.html" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error!" });
    }
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next(); // User is logged in, allow access
    } else {
        res.status(401).json({ message: "Unauthorized! Please log in." });
    }
}

// Protect Search Page
app.get("/api/search-protected", isAuthenticated, (req, res) => {
    const sql = "SELECT * FROM donors";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed!" });
        }
        res.json({ message: "Logout successful!" });
    });
});


// Fetch Admin Dashboard Summary
app.get("/admin/dashboard", (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM donors) AS total_donations, 
            (SELECT COUNT(*) FROM contacts) AS total_messages
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results[0]);
    });
});

// Fetch Donations for Admin Panel
app.get("/admin/donations", (req, res) => {
    db.query("SELECT * FROM donors", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Fetch Contact Messages for Admin Panel
app.get("/admin/messages", (req, res) => {
    db.query("SELECT * FROM contacts", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});


// Delete a Donation (Admin)
app.post("/admin/donations/delete", (req, res) => {
    const { id } = req.body;
    db.query("DELETE FROM donors WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.send("Donation deleted");
    });
});

// Start the Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5500");
});

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    try {
        const sql = "INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)";
        const values = [name, email, phone, message];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json({ success: true, message: "Message sent successfully!" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});