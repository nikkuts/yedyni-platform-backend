module.exports = {
  apps: [
    {
      name: "api",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        PORT: 3000
      }
    }
  ]
};
