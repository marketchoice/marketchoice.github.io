let data = {};

$(document).ready(function() {
  $.getJSON("products.json", function(json) {
    data = json;
    handleDeepLink(); // initial render
  });

  // Browser back/forward support
  window.addEventListener("popstate", function() {
    resetViews();       // clear all sections
    handleDeepLink();   // re-render based on URL
  });
});

// Reset all views before rendering
function resetViews() {
  $("#categories").hide().empty();
  $("#products").hide().empty();
  $("#product-details").hide().empty();
}

// Handle deep link navigation
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
  resetViews();
  $.each(data, function(category) {
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

function showProducts(category, pushState = true, page = 1) {
  resetViews();
  const products = data[category];
  const pageSize = 15;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = products.slice(start, end);

  $("#products").append(`<h2 class="mb-4">${category}</h2><div class="row g-4">`);

  paginated.forEach((product, index) => {
    const globalIndex = start + index;
    $("#products").append(`
  <div class="col-sm-6 col-md-4">
    <div class="card product shadow-sm animate__animated animate__fadeInUp" 
         onclick="showProductDetails('${category}', ${globalIndex})">
      <img src="${product.image}" class="card-img-top img-fluid" alt="${product.name}">
      <div class="card-body">
        <h5 class="product-title">${product.name}</h5>
      </div>
    </div>
  </div>
`);
  });

  // Pagination
  const totalPages = Math.ceil(products.length / pageSize);
  let paginationHTML = `<nav><ul class="pagination justify-content-center">`;
  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `<li class="page-item ${i === page ? 'active' : ''}">
      <button class="page-link" onclick="showProducts('${category}', true, ${i})">${i}</button>
    </li>`;
  }
  paginationHTML += `</ul></nav>`;
  $("#products").append(paginationHTML);

  $("#products").fadeIn(500);

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&page=${page}`);
  }
}

function showProductDetails(category, index, pushState = true) {
  resetViews();
  const product = data[category][index];

  $("#product-details").append(`
    <div class="product-detail-card animate__animated animate__fadeIn">
      <img src="${product.image}" alt="${product.name}" class="img-fluid">
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        <p>${product.specs}</p>
        <div class="product-detail-actions">
          <a href="${product.link}" target="_blank" class="btn btn-primary">Buy Now</a>
          <button class="btn btn-secondary" onclick="showProducts('${category}')">← Back to ${category}</button>
        </div>
      </div>
    </div>
  `);

  $("#product-details").fadeIn(500);

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&product=${index}`);
  }
}
