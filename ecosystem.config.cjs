module.exports = {
  apps: [
    {
      name: 'scansuite-api',
      script: 'dist/index.js',
      cwd: 'apps/api',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'scansuite-web',
      script: 'npm',
      args: 'run start -- -p 3000',
      cwd: 'apps/web',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
