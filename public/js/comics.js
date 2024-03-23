let thisPage = 1;
let limit = 5;
let listProduct = document.querySelectorAll('.products-item');

function loadItem(){
    let beginGet = limit * (thisPage - 1);
    let endGet = limit * thisPage - 1;
    listProduct.forEach((item, key)=>{
        if(key >= beginGet && key <= endGet){
            item.style.display = 'block';
        }else{
            item.style.display = 'none';
        }
    })
    listPage();
}

loadItem();
function listPage(){
    let count = Math.ceil(listProduct.length / limit);
    document.querySelector('.listPage').innerHTML = '';

    if(thisPage != 1){
        let prev = document.createElement('li');
        prev.innerText = 'PREV';
        prev.setAttribute('onclick', "changePage(" + (thisPage - 1) + ")");
        document.querySelector('.listPage').appendChild(prev);
    }

    for(i = 1; i <= count; i++){
        let newPage = document.createElement('li');
        newPage.innerText = i;
        if(i == thisPage){
            newPage.classList.add('active');
        }
        newPage.setAttribute('onclick', "changePage(" + i + ")");
        document.querySelector('.listPage').appendChild(newPage);
    }

    if(thisPage != count){
        let next = document.createElement('li');
        next.innerText = 'NEXT';
        next.setAttribute('onclick', "changePage(" + (thisPage + 1) + ")");
        document.querySelector('.listPage').appendChild(next);
    }
}
function changePage(i){
    thisPage = i;
    loadItem();
}

let dropdownBtn = document.getElementById("drop-text");
let list = document.getElementById("list-category");
let icon = document.getElementById("icon");
let input = document.getElementById("search-input");
let listItem = document.querySelectorAll(".dropdown-list-item");
let cateName = document.getElementById("filterflashsale-title")

//show dropdown list when click
dropdownBtn.onclick = function () {
    //rotate arrow icon
    if(list.classList.contains('show')){
        icon.style.rotate = "0deg"
    }else{
        icon.style.rotate = "-180deg" 
    }
    list.classList.toggle("show");

};

//hide dropdown list when click out side
window.onclick = (e) => {
    if (
        e.target.id !== "drop-text" &&
        e.target.id !== "span" &&
        e.target.id !== "icon" 
    ) {
        list.classList.remove("show")
        icon.style.rotate = "0deg"
    }
};


// Function to set the selected category in localStorage
function setSelectedCategory(category) {
    localStorage.setItem('selectedCategory', category);
}

// Function to get the selected category from localStorage
function getSelectedCategory() {
    return localStorage.getItem('selectedCategory');
}

// Function to handle item click
function handleItemClick(e) {
    // Change dropdown btn text
    span.innerText = e.target.innerText;

    // Change input placeholder text
    if (e.target.innerText == "All category") {
        input.placeholder = "Find your favorite book...";
    } else {
        input.placeholder = "Your category is " + e.target.innerText + "...";
    }

    // Set the selected category in localStorage
    setSelectedCategory(e.target.innerText);
}

// Get the selected category from localStorage on page load
const selectedCategory = getSelectedCategory();

// Iterate through the list items
for (item of listItem) {
    // Add a click event listener to each item
    item.onclick = handleItemClick;

    // Check if the current item is the selected category from localStorage
    if (item.innerText === selectedCategory) {
        // Trigger a click event to apply the initial state
        item.click();
    }
}
