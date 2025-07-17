module.exports = {
  apps: [
    {
      name: 'ProductivityApp',
      cwd: './server',
      script: 'npm',
      args: 'run dev',
      watch: false
    },
    {
      name: 'frontend',
      cwd: './client',
      script: 'npm',
      args: 'run dev',
      watch: false
    }
  ]
};
