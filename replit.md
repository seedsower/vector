# Overview

Vector Protocol is a comprehensive tokenized commodities decentralized exchange (DEX) on Solana, forking Drift Protocol. The platform supports 40+ commodity assets across precious metals, energy, agriculture, and industrial metals categories, featuring both spot and perpetual trading with advanced risk management, multi-oracle integration, and market maker incentives.

## Recent Updates (August 31, 2025)
- ✅ Implemented full Vector Protocol branding with electric cyan (#00D4FF) and commodity orange (#FF6B00) color scheme
- ✅ Expanded to 40 commodity types across 4 categories (10 assets per category)
- ✅ Added advanced trading features including 8 order types (Market, Limit, Stop, Stop-Limit, Trailing Stop, Iceberg, TWAP, Bracket)
- ✅ Integrated multi-oracle price aggregation system (Pyth, Switchboard, Chainlink, Vector Custom)
- ✅ Implemented comprehensive market maker incentive program with tiered rebates
- ✅ Added advanced analytics dashboard with risk metrics and portfolio management
- ✅ Enhanced WebSocket real-time features for live price feeds and order updates

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
- **Market Data**: Support for spot and perpetual markets across 4 commodity categories with 40+ assets
- **Advanced Order Types**: 8 order types including Market, Limit, Stop, Stop-Limit, Trailing Stop, Iceberg, TWAP, and Bracket orders
- **Position Management**: Long/short positions with up to 20x leverage, automatic liquidation protection
- **Risk Management**: Comprehensive risk controls including stop-loss, take-profit, margin requirements, and health factors
- **Oracle Integration**: Multi-oracle price aggregation with confidence scoring and deviation monitoring
- **Market Maker Program**: Tiered incentive system (Bronze to Diamond) with volume-based rebates and Vector token rewards

## Real-time Features
- **Enhanced Price Updates**: WebSocket-based price streaming with oracle aggregation data and confidence metrics
- **Advanced Order Updates**: Live order status changes, execution notifications, and average fill prices
- **Market Maker Updates**: Real-time rebate calculations, tier status, and leaderboard updates
- **Risk Monitoring**: Live liquidation alerts and health factor monitoring
- **Connection Management**: Automatic reconnection with exponential backoff strategy and connection health indicators

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
- **Drizzle ORM**: Type-safe PostgreSQL ORM with automatic type generation for all 40 commodity types
- **Drizzle Zod**: Integration between Drizzle schemas and Zod validation for trading operations
- **TanStack Query**: Server state management with caching and synchronization for real-time trading data
- **Oracle Aggregation**: Multi-source price data with weighted averaging and confidence scoring
- **Analytics Engine**: Comprehensive analytics covering overview metrics, volume analysis, fee tracking, and risk assessment

## Utility Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **React Hook Form**: Form state management with validation
- **Class Variance Authority**: Type-safe CSS class composition
- **Nanoid**: Unique ID generation for various entities