# Jean Baby

An e-commerce web application for buying and selling baby products online, built for the Rwandan market.

## About the Project

Jean Baby is an online marketplace where parents in Rwanda can browse and purchase premium baby products including clothing, feeding essentials, toys, and safety items. Sellers can manage their products and track orders through a dedicated dashboard. The platform supports online payments through PesaPal as well as cash on delivery.

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (Single Page Application)
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL
- **Authentication:** express-session with bcryptjs password hashing
- **Payments:** PesaPal API 3.0 (card and mobile money)
- **Containerization:** Docker and Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Render.com

## Features

- Browse products by category with search functionality
- Product detail pages with quantity selection
- Shopping cart with add, remove and update quantity
- Checkout with delivery address and payment method
- Two payment options: Cash on Delivery and Pay Online via PesaPal
- Order confirmation with reference number
- Order history and status tracking
- Buyer and Seller role-based access
- Seller dashboard with sales metrics, product and order management
- Mobile-first responsive design with bottom navigation
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
│       ├── seller.js     # Seller dashboard
│       ├── payment.js    # PesaPal payment integration
│       └── setup.js      # Database setup and seeding
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

## How to Run Locally

Make sure Docker Desktop is installed and running, then:

```bash
git clone https://github.com/FEEGGOO/jeanbaby.git
cd jeanbaby
docker compose up -d
```

Open your browser and go to: **http://localhost:3000**

## Live Application

**URL:** https://jeanbaby.onrender.com

## Environment Variables

The application uses the following environment variables (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — secret key for session encryption
- `APP_URL` — the public URL of the deployed app
- `PESAPAL_CONSUMER_KEY` — PesaPal API consumer key
- `PESAPAL_CONSUMER_SECRET` — PesaPal API consumer secret

## Database

The database schema is defined in `db/schema.sql`, which creates all the necessary tables and inserts sample products and categories. When running locally with Docker Compose, the database is created automatically. On the live deployment, visiting the `/setup` route initializes and seeds the database.

The schema includes six tables: users, categories, products, cart_items, orders, and order_items.

## Payment Integration

Checkout offers two payment methods. Cash on Delivery records the order for payment on arrival. Pay Online via PesaPal redirects the customer to PesaPal's secure payment page, where they can complete payment by card or mobile money. After payment, PesaPal notifies the application and the order status is updated automatically.

## CI/CD Pipeline

The GitHub Actions pipeline runs automatically on every push to the main branch. It performs syntax checking, builds the Docker image, runs an integration test by spinning up the full stack, and triggers the production deployment.

## Demo Accounts

- **Buyer:** buyer@jeanbaby.rw
- **Seller:** seller@jeanbaby.rw

## Author

FEEGGOO
