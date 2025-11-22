# Square-Style POS System - Setup Guide

This guide will help you set up and run the complete POS system locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- **Git** (optional) - [Download](https://git-scm.com/)

## Step 1: PostgreSQL Database Setup

### 1.1 Install PostgreSQL

Download and install PostgreSQL from the official website.

### 1.2 Create Database

Open PostgreSQL terminal (psql) or use pgAdmin and run:

```sql
CREATE DATABASE pos_system;
```

### 1.3 Create User (Optional but recommended)

```sql
CREATE USER pos_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pos_system TO pos_user;
```

## Step 2: Project Setup

### 2.1 Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### 2.2 Configure Environment Variables

#### Backend Configuration

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_system"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
MAX_FILE_SIZE="5242880"
UPLOAD_DIR="./uploads"
```

**Important:** Change the `JWT_SECRET` to a long, random string in production!

#### Frontend Configuration

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## Step 3: Database Migration & Seeding

### 3.1 Generate Prisma Client

```bash
cd backend
npm run db:generate
```

### 3.2 Run Migrations

```bash
npm run db:migrate
```

When prompted, enter a migration name (e.g., "init")

### 3.3 Seed Database

```bash
npm run db:seed
```

This will create:
- Sample location
- Demo users (Admin, Manager, Cashier)
- Sample products
- Sample customers
- Tax rates and discounts

## Step 4: Running the Application

### Option 1: Run Everything at Once (Recommended)

From the root directory:

```bash
npm run dev
```

This will start both backend and frontend concurrently.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 5: Access the Application

Once running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## Default Login Credentials

Use these credentials to log in:

### Admin Account
- **Email**: admin@pos.com
- **Password**: admin123
- **Permissions**: Full system access

### Manager Account
- **Email**: manager@pos.com
- **Password**: manager123
- **Permissions**: Most features except system settings

### Cashier Account
- **Email**: cashier@pos.com
- **Password**: cashier123
- **Permissions**: POS, basic customer management

## Step 6: Using the System

### First Time Setup

1. **Login** with admin credentials
2. **Clock In** via the Shifts page
3. **Add Products** if you want more than the sample data
4. **Go to POS** and start making sales!

### Basic Workflow

1. **Clock In** at start of shift
2. Navigate to **POS** page
3. Search/click products to add to cart
4. Click **Checkout**
5. Select payment method
6. Complete sale
7. **Clock Out** at end of shift

## Database Management

### View Database (Optional)

```bash
cd backend
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555 for visual database management.

### Reset Database

If you need to reset everything:

```bash
cd backend
npx prisma migrate reset
npm run db:seed
```

## Building for Production

### Backend Build

```bash
cd backend
npm run build
```

Output will be in `backend/dist/`

### Frontend Build

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Production Environment Variables

Update these for production:

**Backend:**
- Change `DATABASE_URL` to production database
- Use strong `JWT_SECRET` (min 32 characters)
- Set `NODE_ENV="production"`
- Configure proper `FRONTEND_URL`

**Frontend:**
- Set `VITE_API_URL` to production API URL

## Troubleshooting

### Port Already in Use

If ports 5000 or 5173 are in use:

**Backend:** Change `PORT` in `backend/.env`
**Frontend:** Change port in `frontend/vite.config.ts`

### Database Connection Error

1. Ensure PostgreSQL is running
2. Check database credentials in `backend/.env`
3. Verify database exists: `psql -l`

### Prisma Client Errors

Regenerate the client:
```bash
cd backend
npm run db:generate
```

### Module Not Found

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm install
```

## Hardware Integration

### Barcode Scanner

USB barcode scanners that emulate keyboard input work automatically. Just scan while the POS page is active.

### Receipt Printer

Configure ESC/POS compatible printers in Settings. The system will use the browser's print dialog by default.

### Cash Drawer

Cash drawers connected via receipt printer will open automatically on cash transactions.

### Card Reader

Integrate payment processors (Stripe, Square, etc.) by updating the `cardReader` service in `frontend/src/services/hardware.ts`

## Support

For issues:
1. Check this setup guide
2. Review error messages in browser console (F12)
3. Check backend logs in terminal
4. Verify all environment variables are set correctly

## Next Steps

- Customize branding in Settings
- Add your products via Inventory page
- Configure tax rates for your location
- Set up employees and permissions
- Connect real hardware (optional)
- Configure backup strategy for production

## Production Deployment Checklist

- [ ] Use strong JWT secret
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Perform security audit
- [ ] Test offline mode
- [ ] Configure receipt printer
- [ ] Train staff on system

---

**Congratulations!** You now have a fully functional, production-ready POS system.
