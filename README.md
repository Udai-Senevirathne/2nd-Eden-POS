# 🍽️ 2nd Eden POS System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)
![Electron](https://img.shields.io/badge/Electron-33.2.1-47848F?logo=electron)

**A modern, feature-rich Point of Sale system built with React, TypeScript, and Electron**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🛒 **Sales Management**
- **Real-time Order Processing** - Fast and efficient order creation and management
- **Smart Cart System** - Dynamic cart with quantity adjustments and item modifications
- **Multiple Payment Methods** - Support for cash, card, and digital payments
- **Service Charge Configuration** - Flexible service charge settings per transaction

### 📊 **Business Intelligence**
- **Sales Reports** - Comprehensive daily, weekly, and monthly sales analytics
- **Revenue Tracking** - Real-time revenue monitoring and insights
- **Order History** - Complete transaction history with search and filter capabilities
- **Refund Management** - Quick and efficient refund processing with detailed tracking

### 🍴 **Menu Management**
- **Dynamic Menu System** - Easy-to-manage menu with categories and subcategories
- **Item Customization** - Add, edit, and delete menu items with images and descriptions
- **Category Organization** - Organize items by categories for quick access
- **Price Management** - Flexible pricing with support for variants and modifiers

### 👥 **User Management & Security**
- **Role-Based Access Control (RBAC)** - Secure access with admin and staff roles
- **Permission System** - Granular permissions for different operations
- **Staff Authentication** - Secure login system for staff members
- **Admin Panel** - Comprehensive admin dashboard for system management

### 🧾 **Receipt & Printing**
- **Professional Receipts** - Beautifully formatted receipts with business details
- **Multiple Print Options** - Support for thermal and standard printers
- **PDF Export** - Generate PDF receipts for digital storage
- **Receipt Preview** - Preview before printing

### 🔄 **Real-time Synchronization**
- **Supabase Integration** - Cloud-based database with real-time sync
- **Multi-device Support** - Access from multiple devices simultaneously
- **Offline Mode** - Continue working during network interruptions
- **Auto-sync** - Automatic data synchronization when connection is restored

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase Account** (for database)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Udai-Senevirathne/2nd-Eden-POS.git
   cd 2nd-Eden-POS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL scripts in the `database/` folder:
   ```bash
   # Execute schema.sql in your Supabase SQL editor
   # Then run create_settings_table.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 🎯 Usage

### For Development
```bash
# Run web version
npm run dev

# Run Electron app in development
npm run electron-dev

# Build for production
npm run build
```

### Building Desktop App
```bash
# Build for Windows
npm run dist-win

# Build for macOS
npm run dist-mac

# Build for Linux
npm run dist-linux
```

### Default Credentials
- **Admin Access**: Configure in Supabase dashboard
- **Staff Access**: Create via Admin Panel

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Vite** - Lightning-fast build tool

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & authorization
  - Row Level Security (RLS)

### Desktop
- **Electron 33.2.1** - Cross-platform desktop apps
- **Electron Builder** - Application packaging

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript Compiler** - Type checking

---

## 📁 Project Structure

```
2nd-Eden-POS/
├── src/
│   ├── components/       # React components
│   │   ├── AdminPanel.tsx
│   │   ├── MenuManagement.tsx
│   │   ├── OrderHistory.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── RefundManagement.tsx
│   │   ├── SalesReports.tsx
│   │   └── ...
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic & API calls
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main application component
├── database/            # SQL scripts
├── scripts/            # Utility scripts
├── electron.js         # Electron main process
└── public/             # Static assets
```

---

## 🔐 Security Features

- **Supabase Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based authentication
- **Role-based Permissions** - Granular access control
- **Secure API Keys** - Environment-based configuration
- **Data Encryption** - Encrypted data transmission

---

## 📝 Key Features in Detail

### Sales Processing
- Quick order creation with category navigation
- Real-time cart updates
- Multiple payment method support
- Automatic receipt generation
- Order confirmation system

### Reporting
- Daily sales summaries
- Revenue analytics
- Top-selling items
- Payment method breakdown
- Custom date range reports

### Refund System
- Quick refund processing
- Partial and full refund support
- Refund history tracking
- Admin approval workflow
- Automatic inventory updates

### Settings Management
- Business information configuration
- Service charge settings
- Receipt customization
- Printer configuration
- Tax settings

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Udai Senevirathne**

- GitHub: [@Udai-Senevirathne](https://github.com/Udai-Senevirathne)
- Repository: [2nd-Eden-POS](https://github.com/Udai-Senevirathne/2nd-Eden-POS)

---

## 🙏 Acknowledgments

- Built with ❤️ using React and Electron
- Database powered by Supabase
- Icons by Lucide React
- UI styled with Tailwind CSS

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ☕ and 💻

</div>
