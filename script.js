let data = {};

$(document).ready(function() {
  $.getJSON("products.json", function(json) {
    data = json;
    showCategories();
  });
});

function showCategories() {
  $("#categories").fadeOut(200, function() {
    $(this).empty();
    $.each(data, function(category) {
      $("#categories").append(`
        <div class="col-sm-6 col-md-4">
          <div class="card shadow-sm animate__animated animate__fadeIn">
            <div class="card-body text-center">
              <h5 class="card-title">${category}</h5>
              <button class="btn btn-primary mt-3" onclick="showProducts('${category}')">View Products</button>
            </div>
          </div>
        </div>
      `);
    });
    $("#categories").fadeIn(400);
  });

  $("#products, #product-details").fadeOut(300);
}

function showProducts(category) {
  // Hide product details when going back
  $("#product-details").fadeOut(300, function() {
    $("#products").empty().removeClass("hidden").hide();

    $("#products").append(`<h2 class="mb-4">${category}</h2><div class="row g-4">`);

    data[category].forEach((product, index) => {
      $("#products").append(`
        <div class="col-sm-6 col-md-4">
          <div class="card product shadow-sm animate__animated animate__fadeInUp" 
               onclick="showProductDetails('${category}', ${index})">
            <img src="${product.image}" class="card-img-top img-fluid" alt="${product.name}">
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
            </div>
          </div>
        </div>
      `);
    });

    $("#products").append(`</div>
      <div class="mt-4">
        <button class="btn btn-secondary" onclick="showCategories()">← Back to Categories</button>
      </div>`);

    $("#products").fadeIn(500);
  });

  // Also hide categories
  $("#categories").fadeOut(300);
}

function showProductDetails(category, index) {
  const product = data[category][index];
  $("#products").fadeOut(300, function() {
    $("#product-details").empty().removeClass("hidden").hide();

    $("#product-details").append(`
      <div class="card shadow-lg animate__animated animate__fadeIn">
        <img src="${product.image}" class="card-img-top img-fluid" alt="${product.name}">
        <div class="card-body">
          <h2>${product.name}</h2>
          <p>${product.specs}</p>
          <a href="${product.link}" target="_blank" class="btn btn-primary">Buy Now</a>
          <button class="btn btn-secondary mt-3" onclick="showProducts('${category}')">← Back to ${category}</button>
        </div>
      </div>
    `);

    $("#product-details").fadeIn(500);
  });
}

