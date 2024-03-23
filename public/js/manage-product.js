// Function to fetch and display products
function displayProducts(category) {
    // Fetch products from the server
    fetch(`/get-products?category=${category}`)
    .then(response => response.json())
    .then(products => {
        // Get the product list tbody element
        const productList = document.getElementById("product-list");

        // Clear existing product rows
        productList.innerHTML = "";

        // Loop through the products and create table rows
        products.forEach((product, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><img src="${product.image}" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>${product.id}</td>
                <td>${product.price}</td>
                <td>${product.saleCount}</td>
                <td>
                    <a href="/edit-product?id=${product.id}"><button>Edit</button></a>
                    <button onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            `;
            productList.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching products:', error);
    });
}

// Function to delete a product
function deleteProduct(productId) {
    // Implement delete product functionality here
    console.log("Delete product with ID:", productId);
}

// Add event listener to category select element
document.getElementById("category").addEventListener("change", function() {
    const selectedCategory = this.value;
    displayProducts(selectedCategory);
});

// Initial display of products based on the selected category
const initialCategory = document.getElementById("category").value;
displayProducts(initialCategory);
