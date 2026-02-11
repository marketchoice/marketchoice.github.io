let data = {};

$(document).ready(function() {
  // Load product data from JSON
  $.getJSON("products.json", function(json) {
    data = json;
    showCategories();
  });
});

// Show categories with animation
function showCategories() {
  $("#categories").fadeOut(200, function() {
    $(this).empty();
    $.each(data, function(category) {
      $("#categories").append(`
        <div class="col-sm-6 col-md-4">
          <div class="card category shadow-sm animate__animated animate__fadeInUp" onclick="showProducts('${category}')">
            <div class="card-body text-center">
              <h5 class="card-title">${category}</h5>
            </div>
          </div>
        </div>
      `);
    });
    $("#categories").fadeIn(400);
  });

  $("#products, #product-details").fadeOut(300);
}

// Show products with animation
function showProducts(category) {
  $("#categories").fadeOut(300, function() {
    $("#products").empty().removeClass("hidden").hide();

    $("#products").append(`<h2 class="mb-3">${category}</h2><div class="row g-3">`);

    data[category].forEach((product, index) => {
      $("#products").append(`
        <div class="col-sm-6 col-md-4">
          <div class="card product shadow-sm animate__animated animate__zoomIn" onclick="showProductDetails('${category}', ${index})">
            <img src="${product.image}" class="card-img-top img-fluid" alt="${product.name}">
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
            </div>
          </div>
        </div>
      `);
    });

    $("#products").append(`</div><div class="mt-3"><button class="btn btn-secondary" onclick="showCategories()">← Back to Categories</button></div>`);

    $("#products").fadeIn(500);
  });
}

// Show product details with animation
function showProductDetails(category, index) {
  const product = data[category][index];
  $("#products").fadeOut(300, function() {
    $("#product-details").empty().removeClass("hidden").hide();

    $("#product-details").append(`
      <div class="card shadow-lg animate__animated animate__fadeInUp">
        <img src="${product.image}" class="card-img-top img-fluid" alt="${product.name}">
        <div class="card-body">
          <h2>${product.name}</h2>
          <p>${product.specs}</p>
          <a href="${product.link}" target="_blank" class="btn btn-primary">Buy Now</a>
          <button class="btn btn-secondary mt-2" onclick="showProducts('${category}')">← Back to ${category}</button>
        </div>
      </div>
    `);

    $("#product-details").fadeIn(500);
  });
}
