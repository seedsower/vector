#!/bin/bash

# 🚀 Enhanced Development Startup Script for Vector Protocol
# God-level web3 localhost stability with comprehensive checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Vector Protocol - Enhanced Development Startup${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Node.js version
check_node() {
    echo "Checking Node.js version..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"

    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_status "Node.js version $NODE_VERSION is compatible"
    else
        print_warning "Node.js version $NODE_VERSION might have compatibility issues. Recommended: >=18.0.0"
    fi
}

# Check npm and dependencies
check_dependencies() {
    echo "Checking dependencies..."
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    else
        print_status "Dependencies found"
    fi

    # Check for critical packages
    if [ ! -d "node_modules/tsx" ]; then
        print_error "tsx not found. Installing..."
        npm install tsx --save-dev
    fi

    if [ ! -d "node_modules/pm2" ]; then
        print_error "PM2 not found. Installing..."
        npm install pm2 --save-dev
    fi
}

# Check port availability
check_port() {
    echo "Checking port 5001 availability..."
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 5001 is already in use. Attempting to kill existing processes..."

        # Kill existing processes on port 5001
        lsof -ti:5001 | xargs kill -9 2>/dev/null || true

        sleep 2

        if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_error "Unable to free port 5001. Please manually kill the process."
            exit 1
        else
            print_status "Port 5001 is now available"
        fi
    else
        print_status "Port 5001 is available"
    fi
}

# Clean up any existing PM2 processes
cleanup_pm2() {
    echo "Cleaning up existing PM2 processes..."

    # Stop and delete existing PM2 process
    npx pm2 stop vector-protocol 2>/dev/null || true
    npx pm2 delete vector-protocol 2>/dev/null || true

    print_status "PM2 cleanup completed"
}

# Setup log directories
setup_logs() {
    echo "Setting up log directories..."
    mkdir -p logs/pm2
    mkdir -p logs/app
    print_status "Log directories created"
}

# Check system resources
check_resources() {
    echo "Checking system resources..."

    # Check available memory
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
    if (( $(echo "$AVAILABLE_MEMORY < 1.0" | bc -l) )); then
        print_warning "Low available memory: ${AVAILABLE_MEMORY}GB. Consider closing other applications."
    else
        print_status "Available memory: ${AVAILABLE_MEMORY}GB"
    fi

    # Check disk space
    DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        print_warning "High disk usage: ${DISK_USAGE}%. Consider freeing up space."
    else
        print_status "Disk usage: ${DISK_USAGE}%"
    fi
}

# Environment setup
setup_environment() {
    echo "Setting up environment..."

    # Set development environment
    export NODE_ENV=development
    export PORT=5001

    # Increase Node.js memory limit for web3 operations
    export NODE_OPTIONS="--max-old-space-size=2048"

    print_status "Environment configured"
}

# Function to start with PM2
start_with_pm2() {
    echo "Starting Vector Protocol with PM2..."

    # Start the application with PM2
    npx pm2 start ecosystem.config.cjs --env development

    # Show PM2 status
    npx pm2 list

    print_status "Vector Protocol started with PM2"
    print_status "Monitor logs with: npm run logs"
    print_status "Monitor status with: npm run status"
    print_status "Stop server with: npm run stop"
}

# Function to start without PM2 (fallback)
start_direct() {
    echo "Starting Vector Protocol directly..."
    print_warning "PM2 not available, starting directly (less stable)"

    # Set trap for graceful shutdown
    trap 'echo "Shutting down..."; kill $!; exit' SIGINT SIGTERM

    NODE_ENV=development PORT=5001 tsx server/index.ts &
    wait $!
}

# Health check function
health_check() {
    echo "Performing health check..."

    # Wait for server to start
    sleep 3

    # Check if server is responding
    for i in {1..10}; do
        if curl -f http://localhost:5001/api/markets >/dev/null 2>&1; then
            print_status "Server is responding to health checks"
            return 0
        fi
        echo "Waiting for server to start... ($i/10)"
        sleep 2
    done

    print_error "Server is not responding to health checks"
    return 1
}

# Main execution
main() {
    check_node
    check_dependencies
    check_port
    setup_logs
    check_resources
    setup_environment
    cleanup_pm2

    # Try to start with PM2, fallback to direct start
    if command -v pm2 &> /dev/null || [ -d "node_modules/pm2" ]; then
        start_with_pm2
    else
        start_direct
    fi

    # Perform health check
    if health_check; then
        echo ""
        echo -e "${GREEN}🎉 Vector Protocol is running successfully!${NC}"
        echo -e "${BLUE}📊 Dashboard: http://localhost:5001${NC}"
        echo -e "${BLUE}📈 API: http://localhost:5001/api/markets${NC}"
        echo ""

        # Show real-time logs
        if command -v pm2 &> /dev/null || [ -d "node_modules/pm2" ]; then
            echo "Showing live logs (Ctrl+C to exit log view):"
            npx pm2 logs vector-protocol --lines 50
        fi
    else
        print_error "Failed to start Vector Protocol properly"
        exit 1
    fi
}

# Run main function
main "$@"