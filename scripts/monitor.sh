#!/bin/bash

# 🚀 Vector Protocol Monitoring Script
# God-level web3 localhost monitoring with comprehensive health checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
HEALTH_URL="http://localhost:5000/health"
CHECK_INTERVAL=30
LOG_FILE="logs/monitoring.log"

# Create log directory
mkdir -p logs

# Function to print status with timestamp
print_status() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

print_info() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${BLUE}ℹ${NC} $1" | tee -a "$LOG_FILE"
}

# Check if server is running
check_server_status() {
    if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Get detailed health status
get_health_status() {
    local health_response
    health_response=$(curl -s "$HEALTH_URL" 2>/dev/null)

    if [ $? -eq 0 ]; then
        local status
        status=$(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

        case "$status" in
            "healthy")
                print_status "Server is healthy"
                ;;
            "degraded")
                print_warning "Server is degraded"
                echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
                ;;
            "unhealthy")
                print_error "Server is unhealthy"
                echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
                ;;
            *)
                print_warning "Unknown health status: $status"
                ;;
        esac
    else
        print_error "Failed to get health status"
        return 1
    fi
}

# Check PM2 status
check_pm2_status() {
    if command -v pm2 &> /dev/null || [ -d "node_modules/pm2" ]; then
        local pm2_status
        pm2_status=$(npx pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="vector-protocol") | .pm2_env.status' 2>/dev/null)

        case "$pm2_status" in
            "online")
                print_status "PM2 process is online"
                ;;
            "stopped")
                print_error "PM2 process is stopped"
                ;;
            "errored")
                print_error "PM2 process has errors"
                ;;
            "")
                print_warning "PM2 process not found"
                ;;
            *)
                print_warning "PM2 process status: $pm2_status"
                ;;
        esac
    else
        print_info "PM2 not available"
    fi
}

# Check system resources
check_system_resources() {
    # Memory usage
    local memory_usage
    memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2 }')

    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        print_error "High memory usage: ${memory_usage}%"
    elif (( $(echo "$memory_usage > 80" | bc -l) )); then
        print_warning "Memory usage: ${memory_usage}%"
    else
        print_status "Memory usage: ${memory_usage}%"
    fi

    # Disk usage
    local disk_usage
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ "$disk_usage" -gt 90 ]; then
        print_error "High disk usage: ${disk_usage}%"
    elif [ "$disk_usage" -gt 80 ]; then
        print_warning "Disk usage: ${disk_usage}%"
    else
        print_status "Disk usage: ${disk_usage}%"
    fi

    # Load average
    local load_avg
    load_avg=$(uptime | awk -F'[a-z]:' '{ print $2}' | awk -F',' '{print $1}' | tr -d ' ')
    print_info "Load average: $load_avg"
}

# Auto-restart function
auto_restart() {
    print_warning "Attempting auto-restart..."

    # Try PM2 restart first
    if command -v pm2 &> /dev/null || [ -d "node_modules/pm2" ]; then
        npx pm2 restart vector-protocol 2>/dev/null || {
            print_warning "PM2 restart failed, trying to start fresh..."
            npx pm2 start ecosystem.config.js --env development 2>/dev/null || {
                print_error "Failed to restart with PM2"
                return 1
            }
        }
    else
        print_error "PM2 not available for auto-restart"
        return 1
    fi

    # Wait for server to come back online
    local retries=0
    local max_retries=10

    while [ $retries -lt $max_retries ]; do
        sleep 3
        if check_server_status; then
            print_status "Server restarted successfully"
            return 0
        fi
        ((retries++))
        print_info "Waiting for server to start... ($retries/$max_retries)"
    done

    print_error "Server failed to restart after $max_retries attempts"
    return 1
}

# Main monitoring loop
monitor_loop() {
    local failure_count=0
    local max_failures=3

    echo -e "${BLUE}🔍 Starting Vector Protocol monitoring...${NC}"
    echo "Health URL: $HEALTH_URL"
    echo "Check interval: ${CHECK_INTERVAL}s"
    echo "Log file: $LOG_FILE"
    echo "=================================="

    while true; do
        echo -e "\n${PURPLE}--- Health Check $(date '+%H:%M:%S') ---${NC}"

        if check_server_status; then
            failure_count=0
            get_health_status
            check_pm2_status
            check_system_resources
        else
            ((failure_count++))
            print_error "Server is not responding ($failure_count/$max_failures)"

            if [ $failure_count -ge $max_failures ]; then
                print_error "Maximum failures reached, attempting auto-restart..."
                if auto_restart; then
                    failure_count=0
                else
                    print_error "Auto-restart failed, manual intervention required"
                    # Send alert here (email, slack, etc.)
                fi
            fi
        fi

        sleep $CHECK_INTERVAL
    done
}

# One-time check mode
check_once() {
    echo -e "${BLUE}🔍 Vector Protocol Health Check${NC}"
    echo "================================="

    if check_server_status; then
        get_health_status
        check_pm2_status
        check_system_resources
        echo -e "\n${GREEN}✓ Overall status: OK${NC}"
        exit 0
    else
        print_error "Server is not responding"
        echo -e "\n${RED}✗ Overall status: FAILED${NC}"
        exit 1
    fi
}

# Command line options
case "${1:-loop}" in
    "once"|"check")
        check_once
        ;;
    "loop"|"monitor")
        monitor_loop
        ;;
    "restart")
        auto_restart
        ;;
    *)
        echo "Usage: $0 [once|loop|restart]"
        echo "  once    - Run a single health check"
        echo "  loop    - Run continuous monitoring (default)"
        echo "  restart - Attempt to restart the server"
        exit 1
        ;;
esac