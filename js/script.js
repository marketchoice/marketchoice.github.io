let data = {};
let currentCategory = null;
const pageSize = 12;

function getProductImageUrl(product) {
  if (product.image && product.image.length > 0) {
    const img = Array.isArray(product.image) ? product.image[0] : product.image;
    if (typeof img === 'string' && img.startsWith('url:')) {
      return img.slice(4);
    }
    return img;
  }
  return "images/product.jpg";
}

// ===== SEO HELPER FUNCTIONS =====

/**
 * Update page title and meta tags dynamically for better SEO
 */
function updatePageMeta(title, description, url) {
  // Update document title
  document.title = title;

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);

  // Update Open Graph tags
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description);

  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', url);

  // Update Twitter Card tags
  let twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', title);

  let twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', description);

  let twitterUrl = document.querySelector('meta[name="twitter:url"]');
  if (twitterUrl) twitterUrl.setAttribute('content', url);

  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', url);
}

/**
 * Add Product structured data (JSON-LD) for rich search results
 */
function addProductStructuredData(product, category) {
  // Remove any existing product structured data
  const existingScript = document.querySelector('script[data-schema="product"]');
  if (existingScript) existingScript.remove();

  // Determine availability status
  const availability = product.inStock === false
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  // Build offers array
  const offers = [];
  if (product.links && product.links.length > 0) {
    product.links.forEach(link => {
      const offer = {
        "@type": "Offer",
        "url": link.url,
        "priceCurrency": product.currency || "INR",
        "price": product.price || "0",
        "availability": availability,
        "seller": {
          "@type": "Organization",
          "name": link.store
        }
      };



      offers.push(offer);
    });
  }

  // Build Product schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.specs ? product.specs.replace(/<[^>]*>/g, '') : product.name,
    "image": getProductImageUrl(product).startsWith('http') ? getProductImageUrl(product) : "https://marketchoice.github.io/" + getProductImageUrl(product),
    "brand": {
      "@type": "Brand",
      "name": category
    },
    "category": category
  };

  // Add offers
  if (offers.length === 1) {
    productSchema.offers = offers[0];
  } else if (offers.length > 1) {
    productSchema.offers = {
      "@type": "AggregateOffer",
      "priceCurrency": product.currency || "INR",
      "lowPrice": product.price || "0",
      "highPrice": product.price || "0",
      "offerCount": offers.length,
      "offers": offers,
      "availability": availability
    };
  }



  // Create and append script tag
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute('data-schema', 'product');
  script.textContent = JSON.stringify(productSchema, null, 2);
  document.head.appendChild(script);
}

/**
 * Add BreadcrumbList structured data for navigation
 */
function addBreadcrumbStructuredData(items) {
  // Remove any existing breadcrumb structured data
  const existingScript = document.querySelector('script[data-schema="breadcrumb"]');
  if (existingScript) existingScript.remove();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute('data-schema', 'breadcrumb');
  script.textContent = JSON.stringify(breadcrumbSchema, null, 2);
  document.head.appendChild(script);
}

/**
 * Remove dynamic structured data when navigating away
 */
function removeDynamicStructuredData() {
  const productSchema = document.querySelector('script[data-schema="product"]');
  if (productSchema) productSchema.remove();

  const breadcrumbSchema = document.querySelector('script[data-schema="breadcrumb"]');
  if (breadcrumbSchema) breadcrumbSchema.remove();
}


$(document).ready(function () {
  // Instead of $.getJSON, read from Firebase
  firebaseOps.readData("products", function (snapshotData) {
    if (snapshotData) {
      data = snapshotData;
      handleDeepLink();
    } else {
      console.warn("No products found in Firebase.");
      data = {};
      showCategories(false);
    }
  });

  window.addEventListener("popstate", function () {
    resetViews();
    handleDeepLink();
  });

  // Search Event
  $("#searchInput").on("input", function () {
    const query = $(this).val().toLowerCase();
    if (currentCategory) {
      if (query) {
        filterCategoryProducts(query);
      } else {
        // If search is cleared, reload the category view (page 1)
        showProducts(currentCategory, false);
      }
    }
  });
});


function resetViews() {
  $("#categories").hide().empty();
  $("#products").hide().empty();
  $("#product-details").hide().empty();
  $("#categories-header").hide();
  $("#searchContainer").removeClass("d-flex").hide();
  $("body").removeClass("has-fixed-actions");

  // SEO: Remove dynamic structured data when navigating
  removeDynamicStructuredData();
}

function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const productIndex = params.get("product");
  const page = parseInt(params.get("page")) || 1;

  if (category && data[category]) {
    if (productIndex !== null && data[category][productIndex]) {
      showProductDetails(category, productIndex, false);
    } else {
      showProducts(category, false, page);
    }
  } else {
    showCategories(false);
  }
}

function showCategories(pushState = true) {
  currentCategory = null;
  resetViews();

  // SEO: Update meta tags for homepage
  updatePageMeta(
    "MarketChoice - Best Deals on Amazon & Flipkart | Compare Prices & Save",
    "Discover the best deals and discounts on top products from Amazon and Flipkart. Compare prices, find exclusive coupons, and save on electronics, fashion, home goods, and more.",
    "https://marketchoice.github.io/"
  );

  $("#categories-header").fadeIn(400);
  $.each(data, function (category) {
    $("#categories").append(`
      <div class="col-sm-6 col-md-4">
        <div class="card category shadow-sm animate__animated animate__fadeIn" 
             onclick="showProducts('${category}')">
          <div class="card-body text-center">
            <h5 class="card-title">${category}</h5>
            <button class="btn btn-primary mt-3">View Products</button>
          </div>
        </div>
      </div>
    `);
  });
  $("#categories").fadeIn(400);

  if (pushState) history.pushState({}, "", "index.html");
}

function filterCategoryProducts(query) {
  // We use existing showProducts layout but replace content
  // Or better, just re-render the products grid part?
  // Re-rendering the grid is safer to keep the header "Back to Categories" etc.

  // Actually, showProducts wipes #products.
  // Let's implement a simple filter render that mimics showProducts but without pagination (or with validation)

  const products = data[currentCategory];
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query)
  );

  let html = `
  <div class="d-flex justify-content-between align-items-center mb-4 product-list-header">
    <h2 class="mb-0">${currentCategory} <small class="text-muted fs-6">(Search: "${query}")</small></h2>
    <button class="btn btn-secondary back-category" onclick="showCategories()">← Back to Categories</button>
  </div>
  <div class="row g-4">
`;

  if (filtered.length === 0) {
    html += `<div class="col-12 text-center py-5"><h4>No products found matching "${query}"</h4></div>`;
  } else {
    filtered.forEach((product, index) => {
      // We need the original index for the click handler to work correctly with data[category][index]
      // So we must find it
      const originalIndex = products.indexOf(product);
      html += renderProductCard(product, currentCategory, originalIndex);
    });
  }

  html += `</div>`;

  $("#products").hide().empty().append(html).fadeIn(200);
}

// Helper to render card (refactored from showProducts)
function renderProductCard(product, category, index) {
  // Price & Discount Logic
  let priceHtml = '';
  if (product.price) {
    priceHtml = `<p class="card-text fw-bold text-primary mb-1">${product.currency || ''} ${product.price}</p>`;
  }

  // Stock Badge
  let badges = '';
  if (product.inStock === false) { // Explicit false check
    badges += `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Out of Stock</span>`;
  }

  return `
      <div class="col-sm-6 col-md-4">
        <div class="card product shadow-sm animate__animated animate__fadeInUp bg-white" 
             style="cursor: pointer; position: relative;"
             onclick="showProductDetails('${category}', ${index})">
          ${badges}
          <div class="card-horizontal">
            <img src="${getProductImageUrl(product)}" class="card-thumb" alt="${product.name}">
            <div class="card-body">
              <h5 class="card-title" title="${product.name}">${product.name}</h5>
              ${priceHtml}
            </div>
          </div>
        </div>
      </div>
    `;
}

function showProducts(category, pushState = true, page = 1) {
  resetViews();
  $("#searchContainer").addClass("d-flex").show();

  // Only clear input if we are switching categories or not searching
  // But simpler: always clear input when entering via showProducts (which is called by Category Click)
  // If we are just paginating, we might want to keep it? 
  // The current implementation of pagination calls showProducts. 
  // If we are paginating, we probably aren't searching (search uses filterCategoryProducts).
  // So clearing is fine/safe.
  if (!pushState) {
    // This is a bit ambiguous. Let's just reset currentCategory and input.
  }

  currentCategory = category;
  $("#searchInput").val(''); // Clear search on fresh view or pagination reset

  // SEO: Update meta tags for category page
  const categoryUrl = `https://marketchoice.github.io/index.html?category=${encodeURIComponent(category)}&page=${page}`;
  updatePageMeta(
    `${category} - Best Deals & Offers | MarketChoice`,
    `Browse the best ${category.toLowerCase()} deals from Amazon and Flipkart. Compare prices, find exclusive coupons and discounts on top products.`,
    categoryUrl
  );

  // SEO: Add breadcrumb structured data
  addBreadcrumbStructuredData([
    { name: "Home", url: "https://marketchoice.github.io/" },
    { name: category, url: categoryUrl }
  ]);

  const products = data[category];
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = products.slice(start, end);

  let html = `
  <div class="d-flex justify-content-between align-items-center mb-4 product-list-header">
    <h2 class="mb-0">${category}</h2>
    <button class="btn btn-secondary back-category" onclick="showCategories()">← Back to Categories</button>
  </div>
  <div class="row g-4">
`;

  paginated.forEach((product, index) => {
    const globalIndex = start + index;
    html += renderProductCard(product, category, globalIndex);
  });

  html += `</div>`; // close row

  const totalPages = Math.ceil(products.length / pageSize);

  if (totalPages > 1) {
    html += `<nav><ul class="pagination justify-content-center">`;

    if (page > 1) {
      html += `
      <li class="page-item">
        <button class="page-link" onclick="showProducts('${category}', true, ${page - 1})" aria-label="Previous">
          <span aria-hidden="true">&laquo;</span>
        </button>
      </li>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      html += `
      <li class="page-item ${i === page ? 'active' : ''}">
        <button class="page-link" onclick="showProducts('${category}', true, ${i})">${i}</button>
      </li>`;
    }

    if (page < totalPages) {
      html += `
      <li class="page-item">
        <button class="page-link" onclick="showProducts('${category}', true, ${page + 1})" aria-label="Next">
          <span aria-hidden="true">&raquo;</span>
        </button>
      </li>`;
    }

    html += `</ul></nav>`;
  }


  $("#products").append(html).fadeIn(500);


  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&page=${page}`);
  }
}


function showProductDetails(category, index, pushState = true) {
  resetViews();
  $("body").addClass("has-fixed-actions");
  const product = data[category][index];

  // SEO: Update meta tags for product page
  const productUrl = `https://marketchoice.github.io/index.html?category=${encodeURIComponent(category)}&product=${index}`;
  const productDescription = product.specs
    ? product.specs.replace(/<[^>]*>/g, '').substring(0, 155) + '...'
    : `${product.name} - Find the best price from Amazon and Flipkart with exclusive deals and coupons.`;

  updatePageMeta(
    `${product.name} - ${category} | MarketChoice`,
    productDescription,
    productUrl
  );

  // SEO: Add breadcrumb structured data
  addBreadcrumbStructuredData([
    { name: "Home", url: "https://marketchoice.github.io/" },
    { name: category, url: `https://marketchoice.github.io/index.html?category=${encodeURIComponent(category)}` },
    { name: product.name, url: productUrl }
  ]);

  // SEO: Add Product structured data
  addProductStructuredData(product, category);

  let linksHTML = "";
  const isOutOfStock = product.inStock === false;

  if (isOutOfStock) {
    linksHTML = `<button class="btn btn-secondary disabled">Out of Stock</button>`;
  } else {
    product.links.forEach(link => {
      let icon = "";
      // Strict check or case-insensitive for legacy data
      const storeLower = link.store.toLowerCase();

      if (storeLower === "amazon") {
        icon = `<img src="images/amazon.png" alt="Amazon" class="store-icon">`;
      } else if (storeLower === "flipkart") {
        icon = `<img src="images/flipkart.png" alt="Flipkart" class="store-icon">`;
      } else {
        icon = `<span class="store-icon">${link.store}</span>`;
      }

      linksHTML += `
          <a href="${link.url}" target="_blank" class="btn btn-primary align-items-center gap-2">
            ${icon} Buy on ${link.store}
          </a>
        `;
    });
  }

  // Price Display in Details
  let priceHtml = '';
  if (product.price) {
    priceHtml = `<h3 class="text-primary fw-bold mb-3">${product.currency || ''} ${product.price}</h3>`;
  }



  $("#product-details").append(`
    <div class="product-detail-card animate__animated animate__fadeIn">
      <img src="${getProductImageUrl(product)}" alt="${product.name}" class="img-fluid product-detail-image">
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        ${priceHtml}
        <div class="specs-content">${product.specs}</div>
      </div>
    </div>
    <div class="product-detail-actions animate__animated animate__fadeInUp">
      ${linksHTML}
      <button class="btn btn-secondary" onclick="showProducts('${category}')">← Back to ${category}</button>
    </div>
  `);


  $("#product-details").fadeIn(500);

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&product=${index}`);
  }
}
