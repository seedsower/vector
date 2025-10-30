module.exports = {
  apps: [
    {
      name: 'vector-protocol',
      script: 'tsx',
      args: 'server/index.ts',
      cwd: './',
      instances: 1,
      autorestart: false,
      watch: false,
      // max_memory_restart: '1G', // Disabled to prevent reload loops
      env: {
        NODE_ENV: 'development',
        PORT: '5001'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '5000'
      },
      error_file: './logs/pm2/err.log',
      out_file: './logs/pm2/out.log',
      log_file: './logs/pm2/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Advanced recovery settings
      min_uptime: '10s',
      max_restarts: 50,
      restart_delay: 4000,
      // Kill timeout
      kill_timeout: 1600,
      // Health monitoring (disabled to prevent reload loops)
      // health_check_url: 'http://localhost:5000/api/health',
      // health_check_grace_period: 3000,
      // Auto restart on file changes (disabled for production)
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git',
        '*.log'
      ],
      // Advanced settings for stability
      node_args: '--max-old-space-size=1024',
      // Graceful shutdown
      listen_timeout: 8000,
      // Exponential backoff restart
      exp_backoff_restart_delay: 100,
      // Clustering for production
      exec_mode: 'fork', // Use 'cluster' for production with multiple instances
      // Source map support
      source_map_support: true,
      // Auto dump heap on OOM
      autoheapdump: true,
      // Disable daemon mode for development visibility
      daemon: false
    }
  ],

  // Deployment configuration (for future use)
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};