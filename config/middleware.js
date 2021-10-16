module.exports = {
  after: {
    before: ["responseTime", "logger", "cors", "responses", "gzip"],
    after: ["parse", "router", "exceptions"],
  },
  settings: {
    exceptions: {
      enabled: true,
    },
  },
};
