let data = {};
let currentCategory = null;
const pageSize = 12;

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
    p.name.toLowerCase().includes(query) ||
    (p.coupon && p.coupon.toLowerCase().includes(query))
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
  fetchImages();
}

// Helper to render card (refactored from showProducts)
function renderProductCard(product, category, index) {
  // Price & Discount Logic
  let priceHtml = '';
  if (product.price) {
    priceHtml = `<p class="card-text fw-bold text-primary mb-1">${product.currency || ''} ${product.price}</p>`;
    if (product.mrp && parseFloat(product.mrp) > parseFloat(product.price)) {
      const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
      priceHtml = `
                <div class="mb-1">
                    <span class="fw-bold text-primary">${product.currency || ''} ${product.price}</span>
                    <small class="text-muted text-decoration-line-through ms-1">${product.currency || ''} ${product.mrp}</small>
                    <small class="text-success fw-bold ms-1">(${discount}% off)</small>
                </div>
            `;
    }
  }

  // Stock Badge
  let badges = '';
  if (product.inStock === false) { // Explicit false check
    badges += `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Out of Stock</span>`;
  } else if (product.coupon) {
    badges += `<span class="badge bg-info text-dark position-absolute top-0 end-0 m-2">Code: ${product.coupon}</span>`;
  }

  return `
      <div class="col-sm-6 col-md-4">
        <div class="card product shadow-sm animate__animated animate__fadeInUp bg-white" 
             style="cursor: pointer; position: relative;"
             onclick="showProductDetails('${category}', ${index})">
          ${badges}
          <div class="card-horizontal">
            <img src="images/product.jpg" data-image-key="${product.image ? product.image[0] : ''}" class="card-thumb" alt="${product.name}">
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

  // Fetch images for products
  fetchImages();

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&page=${page}`);
  }
}

function fetchImages() {
  $(".card-thumb").each(function () {
    const imgElement = $(this);
    const imageKey = imgElement.data("image-key");
    if (imageKey) {
      // Handle array of images if passed, or single string
      const keyToUse = Array.isArray(imageKey) ? imageKey[0] : imageKey;
      getImageData(keyToUse, function (base64Data) {
        if (base64Data) {
          imgElement.attr("src", base64Data);
        }
      });
    }
  });
}

function getImageData(imageKey, callback) {
  // Assuming images are stored under "images" node in Firebase. 
  // If the "json file property" mentioned refers to a different node, update "images" below.
  firebaseOps.readDataOnce("images/" + imageKey, callback);
}

function showProductDetails(category, index, pushState = true) {
  resetViews();
  $("body").addClass("has-fixed-actions");
  const product = data[category][index];

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
    if (product.mrp && parseFloat(product.mrp) > parseFloat(product.price)) {
      const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
      priceHtml = `
                <div class="mb-3">
                    <h3 class="d-inline text-primary fw-bold">${product.currency || ''} ${product.price}</h3>
                    <span class="text-muted text-decoration-line-through fs-5 ms-2">${product.currency || ''} ${product.mrp}</span>
                    <span class="badge bg-success ms-2">${discount}% OFF</span>
                </div>
            `;
    } else {
      priceHtml = `<h3 class="text-primary fw-bold mb-3">${product.currency || ''} ${product.price}</h3>`;
    }
  }

  // Coupon Display
  let couponHtml = '';
  if (product.coupon) {
    couponHtml = `
        <div class="alert alert-info d-flex align-items-center mb-3" role="alert">
            <strong>Coupon Available:</strong> <span class="badge bg-white text-dark ms-2 border fs-6">${product.coupon}</span>
        </div>
      `;
  }

  $("#product-details").append(`
    <div class="product-detail-card animate__animated animate__fadeIn">
      <img src="images/product.jpg" data-image-key="${product.image ? (Array.isArray(product.image) ? product.image[0] : product.image) : ''}" alt="${product.name}" class="img-fluid product-detail-image">
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        ${priceHtml}
        ${couponHtml}
        <div class="specs-content">${product.specs}</div>
      </div>
    </div>
    <div class="product-detail-actions animate__animated animate__fadeInUp">
      ${linksHTML}
      <button class="btn btn-secondary" onclick="showProducts('${category}')">← Back to ${category}</button>
    </div>
  `);

  // Fetch image for details view
  const detailImg = $(".product-detail-image");
  const detailKey = detailImg.data("image-key");
  if (detailKey) {
    getImageData(detailKey, function (base64Data) {
      if (base64Data) {
        detailImg.attr("src", base64Data);
      }
    });
  }

  $("#product-details").fadeIn(500);

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&product=${index}`);
  }
}
