# Trippy Admin Frontend

This is the admin portal frontend for the Trippy application, built with React and Vite.

## Features

- **Admin Authentication**: Secure login with admin privilege validation
- **Dashboard**: Overview of key metrics and recent activity
- **User Management**: Manage users, guides, and permissions
- **Experience Management**: Manage tours and experiences
- **Bookings**: View and manage all bookings
- **Transactions**: Monitor financial transactions
- **Dispute Resolution**: Handle user disputes and complaints
- **Settings**: Configure admin portal settings

## Tech Stack

- React 18
- React Router DOM
- Axios for API calls
- Lucide React for icons
- Tailwind CSS for styling
- Vite for build tooling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The admin portal will be available at `http://localhost:5174`

## Default Admin Credentials

- Email: `admin@trippy.com`
- Password: `admin123`

## Project Structure

```
admin_frontend/
├── src/
│   ├── components/          # Reusable components
│   │   └── AdminLayout.jsx  # Main layout with sidebar
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx # Authentication context
│   ├── pages/              # Page components
│   │   ├── AdminLoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── UserManagementPage.jsx
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## API Integration

The admin frontend connects to the same backend as the main application (`http://localhost:8080`). It uses the existing authentication endpoints but validates admin privileges.

## Development Notes

- The admin portal runs on port 5174 to avoid conflicts with the main frontend (5173)
- All admin routes are prefixed with `/admin`
- Authentication tokens are stored with the key `admin_token` to separate from main app tokens
- The sidebar navigation matches the Figma design specifications
