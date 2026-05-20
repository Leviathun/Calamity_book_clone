document.addEventListener('DOMContentLoaded', function () {
  let dropdownBtn = document.getElementById("drop-text");
  let list = document.getElementById("list-category");
  let icon = document.getElementById("icon");
  let input = document.getElementById("search-input");
  let listItem = document.querySelectorAll(".dropdown-list-item");

  if (!dropdownBtn || !list || !icon || !input) {
    return; // Safe check for pages without user search navbar
  }

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
      e.target.id !== "icon" &&
      e.target.id !== "span"
    ) {
      list.classList.remove("show");
      icon.style.transform = "rotate(0deg)";
    }
  };

  listItem.forEach(item => {
    item.onclick = (e) => {
      e.preventDefault();
      const span = dropdownBtn.querySelector('span');
      if (span) {
        span.innerText = e.target.innerText;
      }
      if (e.target.innerText === "All category") {
        input.placeholder = "Find your favorite book...";
      } else {
        input.placeholder = "Your category is " + e.target.innerText + "...";
      }
      
      // Close dropdown after selection
      list.classList.remove("show");
      icon.style.transform = "rotate(0deg)";
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
      showToast(result.message, 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } else if (result.success) {
      showToast(result.message, 'success');
      // Optional: Update cart counter in UI here
    } else {
      showToast('Failed to add to cart: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('An error occurred. Please try again.', 'error');
  }
}

// Dynamic Countdown Ticker for active promotions
document.addEventListener('DOMContentLoaded', function() {
  const counterEl = document.getElementById('counter');
  if (!counterEl) return;

  const endTimeStr = counterEl.getAttribute('data-endtime');
  if (!endTimeStr) return;

  const endTime = new Date(endTimeStr).getTime();
  const cdHour = document.getElementById('cd_hour');
  const cdMin = document.getElementById('cd_min');
  const cdSec = document.getElementById('cd_sec');
  const expiredEl = document.getElementById('expired');

  if (!cdHour || !cdMin || !cdSec) return;

  const nowOnLoad = new Date().getTime();
  const initialDiff = endTime - nowOnLoad;

  const timerInterval = setInterval(function() {
    const now = new Date().getTime();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(timerInterval);
      cdHour.innerText = "00";
      cdMin.innerText = "00";
      cdSec.innerText = "00";
      
      if (expiredEl) {
        expiredEl.style.display = 'block';
      }
      
      // Force reload after 3 seconds ONLY if the promotion was active when page loaded
      // This prevents infinite reload loop if server is slow to sync/deactivate group
      if (initialDiff > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
      return;
    }

    const totalSecs = Math.floor(diff / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    cdHour.innerText = String(hours).padStart(2, '0');
    cdMin.innerText = String(minutes).padStart(2, '0');
    cdSec.innerText = String(seconds).padStart(2, '0');
  }, 1000);
});

