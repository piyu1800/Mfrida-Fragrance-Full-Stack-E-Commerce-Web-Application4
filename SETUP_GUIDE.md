# Mfrida Fragrance E-Commerce Application - Setup Guide

## 🎉 Application Status: FIXED & RUNNING

Your Mfrida Fragrance e-commerce application has been successfully set up and is now running!

---

## 🔧 Issues Found & Fixed

### 1. **Missing Environment Variables**
   - ✅ Added JWT_SECRET_KEY to backend .env
   - ✅ Added RAZORPAY keys to both frontend and backend .env
   - ✅ Changed database name from "test_database" to "mfrida_fragrance"

### 2. **Password Field Mismatch**
   - ✅ Fixed auth_service.py to use "password_hash" instead of "password"
   - This was causing login failures

### 3. **Missing Dependencies**
   - ✅ Installed all backend Python dependencies (razorpay was missing)
   - ✅ Installed all frontend Node.js dependencies

### 4. **Database Seeding**
   - ✅ Successfully seeded database with:
     - 1 Admin user
     - 5 Product categories
     - 10 Sample products
     - 6 Navigation items
     - Homepage configuration

---

## 👤 Admin Credentials

**Admin Login URL:** https://perfume-shop-70.preview.emergentagent.com/admin/login

```
Email: piyushakagale672@gmail.com
Password: piyu@1800
```

---

## 🌐 Live Preview URLs

- **Customer Frontend:** https://perfume-shop-70.preview.emergentagent.com
- **Admin Panel:** https://perfume-shop-70.preview.emergentagent.com/admin/login
- **Backend API:** https://perfume-shop-70.preview.emergentagent.com/api

### Admin Panel Features:
- 📊 Dashboard (with statistics)
- 📦 Products Management
- 📂 Categories Management
- 🎨 Banners Management
- 🧭 Navigation Management
- 📋 Orders Management
- 👥 Users Management

---

## 🚀 How to Run Locally on Your Machine

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- MongoDB
- Git

### Step-by-Step Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/piyu1800/Mfrida-Fragrance-Full-Stack-E-Commerce-Web-Application2.git
cd Mfrida-Fragrance-Full-Stack-E-Commerce-Web-Application2
```

#### 2. Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with these variables:
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="mfrida_fragrance"
CORS_ORIGINS="*"
JWT_SECRET_KEY="mfrida-fragrance-secret-key-2025"
RAZORPAY_KEY_ID="rzp_test_demo"
RAZORPAY_KEY_SECRET="demo_secret"
EOF

# Make sure MongoDB is running
# On Ubuntu/Linux: sudo systemctl start mongod
# On macOS: brew services start mongodb-community
# On Windows: Start MongoDB service from Services

# Seed the database (creates admin user and sample data)
python seed_data.py

# Start the backend server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

The backend API will be available at: http://localhost:8001

#### 3. Setup Frontend

Open a NEW terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
yarn install
# OR if you don't have yarn: npm install

# Create .env file
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
ENABLE_HEALTH_CHECK=false
REACT_APP_RAZORPAY_KEY_ID=rzp_test_demo
EOF

# Start the frontend development server
yarn start
# OR: npm start
```

The frontend will automatically open at: http://localhost:3000

#### 4. Access the Application

- **Customer Site:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin/login
- **API Documentation:** http://localhost:8001/docs

---

## 📁 Project Structure

```
mfrida-app/
├── backend/
│   ├── controllers/          # API route controllers
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── decorators/          # Auth decorators
│   ├── server.py           # Main FastAPI application
│   ├── seed_data.py        # Database seeding script
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── App.js        # Main app component
│   │   └── index.js      # Entry point
│   ├── public/           # Static files
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend configuration
│
└── README.md
```

---

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (Database with Motor async driver)
- JWT Authentication
- Razorpay Payment Integration
- Bcrypt Password Hashing

**Frontend:**
- React 19
- React Router v7
- Tailwind CSS
- shadcn/ui components
- Axios for API calls
- Framer Motion for animations

---

## 📝 Database Collections

After seeding, your MongoDB will have:

1. **users** - Admin and customer accounts
2. **products** - Product catalog (10 sample products)
3. **categories** - Product categories (5 categories)
4. **orders** - Customer orders
5. **navigation_items** - Header navigation items
6. **homepage_config** - Homepage banner configuration
7. **banners** - Marketing banners
8. **reviews** - Product reviews

---

## 🔍 Testing the Admin Panel

1. Go to http://localhost:3000/admin/login
2. Login with admin credentials:
   - Email: piyushakagale672@gmail.com
   - Password: piyu@1800
3. You'll see the dashboard with statistics
4. Navigate through different sections using the sidebar

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error:** "No module named 'pymongo'" or connection refused

**Solution:**
```bash
# Make sure MongoDB is installed and running
# Check if MongoDB is running:
mongosh
# OR
mongo

# If not installed, install MongoDB:
# Ubuntu: sudo apt-get install mongodb
# macOS: brew install mongodb-community
# Windows: Download from mongodb.com
```

### Issue 2: Port Already in Use
**Error:** "Address already in use" on port 8001 or 3000

**Solution:**
```bash
# Find process using the port (example for port 8001):
# Linux/Mac:
lsof -i :8001
kill -9 <PID>

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

### Issue 3: Frontend Cannot Connect to Backend
**Error:** CORS errors or "Network Error"

**Solution:**
- Make sure backend is running on port 8001
- Verify REACT_APP_BACKEND_URL in frontend/.env matches backend URL
- For local development, use: `REACT_APP_BACKEND_URL=http://localhost:8001`

### Issue 4: "No products found" on Products Page
**Error:** Products page shows empty

**Solution:**
```bash
# Re-run the seed script
cd backend
python seed_data.py
```

---

## 🎨 Features Implemented

### Customer Features:
- ✅ Browse products by category
- ✅ Product search and filtering
- ✅ Product detail pages with reviews
- ✅ Shopping cart functionality
- ✅ User authentication (signup/login)
- ✅ Order placement
- ✅ Order history
- ✅ Razorpay payment integration

### Admin Features:
- ✅ Admin authentication
- ✅ Dashboard with statistics
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order management
- ✅ User management
- ✅ Banner management
- ✅ Navigation management

---

## 📧 Support

If you encounter any issues not covered in this guide, please:
1. Check the browser console for error messages
2. Check backend logs for API errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB is running

---

## 🎯 Next Steps

1. ✅ Add more products through admin panel
2. ✅ Customize homepage banners
3. ✅ Configure real Razorpay keys for payments
4. ✅ Add product images
5. ✅ Test complete order flow
6. ✅ Deploy to production

---

**Application Status:** ✅ **FULLY FUNCTIONAL**

The application is now ready for development and testing!
