const path = require('path');

module.exports = {
  apps: [
    {
      name: 'scan-suite-api',
      cwd: path.resolve(__dirname, 'apps/api'),
      script: 'node',
      args: 'dist/index.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'scan-suite-web',
      cwd: path.resolve(__dirname, 'apps/web'),
      script: 'npm',
      args: 'run start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
