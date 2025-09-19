# Overview

This is a full-stack bank statement generator application built with React (frontend) and Express.js (backend). The application allows users to create account setups, manage transactions, and generate PDF bank statements. Users can manually add transactions or bulk upload them via CSV files. The system provides a complete workflow from data entry to PDF generation with a professional bank statement format.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with structured error handling and request logging
- **Development Server**: Custom Vite integration for hot module replacement in development
- **Build Process**: ESBuild for server-side bundling, Vite for client-side bundling

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Database Connection**: Neon Database serverless PostgreSQL
- **Development Storage**: In-memory storage implementation for development/testing
- **Data Models**: Account setups and transactions with proper foreign key relationships

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: No explicit authentication system implemented - appears to be designed for internal/trusted use

## Key Features
- **Account Setup Management**: Create and manage bank account configurations with all required banking details
- **Transaction Management**: Manual transaction entry and bulk CSV upload functionality
- **CSV Processing**: Custom CSV parser with validation and error handling
- **PDF Generation**: Client-side PDF generation using jsPDF for professional bank statement format
- **Real-time Updates**: Optimistic updates and cache invalidation using TanStack Query
- **Form Validation**: Comprehensive validation using Zod schemas shared between client and server

## Design Patterns
- **Shared Schema**: Common TypeScript types and Zod schemas between frontend and backend
- **Repository Pattern**: Storage abstraction layer supporting both in-memory and database implementations
- **Query Invalidation**: Automatic cache updates after mutations
- **Component Composition**: Reusable UI components with proper separation of concerns
- **Error Boundaries**: Structured error handling with user-friendly toast notifications

# External Dependencies

## Database & Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit and query builder
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI & Design System
- **Shadcn/ui**: Pre-built accessible UI components
- **Radix UI**: Headless UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Plugins**: Development environment integration for Replit platform

## Data Processing & Generation
- **jsPDF**: Client-side PDF generation for bank statements
- **date-fns**: Date manipulation and formatting utilities
- **React Hook Form**: Form state management and validation
- **TanStack Query**: Server state management and caching

## Validation & Type Safety
- **Zod**: Schema validation and TypeScript type inference
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas