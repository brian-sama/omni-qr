module.exports = {
  apps: [
    {
      name: 'scan-suite-api',
      script: 'dist/index.js',
      cwd: 'apps/api',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'scan-suite-web',
      script: 'npm',
      args: 'run start -- -p 3000',
      cwd: 'apps/web',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
