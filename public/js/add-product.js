document.getElementById("confirm-button").addEventListener("click", function() {
    var author = document.getElementById("author").value;
    var publicationDate = document.getElementById("publication-date").value;
    var productName = document.getElementById("product-name").value;
    var category = document.getElementById("category").value;
    var quantity = document.getElementById("quantity").value;
    var regularPrice = document.getElementById("regular-price").value;
    var salePrice = document.getElementById("sale-price").value;
    var description = document.getElementById("description").value;
    
    var imageFile = document.getElementById("image").files[0];
    var formData = new FormData();
    formData.append("image", imageFile);

    fetch('/submit-product', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle response data
        console.log(data);
    })
    .catch(error => {
        console.error('There was a problem adding the product:', error);
    });
});
