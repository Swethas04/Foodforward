const express = require("express");
const path = require("path");
const fs = require("fs");
const cron = require('node-cron');
const mysql = require("mysql");
const cors = require("cors");
const session = require("express-session"); 
const bcrypt = require("bcryptjs");
const multer = require("multer");

const app = express();

const foodUploadDir = path.join(__dirname, "uploads", "food");
fs.mkdirSync(foodUploadDir, { recursive: true });

const foodImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, foodUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const foodImageUpload = multer({
  storage: foodImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, GIF, or WebP images are allowed."));
    }
  },
});
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true }));


// Create MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Rmdec@2001",  
  database: "food_forward_db",
  port : 3307
});

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function columnExists(table, column) {
  const rows = await queryAsync(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function tableExists(table) {
  const rows = await queryAsync(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].cnt > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) return;
  await queryAsync(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  console.log(`Added ${table}.${column}`);
}

async function ensureDatabaseSchema() {
  await addColumnIfMissing("donors", "food_category", "`food_category` VARCHAR(100) DEFAULT NULL AFTER `food_type`");
  await addColumnIfMissing("donors", "dietary_info", "`dietary_info` VARCHAR(500) DEFAULT NULL AFTER `food_category`");
  await addColumnIfMissing("donors", "allergen_info", "`allergen_info` VARCHAR(500) DEFAULT NULL AFTER `dietary_info`");
  await addColumnIfMissing("donors", "food_image", "`food_image` VARCHAR(255) DEFAULT NULL AFTER `allergen_info`");

  if (await tableExists("collected_food")) {
    await addColumnIfMissing("collected_food", "food_category", "`food_category` VARCHAR(100) DEFAULT NULL AFTER `food_type`");
    const afterCategory = (await columnExists("collected_food", "food_category")) ? "food_category" : "food_type";
    await addColumnIfMissing("collected_food", "dietary_info", `\`dietary_info\` VARCHAR(500) DEFAULT NULL AFTER \`${afterCategory}\``);
    const afterDietary = (await columnExists("collected_food", "dietary_info")) ? "dietary_info" : afterCategory;
    await addColumnIfMissing("collected_food", "allergen_info", `\`allergen_info\` VARCHAR(500) DEFAULT NULL AFTER \`${afterDietary}\``);
    const afterAllergen = (await columnExists("collected_food", "allergen_info")) ? "allergen_info" : afterDietary;
    await addColumnIfMissing("collected_food", "food_image", `\`food_image\` VARCHAR(255) DEFAULT NULL AFTER \`${afterAllergen}\``);
  }

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS donation_reviews (
      id INT NOT NULL AUTO_INCREMENT,
      donation_number VARCHAR(20) NOT NULL,
      donor_name VARCHAR(255) NOT NULL,
      food_type VARCHAR(255) DEFAULT NULL,
      receiver_id INT DEFAULT NULL,
      receiver_name VARCHAR(255) NOT NULL,
      rating TINYINT NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_donation_number (donation_number),
      KEY idx_donor_name (donor_name),
      KEY idx_rating (rating),
      CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

// Connect to MySQL and apply pending schema updates
db.connect(async (err) => {
  if (err) {
    console.error("Database connection failed: ", err);
    return;
  }
  console.log("Connected to MySQL Database");
  try {
    await ensureDatabaseSchema();
    console.log("Database schema is up to date");
  } catch (schemaErr) {
    console.error("Schema update failed:", schemaErr.message);
  }
});


function parseDonateFields(body) {
  const b = body || {};
  return {
    donorname: String(b.donorname || "").trim(),
    foodCategory: String(b.foodCategory || "").trim(),
    foodType: String(b.foodType || "").trim(),
    dietaryInfo: String(b.dietaryInfo || "").trim(),
    allergenInfo: String(b.allergenInfo || "").trim(),
    quantity: parseInt(b.quantity, 10),
    location: String(b.location || "").trim(),
    contact: String(b.contact || "").trim(),
    expiry: String(b.expiry || "").trim(),
  };
}

function validateDonateFields(fields) {
  const missing = [];
  if (!fields.donorname) missing.push("donor name");
  if (!fields.foodCategory) missing.push("food category");
  if (!fields.foodType) missing.push("food description");
  if (!fields.quantity || fields.quantity < 1) missing.push("quantity");
  if (!fields.location) missing.push("location");
  if (!fields.contact) missing.push("contact");
  if (!fields.expiry) missing.push("expiry time");
  return missing;
}

function saveDonation(res, fields, foodImage, uploadedFile) {
  const donationNumber = Math.floor(100000 + Math.random() * 900000);
  const sql = `INSERT INTO donors (donor_name, food_type, food_category, dietary_info, allergen_info, food_image, quantity, location, contact_info, expiry_time, donation_number) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      fields.donorname,
      fields.foodType,
      fields.foodCategory,
      fields.dietaryInfo || null,
      fields.allergenInfo || null,
      foodImage,
      fields.quantity,
      fields.location,
      fields.contact,
      fields.expiry,
      donationNumber,
    ],
    (err) => {
      if (err) {
        console.error("Error inserting data:", err);
        if (uploadedFile) fs.unlink(uploadedFile.path, () => {});
        return res.status(500).json({ message: "Failed to store donation data" });
      }
      res.status(200).json({
        message: "Donation submitted successfully!",
        donationNumber,
        foodImage,
      });
    }
  );
}

// JSON body (no photo) or multipart (with optional foodImage)
app.post("/api/donate", (req, res) => {
  const isMultipart = (req.headers["content-type"] || "").includes("multipart/form-data");

  if (!isMultipart) {
    const fields = parseDonateFields(req.body);
    const missing = validateDonateFields(fields);
    if (missing.length) {
      return res.status(400).json({
        message: `Please fill in: ${missing.join(", ")}`,
        missing,
      });
    }
    return saveDonation(res, fields, null, null);
  }

  foodImageUpload.single("foodImage")(req, res, (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ message: uploadErr.message || "Invalid image upload." });
    }

    const fields = parseDonateFields(req.body);
    const missing = validateDonateFields(fields);
    const foodImage = req.file ? `food/${req.file.filename}` : null;

    if (missing.length) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        message: `Please fill in: ${missing.join(", ")}`,
        missing,
      });
    }

    saveDonation(res, fields, foodImage, req.file);
  });
});



//  API to Search for Available Food
app.get("/api/search", (req, res) => {
  const { location, category, dietary, excludeAllergens } = req.query;

  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  let sql = `SELECT d.*,
    (SELECT ROUND(AVG(r.rating), 1) FROM donation_reviews r WHERE r.donor_name = d.donor_name) AS donor_avg_rating,
    (SELECT COUNT(*) FROM donation_reviews r WHERE r.donor_name = d.donor_name) AS donor_review_count
    FROM donors d WHERE d.location LIKE ?`;
  const params = [`%${location}%`];

  if (category) {
    sql += " AND d.food_category = ?";
    params.push(category);
  }

  if (dietary) {
    const diets = String(dietary).split(",").map((d) => d.trim()).filter(Boolean);
    if (diets.length) {
      sql += " AND (" + diets.map(() => "FIND_IN_SET(?, IFNULL(d.dietary_info, ''))").join(" OR ") + ")";
      params.push(...diets);
    }
  }

  if (excludeAllergens) {
    const allergens = String(excludeAllergens).split(",").map((a) => a.trim()).filter(Boolean);
    allergens.forEach(() => {
      sql += " AND (d.allergen_info IS NULL OR d.allergen_info = '' OR NOT FIND_IN_SET(?, d.allergen_info))";
    });
    params.push(...allergens);
  }

  db.query(sql, params, (err, results) => {
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

        const collected = results[0];

        // Move food to collected_food table
        const moveQuery = `INSERT INTO collected_food (id, donor_name, food_type, food_category, dietary_info, allergen_info, food_image, quantity, location, contact_info, expiry_time, donation_number) 
                           SELECT id, donor_name, food_type, food_category, dietary_info, allergen_info, food_image, quantity, location, contact_info, expiry_time, donation_number 
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

                res.json({
                    message: "Food collected successfully!",
                    donationNumber: collected.donation_number,
                    donorName: collected.donor_name,
                    foodType: collected.food_type
                });
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

// --- Ratings & Reviews (post-donation feedback) ---

app.post("/api/reviews", (req, res) => {
    const { donationNumber, rating, reviewText, receiverName } = req.body;
    const ratingNum = parseInt(rating, 10);
    const donationNum = donationNumber != null ? String(donationNumber).trim() : "";

    if (!donationNum || !ratingNum || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: "Donation number and a rating (1–5) are required." });
    }

    const verifySql = "SELECT * FROM collected_food WHERE donation_number = ? LIMIT 1";
    db.query(verifySql, [donationNum], (err, collected) => {
        if (err) {
            console.error("Review verify error:", err);
            return res.status(500).json({ message: "Database error." });
        }
        if (!collected.length) {
            return res.status(400).json({
                message: "This donation was not found as collected. Only completed pickups can be reviewed."
            });
        }

        const dupSql = "SELECT id FROM donation_reviews WHERE donation_number = ?";
        db.query(dupSql, [donationNum], (err, existing) => {
            if (err) {
                return res.status(500).json({ message: "Database error." });
            }
            if (existing.length) {
                return res.status(400).json({ message: "A review for this donation already exists." });
            }

            const food = collected[0];
            const reviewer =
                (receiverName && String(receiverName).trim()) ||
                (req.session.user && req.session.user.name) ||
                "Anonymous";
            const receiverId = req.session.user ? req.session.user.id : null;

            const insertSql = `INSERT INTO donation_reviews 
                (donation_number, donor_name, food_type, receiver_id, receiver_name, rating, review_text)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.query(
                insertSql,
                [
                    donationNum,
                    food.donor_name,
                    food.food_type,
                    receiverId,
                    reviewer,
                    ratingNum,
                    reviewText ? String(reviewText).trim().slice(0, 1000) : null
                ],
                (err) => {
                    if (err) {
                        console.error("Review insert error:", err);
                        return res.status(500).json({ message: "Failed to save review." });
                    }
                    res.status(201).json({ message: "Thank you for your feedback!" });
                }
            );
        });
    });
});

app.get("/api/reviews", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const sql = `SELECT id, donation_number, donor_name, food_type, receiver_name, rating, review_text, created_at
                 FROM donation_reviews ORDER BY created_at DESC LIMIT ?`;
    db.query(sql, [limit], (err, results) => {
        if (err) {
            console.error("Reviews fetch error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

app.get("/api/reviews/stats", (req, res) => {
    const sql = `SELECT COUNT(*) AS totalReviews, ROUND(AVG(rating), 1) AS averageRating FROM donation_reviews`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        const row = results[0] || {};
        res.json({
            totalReviews: row.totalReviews || 0,
            averageRating: row.averageRating || 0
        });
    });
});

app.get("/api/reviews/donor/:donorName", (req, res) => {
    const donorName = decodeURIComponent(req.params.donorName);
    const sql = `SELECT donation_number, donor_name, food_type, receiver_name, rating, review_text, created_at
                 FROM donation_reviews WHERE donor_name = ? ORDER BY created_at DESC LIMIT 20`;
    db.query(sql, [donorName], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});


// Fetch Admin Dashboard Summary
app.get("/admin/dashboard", (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM donors) AS total_donations, 
            (SELECT COUNT(*) FROM contacts) AS total_messages,
            (SELECT COUNT(*) FROM donation_reviews) AS total_reviews,
            (SELECT ROUND(AVG(rating), 1) FROM donation_reviews) AS avg_rating
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


// Fetch Reviews for Admin Panel
app.get("/admin/reviews", (req, res) => {
    const sql = `SELECT * FROM donation_reviews ORDER BY created_at DESC LIMIT 100`;
    db.query(sql, (err, results) => {
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

app.post("/api/contact", (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const sql = "INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, phone, message], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Message sent successfully!" });
    });
});

app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});

// Uploaded food photos (stored under uploads/food/)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve HTML/CSS/JS from project folder (use http://localhost:5000 — not npx serve)
app.use(express.static(path.join(__dirname)));

app.listen(5000, () => {
  console.log("FoodForward running at http://localhost:5000");
  console.log("Open that URL in your browser (stop npx serve if it is running).");
});