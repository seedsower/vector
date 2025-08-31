# Overview

Vector Protocol is a web-based commodities trading platform that enables users to trade various commodities including precious metals, energy, agriculture, and industrial metals. The application provides real-time market data, order management, position tracking, and portfolio management functionality through a modern trading interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable interfaces
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting dark mode
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live price feeds and order updates

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development Server**: Development mode uses Vite's middleware for HMR and static file serving
- **WebSocket**: Native WebSocket server for real-time communication
- **Session Management**: Express sessions with PostgreSQL session storage
- **Data Validation**: Zod schemas for runtime type checking and validation

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Store**: PostgreSQL-backed session storage using connect-pg-simple
- **Data Models**: Comprehensive schema covering users, markets, orders, positions, trades, and portfolio data

## Trading System Design
- **Market Data**: Support for spot and perpetual markets across multiple commodity categories
- **Order Types**: Market and limit orders with real-time order book simulation
- **Position Management**: Long/short positions with leverage support and liquidation calculations
- **Risk Management**: Built-in margin calculations and position sizing controls
- **Price Simulation**: Mock price feeds with realistic market movements for demonstration

## Real-time Features
- **Price Updates**: WebSocket-based price streaming with configurable update intervals
- **Order Updates**: Live order status changes and execution notifications
- **Market Data**: Real-time order book updates and trade history
- **Connection Management**: Automatic reconnection with exponential backoff strategy

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database hosting (@neondatabase/serverless)
- **Connection**: Environment-based DATABASE_URL configuration

## UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives for all interactive components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter and JetBrains Mono fonts for typography

## Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Cartographer**: Replit-specific development tooling
- **Runtime Error Overlay**: Enhanced error reporting in development

## Data Management
- **Drizzle ORM**: Type-safe PostgreSQL ORM with automatic type generation
- **Drizzle Zod**: Integration between Drizzle schemas and Zod validation
- **TanStack Query**: Server state management with caching and synchronization

## Utility Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **React Hook Form**: Form state management with validation
- **Class Variance Authority**: Type-safe CSS class composition
- **Nanoid**: Unique ID generation for various entities