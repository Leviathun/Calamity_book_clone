document.addEventListener('DOMContentLoaded', function () {
  let dropdownBtn = document.getElementById("drop-text");
  let list = document.getElementById("list-category");
  let icon = document.getElementById("icon");
  let input = document.getElementById("search-input");
  let listItem = document.querySelectorAll(".dropdown-list-item");

  dropdownBtn.onclick = function () {
    if (list.classList.contains('show')) {
      icon.style.transform = "rotate(0deg)";
    } else {
      icon.style.transform = "rotate(-180deg)";
    }
    list.classList.toggle("show");
  };

  window.onclick = (e) => {
    if (
      e.target.id !== "drop-text" &&
      e.target.id !== "icon"
    ) {
      list.classList.remove("show");
      icon.style.transform = "rotate(0deg)";
    }
  };

  listItem.forEach(item => {
    item.onclick = (e) => {
      dropdownBtn.innerText = e.target.innerText;
      if (e.target.innerText === "All category") {
        input.placeholder = "Find your favorite book...";
      } else {
        input.placeholder = "Your category is " + e.target.innerText + "...";
      }
    };
  });
});

async function addToCart(productId) {
  try {
    const response = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_id: productId })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      alert(result.message);
      window.location.href = '/login';
    } else if (result.success) {
      alert(result.message);
      // Optional: Update cart counter in UI here
    } else {
      alert('Failed to add to cart: ' + result.message);
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('An error occurred. Please try again.');
  }
}
