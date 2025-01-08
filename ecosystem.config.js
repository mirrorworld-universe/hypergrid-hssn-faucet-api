module.exports = {
  apps: [
    {
      name: 'sonic-faucet-api',
      script: 'node',
      args: 'build/server.js',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: 'logs/sonic-faucet-api/normal.log',
      error_file: 'logs/sonic-faucet-api/error.log',
      combine_logs: true,
    },
    {
      name: 'sonic-sync-wallets',
      script: 'ts-node',
      args: 'source/scripts/syncWallets.ts',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: 'logs/sonic-sync-wallets/normal.log',
      error_file: 'logs/sonic-sync-wallets/error.log',
      combine_logs: true,
    },
    {
      name: 'sonic-check-faucet',
      script: 'ts-node',
      args: 'source/scripts/checkFaucet.ts',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      out_file: 'logs/sonic-check-faucet/normal.log',
      error_file: 'logs/sonic-check-faucet/error.log',
      combine_logs: true,
    },
  ]
};