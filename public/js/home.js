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
