const cheerio = require("cheerio");
const config = require("./config");

const {
  url: startUrl,
  levelMax = 1,
  sameHostOnly = true,
  requestTimeoutMs = 10000,
} = config;

if (!startUrl) {
  throw new Error("config.url is required.");
}

function normalizeUrl(href, baseUrl) {
  if (!href) {
    return null;
  }

  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("data:")
  ) {
    return null;
  }

  try {
    const resolved = new URL(trimmed, baseUrl);
    if (!["http:", "https:"].includes(resolved.protocol)) {
      return null;
    }
    resolved.hash = "";
    return resolved.href;
  } catch {
    return null;
  }
}

function extractEmail(href) {
  if (!href || !href.startsWith("mailto:")) {
    return null;
  }

  const value = href.slice("mailto:".length).split("?")[0].trim().toLowerCase();
  if (!value || !value.includes("@")) {
    return null;
  }

  return value;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: { "user-agent": "WebCrawler/1.0 (+https://local.project)" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return "";
  }

  return response.text();
}

async function crawl() {
  const seed = new URL(startUrl).href;
  const seedHost = new URL(seed).host;
  const queue = [{ url: seed, level: 0 }];
  const discoveredUrls = new Set([seed]);
  const crawledUrls = new Set();
  const emails = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.level > levelMax) {
      continue;
    }

    if (crawledUrls.has(current.url)) {
      continue;
    }
    crawledUrls.add(current.url);

    let body = "";
    try {
      body = await fetchHtml(current.url);
    } catch (error) {
      console.warn(`Skip ${current.url}: ${error.message}`);
      continue;
    }

    if (!body) {
      continue;
    }

    const $ = cheerio.load(body);
    $("a[href]").each((_index, element) => {
      const href = $(element).attr("href");
      const email = extractEmail(href);
      if (email) {
        emails.add(email);
        return;
      }

      const normalized = normalizeUrl(href, current.url);
      if (!normalized || discoveredUrls.has(normalized)) {
        return;
      }

      if (sameHostOnly && new URL(normalized).host !== seedHost) {
        return;
      }

      discoveredUrls.add(normalized);
      queue.push({ url: normalized, level: current.level + 1 });
    });
  }

  return {
    urls: [...discoveredUrls],
    emails: [...emails],
  };
}

crawl()
  .then((result) => {
    console.log("===== urls =====");
    console.log(result.urls);
    console.log("===== emails =====");
    console.log(result.emails);
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
