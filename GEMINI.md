# Gemini Code-Assist Configuration

This file provides guidance for the Gemini code-assist agent to effectively interact with the FavaleTrainerCRMExpress project.

## Project Overview

FavaleTrainerCRMExpress is a comprehensive CRM (Customer Relationship Management) system designed for personal trainers. It includes features for managing leads, scheduling appointments, tracking tasks, and communicating with clients via WhatsApp. The application is built with a modern web stack, featuring a React frontend and a Node.js backend.

## Technologies

- **Frontend:**
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Material-UI (based on `components.json`)
- **Backend:**
  - Node.js
  - Express.js
  - TypeScript
  - Drizzle ORM
- **Database:**
  - SQL (assumed, based on Drizzle usage)
- **Authentication:**
  - JWT (JSON Web Tokens)
- **Integrations:**
  - Google Calendar API
  - OpenAI API
  - WhatsApp
- **Development:**
  - Docker
  - Node.js (with npm)

## Project Structure

The project is organized into two main directories: `client` and `server`.

- **`client/`**: Contains the frontend React application.
  - `client/src/components/`: Reusable React components.
  - `client/src/pages/`: Top-level page components.
  - `client/src/services/`: Modules for interacting with backend APIs.
- **`server/`**: Contains the backend Node.js/Express application.
  - `server/src/controllers/`: Request handlers for different API routes.
  - `server/src/routes/`: API route definitions.
  - `server/src/middlewares/`: Custom middleware for authentication, error handling, etc.
  - `server/src/db/`: Database connection and schema definitions.

## Getting Started

### Prerequisites

- Node.js and npm
- Docker (optional, for containerized deployment)

### Installation

1.  Install server dependencies:
    ```bash
    npm install
    ```

### Running the Application

- **Development:**
  - Start the backend server:
    ```bash
    npm run dev
    ```
- **Production:**
  - Build the frontend application:
    ```bash
    npm run build
    ```
  - Start the production server:
    ```bash
    npm start
    ```

## Key Files

- **`client/src/App.tsx`**: The main component of the React application.
- **`server/index.ts`**: The entry point for the backend server.
- **`server/routes.ts`**: Defines the main API routes.
- **`server/schema.ts`**: Contains the database schema definitions (Drizzle).
- **`package.json`**: Lists project dependencies and scripts.
- **`vite.config.ts`**: Vite configuration for the frontend.
- **`drizzle.config.ts`**: Drizzle ORM configuration.
- **`Dockerfile`**: Defines the Docker image for deployment.
