# Square-Style POS System

A complete, production-ready Point of Sale system built with modern technologies, replicating Square POS functionality.

## Features

### Core Functionality
- **Multi-role Authentication**: Admin, Manager, Cashier with granular permissions
- **Smart Inventory Management**: Products, variants, SKUs, low-stock alerts, supplier management
- **Advanced Sales Register**: Fast checkout, discounts, taxes, refunds, multiple payment methods
- **Comprehensive Reporting**: Sales analytics, employee performance, inventory reports, profit tracking
- **Customer Management**: Customer directory, loyalty points, purchase history
- **Employee Management**: Time tracking, shift management, activity logs
- **Multi-store Support**: Manage multiple locations from one system
- **Hardware Integration**: Barcode scanners, receipt printers, cash drawers, card readers

### Advanced Features
- **Offline Mode**: Continue operations without internet connectivity
- **Hold & Retrieve Orders**: Save incomplete transactions
- **Custom Receipt Builder**: Design your own receipt templates
- **Inventory Audit Logs**: Complete tracking of all inventory changes
- **Shift Reports**: Detailed cash management and drawer reconciliation
- **Export Capabilities**: CSV/PDF export for all reports

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for blazing-fast builds
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Recharts for analytics visualization

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Zod validation

## Project Structure

```
/frontend          # React frontend application
  /src
    /components    # Reusable UI components
    /pages         # Page components
    /hooks         # Custom React hooks
    /services      # API service layer
    /store         # State management
    /types         # TypeScript types
    /utils         # Utility functions
    /lib           # Library configurations

/backend           # Express backend API
  /src
    /controllers   # Request handlers
    /routes        # API routes
    /services      # Business logic
    /middleware    # Express middleware
    /utils         # Utility functions
    /config        # Configuration files
    /types         # TypeScript types
    /validators    # Request validators
  /prisma          # Database schema and migrations

/shared            # Shared types between frontend and backend
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**Backend (.env in /backend):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pos_system"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
```

**Frontend (.env in /frontend):**
```env
VITE_API_URL=http://localhost:5000/api
```

4. Set up the database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start the development servers:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`
The backend will run on `http://localhost:5000`

### Default Login Credentials

**Admin:**
- Email: admin@pos.com
- Password: admin123

**Manager:**
- Email: manager@pos.com
- Password: manager123

**Cashier:**
- Email: cashier@pos.com
- Password: cashier123

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/refund` - Refund sale
- `POST /api/sales/:id/void` - Void sale

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/history` - Purchase history

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/employees` - Employee reports
- `GET /api/reports/dashboard` - Dashboard metrics

### Shifts
- `POST /api/shifts/clock-in` - Clock in
- `POST /api/shifts/clock-out` - Clock out
- `GET /api/shifts` - List shifts
- `POST /api/shifts/:id/close` - Close shift

## Hardware Integration

### Barcode Scanner
The system supports standard USB barcode scanners that emulate keyboard input. Simply scan while focused on the product search field.

### Receipt Printer
Configure ESC/POS compatible printers in Settings > Printers. The system supports:
- USB printers
- Network printers (via IP)
- Bluetooth printers

### Cash Drawer
Cash drawers connected to receipt printers will open automatically on cash transactions.

### Card Reader
Integrate with payment processors via the payment gateway configuration in Settings.

## Offline Mode

The POS system includes offline capabilities:
- Sales are queued locally
- Automatic sync when connection restored
- Local product catalog caching
- Offline receipt printing

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection protection via Prisma
- XSS protection
- CORS configuration
- Rate limiting
- Request validation

## Performance Optimizations

- Database query optimization with indexes
- Response caching
- Lazy loading for frontend components
- Image optimization
- Code splitting
- Gzip compression

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Update the environment variables for production:
- Use strong JWT secrets
- Configure production database
- Set NODE_ENV=production
- Enable HTTPS
- Configure CORS for production domains

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: AWS EC2, DigitalOcean, Heroku, or Railway
- **Database**: AWS RDS, DigitalOcean Managed PostgreSQL

## Contributing

This is a production-ready system built with best practices:
- TypeScript for type safety
- Comprehensive error handling
- Input validation
- Logging and monitoring
- Database migrations
- Seed data for testing

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on the repository.
