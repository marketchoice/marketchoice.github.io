/**
 * update-sitemap.js
 * 
 * USAGE: 
 * 1. Ensure Node.js is installed on your system.
 * 2. Run from project root: node js/update-sitemap.js
 * 3. Commit and push the updated sitemap.xml and index.html to GitHub.
 * 
 * This script fetches the latest product data from Firebase and 
 * generates a comprehensive sitemap for search engines.
 */

const fs = require('fs');
const https = require('https');

// Firebase Configuration from firebase-ops.js
const firebaseConfig = {
    databaseURL: "https://marketchoice-bad01-default-rtdb.firebaseio.com",
};

const BASE_URL = "https://marketchoice.github.io/";

/**
 * Fetch data from Firebase REST API
 */
function fetchFirebaseData(path) {
    return new Promise((resolve, reject) => {
        const url = `${firebaseConfig.databaseURL}/${path}.json`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Generate sitemap XML content
 */
function generateSitemap(data) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${BASE_URL}images/favicon.png</image:loc>
      <image:title>MarketChoice Logo</image:title>
    </image:image>
  </url>`;

    if (data) {
        Object.keys(data).forEach(category => {
            const categoryUrl = `${BASE_URL}index.html?category=${encodeURIComponent(category)}`;
            xml += `
  
  <!-- Category: ${category} -->
  <url>
    <loc>${categoryUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

            const products = data[category];
            if (Array.isArray(products)) {
                products.forEach((product, index) => {
                    if (!product) return;
                    const productUrl = `${BASE_URL}index.html?category=${encodeURIComponent(category)}&amp;product=${index}`;
                    xml += `
  <url>
    <loc>${productUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
                });
            }
        });
    }

    xml += `
</urlset>`;
    return xml;
}

async function run() {
    console.log("Fetching data from Firebase...");
    try {
        const data = await fetchFirebaseData("products");
        console.log("Generating sitemap...");
        const sitemap = generateSitemap(data);
        fs.writeFileSync('sitemap.xml', sitemap);
        console.log("sitemap.xml has been updated successfully!");

        // Also update index.html fallback links for better SEO discovery
        updateIndexHtmlFallback(data);
    } catch (error) {
        console.error("Error generating sitemap:", error);
    }
}

/**
 * Update index.html with a small set of fallback links for SEO discovery
 * (Limited to first few items to keep HTML clean)
 */
function updateIndexHtmlFallback(data) {
    if (!data) return;

    let fallbackHtml = '      <ul>\n';
    const categories = Object.keys(data).slice(0, 10); // Limit to 10 categories

    categories.forEach(category => {
        const url = `${BASE_URL}index.html?category=${encodeURIComponent(category)}`;
        fallbackHtml += `        <li><a href="${url}">${category}</a></li>\n`;
    });

    fallbackHtml += '      </ul>';

    try {
        let indexContent = fs.readFileSync('index.html', 'utf8');
        const startMarker = '<!-- These will be dynamically populated by the sitemap script or can be manually added for core categories -->';
        const endMarker = '    </nav>';

        // Find the range to replace
        const startIndex = indexContent.indexOf(startMarker);
        const endIndex = indexContent.indexOf(endMarker, startIndex);

        if (startIndex !== -1 && endIndex !== -1) {
            const newContent = indexContent.substring(0, startIndex + startMarker.length) +
                '\n' + fallbackHtml + '\n' +
                indexContent.substring(endIndex);
            fs.writeFileSync('index.html', newContent);
            console.log("index.html fallback links updated.");
        }
    } catch (err) {
        console.error("Error updating index.html fallback:", err);
    }
}

run();
