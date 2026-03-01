# Web Crawler

Prototype web crawler for Node.js.

## Requirements

- Node.js `>=20.18.1`

## Setup

```bash
npm install
```

## Configuration

Edit [`config.js`](./config.js):

- `url`: seed URL to crawl (required)
- `levelMax`: max crawl depth from seed URL
- `sameHostOnly`: restrict crawl to the seed host
- `requestTimeoutMs`: per-request timeout in milliseconds

## Run

```bash
npm start
```

## Scripts

```bash
npm run lint
npm test
```
