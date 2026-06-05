# Jean Baby 🍼
**E-Commerce Platform for Baby Products | Rwanda**
> CAT-23708/2024

A full-stack e-commerce web application for buying and selling premium baby products online, built for the Rwandan market.

---

## 🚀 Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS (SPA) |
| Backend    | Node.js + Express.js    |
| Database   | MySQL 8                 |
| Auth       | express-session + bcryptjs |
| Container  | Docker + Docker Compose |
| CI/CD      | GitHub Actions          |

---

## 📋 Features

- 🛍️ Product listing with search and category filtering
- 📄 Product detail pages with quantity selector
- 🛒 Shopping cart (add, update, remove)
- 📦 Checkout with delivery details + payment method
- ✅ Order confirmation page with order reference
- 📋 Order history and tracking
- 👤 Role-based auth (Buyer / Seller)
- 📊 Seller dashboard with metrics, product CRUD, order management
- 🐳 Fully containerised with Docker
- 🔄 Automated CI/CD with GitHub Actions

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- MySQL 8
- Docker (optional but recommended)

### Option A – Docker (Recommended)
```bash
# Clone the repo
git clone https://github.com/<your-username>/jeanbaby.git
cd jeanbaby

# Start all services
docker compose up -d

# App: http://localhost:3000
# phpMyAdmin: http://localhost:8081
```

### Option B – Manual
```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Edit .env with your MySQL credentials

# Import database
mysql -u root -p < db/schema.sql

# Start development server
npm run dev

# App: http://localhost:3000
```

---

## 🗄️ Database

The `db/schema.sql` file creates all tables and seeds demo data.

**Demo accounts** (password: `password123`):
- Buyer: `buyer@jeanbaby.rw`
- Seller: `seller@jeanbaby.rw`

---

## 🔑 GitHub Secrets Required for Deployment

| Secret              | Description                    |
|---------------------|--------------------------------|
| `DOCKERHUB_USERNAME`| Docker Hub username            |
| `DOCKERHUB_TOKEN`   | Docker Hub access token        |
| `DEPLOY_HOST`       | Production server IP/hostname  |
| `DEPLOY_USER`       | SSH username                   |
| `DEPLOY_SSH_KEY`    | SSH private key                |

---

## 📁 Project Structure

```
jeanbaby/
├── server/
│   ├── index.js          # Express entry point
│   ├── db.js             # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js       # requireAuth, requireSeller
│   └── routes/
│       ├── auth.js       # Register, Login, Logout
│       ├── products.js   # Product listing & details
│       ├── cart.js       # Cart CRUD
│       ├── orders.js     # Place & view orders
│       └── seller.js     # Seller dashboard APIs
├── public/
│   ├── index.html        # Single Page App shell
│   ├── css/style.css     # Jean Baby design system
│   ├── js/app.js         # SPA router + all page logic
│   └── uploads/          # Product images
├── db/
│   └── schema.sql        # MySQL schema + seed data
├── .github/workflows/
│   └── ci-cd.yml         # GitHub Actions pipeline
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🌐 Live Demo

**URL:** https://jeanbaby.onrender.com *(update with your deployment URL)*

---

## 📝 License

Built for academic purposes — CAT-23708/2024.
