# InvoiceFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
A comprehensive invoice and inventory management system built with Next.js, featuring user authentication, billing, inventory tracking, expense management, and detailed reporting.

👉 **Live Demo:** [Your Vercel URL]  
👉 **Repo:** https://github.com/Akash8585/invoice-flow

---

## 🚀 Features

### 📊 **Dashboard & Analytics**
- **Financial Metrics**: Total Revenue, Cost of Stock Sold, Net Profit
- **Date Filtering**: Today, This Week, This Month, Custom Date Range, Till Now
- **Recent Transactions**: Real-time billing and inventory updates
- **Interactive Charts**: Visual data representation

### 👥 **User Management**
- **Authentication**: Email/password, Google OAuth, GitHub OAuth
- **User Profiles**: Avatar, name, email display in sidebar
- **Session Management**: Secure login/logout functionality

### 💼 **Client Management**
- **Client Database**: Store client information, contact details, addresses
- **Client Search**: Filter and search through client records
- **Client History**: Track all transactions per client

### 📦 **Inventory Management**
- **Stock Tracking**: Real-time inventory levels and availability
- **Purchase Bills**: Create purchase orders with multiple items
- **Batch Management**: Track items by batch numbers and expiry dates
- **Cost Tracking**: Monitor cost price vs selling price
- **Location Management**: Organize inventory by storage locations

### 🧾 **Billing & Invoicing**
- **Invoice Creation**: Generate professional invoices with custom templates
- **PDF Generation**: Download invoices as PDF files
- **Item Management**: Add multiple items with quantities and prices
- **Extra Charges**: Include shipping, taxes, and other fees
- **Status Tracking**: Mark invoices as paid, pending, or overdue
- **Edit & Update**: Modify existing invoices and bills

### 💰 **Expense Management**
- **Expense Tracking**: Record and categorize business expenses
- **Purchase Integration**: Automatic expense creation from purchase bills
- **Expense Reports**: Filter and analyze spending patterns
- **Manual Entry**: Add custom expenses with descriptions

### 📈 **Reports & Analytics**
- **Financial Reports**: Revenue, profit, and expense analysis
- **Inventory Reports**: Stock levels, low stock alerts, value tracking
- **Client Reports**: Customer transaction history and patterns
- **Date Range Filtering**: Customizable reporting periods

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Theme switching capability
- **Shadcn UI**: Beautiful, accessible React components
- **Interactive Elements**: Hover effects, dropdowns, and modals

---

## 📦 Tech Stack

| Layer             | Technology                    |
| ----------------- | ----------------------------- |
| **Framework**     | Next.js 15 (App Router)       |
| **Language**      | TypeScript                    |
| **Runtime**       | Bun                           |
| **Database**      | PostgreSQL (NeonDB)           |
| **ORM**           | Drizzle ORM                   |
| **Authentication**| Better Auth                   |
| **UI Components** | Shadcn UI + Tailwind CSS      |
| **Forms**         | React Hook Form + Zod         |
| **State Management**| Zustand + TanStack Query    |
| **PDF Generation**| jsPDF + jspdf-autotable       |
| **Charts**        | Recharts                      |
| **Notifications** | Sonner                        |

---

## 🔧 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Akash8585/invoice-flow.git
cd invoice-flow
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="your_neon_db_url"

# Authentication (Better Auth)
AUTH_SECRET="your_auth_secret_key"

# Email (for password reset)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your_email@gmail.com"
EMAIL_SERVER_PASSWORD="your_app_password"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 3. Database Setup

```bash
# Generate migrations
bunx drizzle-kit generate

# Apply migrations to database
bunx drizzle-kit migrate

# Or push schema directly (for development)
bunx drizzle-kit push
```

### 4. Development

```bash
bun dev
```

Open http://localhost:3000 in your browser.

---

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── billing/           # Billing pages
│   ├── inventory/         # Inventory pages
│   ├── clients/           # Client management
│   ├── items/             # Item catalog
│   ├── suppliers/         # Supplier management
│   ├── expenses/          # Expense tracking
│   └── reports/           # Analytics & reports
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── billing/          # Billing components
│   ├── inventory/        # Inventory components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── auth/             # Authentication utilities
│   ├── schemas.ts        # Zod schemas
│   ├── utils.ts          # Helper functions
│   └── invoice-pdf.ts    # PDF generation
├── db/                   # Database configuration
│   ├── index.ts          # Database connection
│   └── schema.ts         # Drizzle schemas
├── hooks/                # Custom React hooks
└── stores/               # Zustand state stores
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Build Settings**: 
   - Framework Preset: Next.js
   - Build Command: `bun run build`
   - Output Directory: `.next`
4. **Deploy**: Vercel will automatically deploy on push to main branch

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

```env
DATABASE_URL=your_production_db_url
AUTH_SECRET=your_production_auth_secret
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## 🔐 Authentication Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.vercel.app/api/auth/callback/google` (production)

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.vercel.app/api/auth/callback/github` (production)

---

## 📝 Available Scripts

```bash
# Development
bun dev              # Start development server

# Building
bun run build        # Build for production
bun run start        # Start production server

# Database
bunx drizzle-kit generate    # Generate migrations
bunx drizzle-kit migrate     # Apply migrations
bunx drizzle-kit push        # Push schema changes
bunx drizzle-kit studio      # Open database studio

# Linting
bun run lint         # Run ESLint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Better Auth](https://better-auth.com/) for authentication
- [Drizzle ORM](https://orm.drizzle.team/) for database management
- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Next.js](https://nextjs.org/) for the React framework
- [Bun](https://bun.sh/) for the JavaScript runtime






