# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Management System - React + Supabase

A modern, full-featured management system built with React, TypeScript, and Supabase, recreating and improving upon a Laravel-based system.

## ✨ Features

### 🎯 Core Management Features
- **Order Management System**: Complete workflow for Orders, Quotes, Issue/Return/Payment/Receipt slips
- **Product & Inventory Management**: Real-time stock tracking with complex product specifications
- **Client & Company Management**: Multi-company support with comprehensive client database
- **Financial Management**: Payment processing, check management, expenses, and bank accounts
- **Reporting & Analytics**: Advanced reporting with PDF export capabilities

### 🚀 Modern Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Framework**: Material-UI with modern design
- **State Management**: React Query for server state
- **Forms**: React Hook Form with validation
- **PDF Generation**: react-pdf for documents
- **Styling**: CSS-in-JS with Material-UI theming

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd new_react_gestion
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🐳 Docker Deployment

The application includes Docker support for both development and production deployment.

### Prerequisites
- Docker and Docker Compose installed

### Quick Start with Docker Compose

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd react-supabase-management-system
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - API: http://localhost:3001
   - Database: localhost:3306

### Docker Services

- **frontend**: React application served by Nginx (port 80)
- **api**: Node.js Express API server (port 3001)
- **db**: MySQL 8.0 database with persistent storage

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Environment Configuration

The Docker setup includes:
- MySQL database with initial schema and migrations
- API configured to connect to the database container
- Frontend configured to proxy API requests

For production deployment, update the JWT secret and database credentials in `docker-compose.yml`.

### 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── Layout.tsx      # Main layout component
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Orders.tsx      # Order management
│   ├── Products.tsx    # Product management
│   ├── Clients.tsx     # Client management
│   ├── Companies.tsx   # Company management
│   ├── Payments.tsx    # Payment management
│   ├── Reports.tsx     # Reports & analytics
│   └── Login.tsx       # Authentication
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── lib/                # Configuration files
│   └── supabase.ts     # Supabase client
└── config/             # App configuration
```

## 🔐 Authentication

The system uses Supabase Auth for user authentication with:
- Email/password authentication
- Protected routes
- Role-based access control
- Session management

## 📊 Database Schema

The application uses the following main entities:
- **Companies**: Multi-tenant company management
- **Clients**: Customer database
- **Products**: Inventory with complex specifications
- **Orders**: All order types (Orders, Quotes, Slips)
- **Order Items**: Line items with product details
- **Payments**: Payment tracking with multiple methods
- **Drivers**: Delivery personnel management
- **Expenses**: Financial expense tracking

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern Interface**: Clean, intuitive Material-UI components
- **Dark/Light Mode**: Automatic theme switching
- **Real-time Updates**: Live data synchronization with Supabase
- **Fast Performance**: Optimized with React Query and code splitting

## 📋 Implementation Status

### ✅ Completed Features
- [x] Project setup with Vite + React + TypeScript
- [x] Authentication system with Supabase Auth
- [x] Main layout and navigation with Material-UI
- [x] **Supabase database schema** - Complete Laravel parity
- [x] **Companies Management** - Full CRUD with validation
- [x] **Advanced Search & Filtering** - Server-side with pagination
- [x] **Validation System** - Comprehensive Yup schemas
- [x] **Permission & Role System** - Role-based access control
- [x] **Financial Management** - Payments, cheques, expenses
- [x] **Reporting & Analytics** - Dashboard with PDF export
- [x] **DataTable Component** - Reusable with search integration
- [x] Modern UI design with Material-UI v7
- [x] TypeScript definitions for all entities

### 🚧 Ready for Extension
- [x] Order management (basic structure ready)
- [x] Product management (schema complete) 
- [x] Client management (service layer ready)
- [x] User management (with role integration)
- [x] Issue/Return/Payment/Receipt slips (implemented)
- [x] Driver management system
- [x] Cash desk operations

## 🔄 Migration from Laravel

This system recreates all functionality from the original Laravel application:

| Laravel Feature | React + Supabase Implementation |
|----------------|--------------------------------|
| Eloquent Models | Supabase TypeScript types |
| Blade Templates | React Components |
| Laravel Auth | Supabase Auth |
| MySQL Database | PostgreSQL (Supabase) |
| PHP Controllers | React Query + API functions |
| Laravel PDF | react-pdf |
| Artisan Commands | Custom utilities |

## 🚀 Getting Started

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

2. **Set up Supabase database** (next step):
   - Create tables based on the schema in `src/types/database.types.ts`
   - Set up Row Level Security (RLS) policies
   - Configure authentication settings

3. **Begin implementation**:
   - Start with Order Management system
   - Implement CRUD operations for each entity
   - Add PDF generation capabilities
   - Build reporting features

## 📝 License

This project is proprietary and confidential.

---

**Next Steps**: Set up Supabase database schema and begin implementing the Order Management system.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
