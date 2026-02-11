let data = {};

$(document).ready(function() {
  $.getJSON("products.json", function(json) {
    data = json;
    handleDeepLink(); // check URL params on load
  });
});

// Handle deep link navigation
function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const productIndex = params.get("product");

  if (category && data[category]) {
    if (productIndex !== null && data[category][productIndex]) {
      showProductDetails(category, productIndex, false); // false = don't pushState again
    } else {
      showProducts(category, false);
    }
  } else {
    showCategories();
  }
}

function showCategories(pushState = true) {
  $("#categories").fadeOut(200, function() {
    $(this).empty();
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
  });

  $("#products, #product-details").fadeOut(300);

  if (pushState) {
    history.pushState({}, "", "index.html");
  }
}

function showProducts(category, pushState = true) {
  $("#product-details").fadeOut(300);
  $("#categories").fadeOut(300, function() {
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

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}`);
  }
}

function showProductDetails(category, index, pushState = true) {
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

  if (pushState) {
    history.pushState({}, "", `index.html?category=${encodeURIComponent(category)}&product=${index}`);
  }
}
