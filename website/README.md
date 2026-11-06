# josimi.com source

The public site is maintained here so its static HTML, styles, and release lookup stay reviewable with the wallet source.

From the repository root, run:

```bash
npm run build:site
```

The build writes a deployable static site to `dist/site/`, including crawlable fallback HTML, content-hashed CSS/JavaScript, the Josimi logo, `robots.txt`, `sitemap.xml`, and Cloudflare Pages headers. The build uses only Node.js built-ins; no third-party package is needed.

The browser asks the GitHub Releases API for the latest published release. If that request is unavailable, the buttons open the GitHub Releases page instead of asserting that the fallback version is still current.
