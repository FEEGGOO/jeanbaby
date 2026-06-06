# Jean Baby

An e-commerce web application for buying and selling baby products online, built for the Rwandan market as part of the EXAM-28524/2025 project.

## About the Project

Jean Baby is an online marketplace where parents in Rwanda can browse and purchase premium baby products including clothing, feeding essentials, toys, and safety items. Sellers can manage their products and track orders through a dedicated dashboard.

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (Single Page Application)
- **Backend:** Node.js with Express.js
- **Database:** MySQL 8
- **Authentication:** express-session with bcryptjs password hashing
- **Containerization:** Docker and Docker Compose
- **CI/CD:** GitHub Actions

## Features

- Browse products by category with search functionality
- Product detail pages with quantity selection
- Shopping cart with add, remove and update quantity
- Checkout with delivery address and payment method
- Order confirmation with reference number
- Order history and status tracking
- Buyer and Seller role-based access
- Seller dashboard with sales metrics, product and order management
- Fully containerized with Docker for consistent deployment
- Automated testing and deployment via GitHub Actions pipeline

## Project Structure

```
jeanbaby/
├── server/
│   ├── index.js          # Main server entry point
│   ├── db.js             # Database connection
│   ├── middleware/
│   │   └── auth.js       # Authentication middleware
│   └── routes/
│       ├── auth.js       # Login and registration
│       ├── products.js   # Product browsing
│       ├── cart.js       # Cart management
│       ├── orders.js     # Order placement and history
│       └── seller.js     # Seller dashboard
├── public/
│   ├── index.html        # Main HTML page
│   ├── css/style.css     # Stylesheet
│   └── js/app.js         # Frontend logic
├── db/
│   └── schema.sql        # Database schema and seed data
├── .github/workflows/
│   └── ci-cd.yml         # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## How to Run

Make sure Docker Desktop is installed and running, then:

```bash
git clone https://github.com/FEEGGOO/jeanbaby.git
cd jeanbaby
docker compose up -d
```

Open your browser and go to: **http://localhost:3000**

## Live Application

**URL:** https://jeanbaby-production.up.railway.app

## Database

The database is automatically created when you run Docker Compose. The schema file at `db/schema.sql` creates all the necessary tables and inserts sample products and categories.

## CI/CD Pipeline

The GitHub Actions pipeline runs automatically on every push to the main branch. It performs syntax checking, builds the Docker image, runs an integration test by spinning up the full stack, and deploys to the production server.

## Author

**FEEGGOO** — EXAM-28524/2025
