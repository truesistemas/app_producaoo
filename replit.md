# ControleProd - Sistema de Controle de Produção

## Overview

ControleProd is a modern production control system for plastic injection molding machines. The system manages employees, machines, matrices (molds), and production sessions in real-time with comprehensive reporting capabilities. Built as a full-stack web application using modern technologies for scalability and maintainability.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and database layers:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL Pg
- **API Design**: RESTful endpoints with structured error handling

### Deployment Strategy
- **Development**: Vite dev server with hot module replacement
- **Production**: Express server serving static React build
- **Build Process**: Separate client and server builds using esbuild

## Key Components

### Database Schema
The system uses PostgreSQL with the following main entities:

1. **Users Table**: Authentication and role management (operator, supervisor, admin)
2. **Employees Table**: Worker profiles with shift assignments and production targets
3. **Machines Table**: Injection molding machines with capacity and status tracking
4. **Matrices Table**: Mold definitions with piece specifications
5. **Production Sessions**: Real-time tracking of manufacturing sessions
6. **Production Pauses**: Detailed pause tracking with reasons and duration
7. **Employee Machine Relationships**: Many-to-many assignments

### Frontend Structure
- **Pages**: Dashboard, Employees, Machines, Matrices, Production, Reports
- **Components**: Reusable UI components following atomic design principles
- **Layout**: Responsive design with desktop sidebar and mobile bottom navigation
- **State Management**: Server state via React Query, local state via React hooks

### Backend API Structure
- **Modular Routes**: Organized by entity type (employees, machines, matrices, etc.)
- **Type Safety**: Shared TypeScript interfaces between client and server
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware

## Data Flow

### Production Workflow
1. **Session Start**: Employee selects machine and matrix, sets production target
2. **Real-time Tracking**: System monitors active sessions with 30-second refresh intervals
3. **Pause Management**: Temporary halts with reason tracking and automatic resume
4. **Session Completion**: Final piece count and efficiency calculation

### Data Synchronization
- **Real-time Updates**: Automatic polling for active production sessions
- **Optimistic Updates**: Immediate UI updates with server reconciliation
- **Cache Management**: React Query handles data caching and invalidation

## External Dependencies

### Core Dependencies
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast build tool with HMR support
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migration and schema management

### Authentication & Session Management
- **connect-pg-simple**: PostgreSQL session store
- **JWT**: Token-based authentication (configured for future implementation)

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite dev server with React Fast Refresh
- **Database**: PostgreSQL Pg
- **Build Watching**: Automatic TypeScript compilation checking

### Production Build
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: ESBuild bundles Express server to `dist/index.js`
3. **Static Serving**: Express serves built React app and API endpoints
4. **Database Migrations**: Drizzle migrations run on deployment

### Environment Configuration
- **Database URL**: Required PostgreSQL connection string
- **Node Environment**: Development/production mode switching
- **Replit Integration**: Special handling for Replit development environment

The system is designed for easy deployment on platforms like Replit, Vercel, or traditional VPS hosting with PostgreSQL support.