let data = {};
const pageSize = 12;

$(document).ready(function() {
  // Instead of $.getJSON, read from Firebase
  firebaseOps.readData("products", function(snapshotData) {
    if (snapshotData) {
      data = snapshotData;
      handleDeepLink();
    } else {
      console.warn("No products found in Firebase.");
      data = {};
      showCategories(false);
    }
  });

  window.addEventListener("popstate", function() {
    resetViews();
    handleDeepLink();
  });
});


function resetViews() {
  $("#categories").hide().empty();
  $("#products").hide().empty();
  $("#product-details").hide().empty();
  $("#categories-header").hide();
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
  resetViews();
  $("#categories-header").fadeIn(400);
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
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = products.slice(start, end);

  let html = `<h2 class="mb-4">${category}</h2><div class="row g-4">`;

  paginated.forEach((product, index) => {
    const globalIndex = start + index;
    html += `
      <div class="col-sm-6 col-md-4">
        <div class="card product shadow-sm animate__animated animate__fadeInUp" 
             onclick="showProductDetails('${category}', ${globalIndex})">
          <div class="card-horizontal">
            <img src="${product.image}" class="card-thumb" alt="${product.name}">
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`; // close row

  const totalPages = Math.ceil(products.length / pageSize);

if (totalPages > 1) {
  html += `<nav><ul class="pagination justify-content-center">`;

  if (page > 1) {
    html += `
      <li class="page-item">
        <button class="page-link" onclick="showProducts('${category}', true, ${page-1})" aria-label="Previous">
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
        <button class="page-link" onclick="showProducts('${category}', true, ${page+1})" aria-label="Next">
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
  const product = data[category][index];

  let linksHTML = "";
  product.links.forEach(link => {
    let icon = "";
    if (link.store === "amazon") {
      icon = `<img src="images/amazon.png" alt="Amazon" class="store-icon">`;
    } else if (link.store === "flipkart") {
      icon = `<img src="images/flipkart.png" alt="Flipkart" class="store-icon">`;
    } else {
      icon = `<span class="store-icon">${link.store}</span>`;
    }

    linksHTML += `
      <a href="${link.url}" target="_blank" class="btn btn-primary align-items-center gap-2">
        ${icon} Buy on ${link.store.charAt(0).toUpperCase() + link.store.slice(1)}
      </a>
    `;
  });

  $("#product-details").append(`
    <div class="product-detail-card animate__animated animate__fadeIn">
      <img src="${product.image}" alt="${product.name}" class="img-fluid">
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        <p>${product.specs}</p>
        <div class="product-detail-actions">
          ${linksHTML}
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
