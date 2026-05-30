# 🍽️ FoodForward

FoodForward is a full-stack web application that connects food donors — restaurants, businesses, and individuals — with organizations and communities in need. The platform makes donating surplus food simple, trackable, and transparent, reducing waste while addressing hunger.

---

## ✨ Features


### 👥 Receiver Authentication
- Receiver registration and login are implemented via `receiver login.html` and `registration form.html`
- Session-based auth is handled by `express-session` on the server
- Search results are protected behind receiver login

### 🍛 Donation System
- Public donor donation form lets donors submit surplus food without registering
- Donations include food category, description, quantity, location, expiry, dietary notes, allergen info, and optional image upload
- Uploaded images are stored under `uploads/food/`

### 🔍 Search & Discovery
- Receivers can search donations by location and category
- Supports dietary filters and allergen exclusions
- Search results include donor rating info when available

### ⭐ Ratings & Reviews
- Review submission is available after donation collection
- Ratings are stored as 1–5 stars and can include written feedback
- Aggregated review stats are available from the API

### 📦 Collection Tracking
- Collected food is moved from the donor inventory into a collected-food record
- Pickup validation requires a donation number
- Supports tracking of completed donations and connected review flow

### 🛠️ Admin Interface
- `admin.html` provides an admin-style dashboard for donations, reviews, messages, and summary stats
- Backend admin endpoints exist for loading donations, contact messages, reviews, and dashboard summary data

### 💬 Interactive Chatbot
- Homepage chatbot on `index.html` provides FAQ-style guidance
- Built with vanilla JavaScript and canned responses
- Helps visitors find donation instructions, receiver support, and contact details

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js, node-cron |
| Database | MySQL 8.0.41 |
| Auth & Security | bcryptjs, Express-session, CORS |
| File Uploads | Multer (5MB image limit) |

---

## 🎯 Project Goal

Reduce food waste. Support communities in need. Build an accessible, trust-driven donation network using technology.

Built in support of **SDG 2** (Zero Hunger) and **SDG 12** (Responsible Consumption).

---

## 📜 License

This project is developed for educational and demonstration purposes.
It is intended to showcase technical implementation and innovation.
The software is provided "as is" without warranty of any kind.

---
***Built for those who have a little extra, and those who need a little more.***
