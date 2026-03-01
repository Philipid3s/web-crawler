const config = {};

// URL to analyze
config.url = "";
// max depth to crawl from config.url
config.levelMax = 1;
// only crawl URLs on the same host as config.url
config.sameHostOnly = true;
// timeout per HTTP request in milliseconds
config.requestTimeoutMs = 10000;

module.exports = config;
