# HDU Final Project

This project consists of a client (React) and server (Node.js/Express) application.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MySQL database (for the server)

## Quick Start

### Option 1: Using Setup Scripts (Recommended)

1. **Install all dependencies:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start both client and server:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### Option 2: Using npm Scripts

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both client and server in development mode:**
   ```bash
   npm run dev
   ```

### Option 3: Manual Setup

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Start services:**
   - Start server: `cd server && npm run dev`
   - Start client (in another terminal): `cd client && npm run dev`

## Available Scripts

### Root Level Scripts

- `npm run install:all` - Install dependencies for root, client, and server
- `npm run install:client` - Install only client dependencies
- `npm run install:server` - Install only server dependencies
- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only client in development mode
- `npm run dev:server` - Start only server in development mode
- `npm run start` - Start both client and server in production mode
- `npm run start:client` - Start only client in production mode
- `npm run start:server` - Start only server in production mode
- `npm run build` - Build the client for production

### Client Scripts (from client directory)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server Scripts (from server directory)

- `npm run dev` - Start server with nodemon (auto-restart)
- `npm start` - Start server with node
- `npm run init-db` - Initialize database

## Environment Setup

### Server Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Client Environment Variables

Create a `.env` file in the `client` directory with the following variable:

```env
VITE_API_URL=http://localhost:5000
```

**Important**: 
- The client uses this environment variable to connect to the backend API
- If your server runs on a different port, update `VITE_API_URL` accordingly
- If you change the `.env` file, **restart the Vite dev server** for changes to take effect
- The client typically runs on `http://localhost:5173` (Vite default port)

## Project Structure

```
.
├── client/          # React frontend application
├── server/          # Node.js/Express backend application
├── setup.sh         # Setup script to install all dependencies
├── start.sh         # Start script to run both services
└── package.json     # Root package.json with convenience scripts
```

## Development

- **Client**: Runs on `http://localhost:5173` (Vite default)
- **Server**: Runs on `http://localhost:5000` (configurable via .env)

Both services will reload automatically when you make changes to the code.

## Troubleshooting

1. **Port already in use**: Change the PORT in server/.env or kill the process using the port
2. **Database connection errors**: Verify your MySQL credentials in server/.env
3. **API calls showing "undefined" in URL**: Make sure `client/.env` file exists with `VITE_API_URL=http://localhost:5000` and restart the Vite dev server
4. **Dependencies not installing**: Try deleting `node_modules` and `package-lock.json` files and running `npm install` again
5. **Permission denied on scripts**: Run `chmod +x setup.sh start.sh` to make scripts executable

## License

ISC

