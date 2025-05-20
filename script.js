// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {

    // Get the buttons
    const donorBtn = document.querySelector(".donor-btn");
    const receiverBtn = document.querySelector(".receiver-btn");

    // Redirect on button click
    donorBtn.addEventListener("click", function () {
        window.location.href = "donate.html"; // Change to your actual donate page
    });

    receiverBtn.addEventListener("click", function () {
        window.location.href = "search.html"; // Change to your actual search page
    });

    // Smooth animation effect on hover
    const buttons = document.querySelectorAll("button");
    buttons.forEach(button => {
        button.addEventListener("mouseenter", function () {
            this.style.transform = "scale(1.1)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "scale(1)";
        });
    });

});


document.addEventListener("DOMContentLoaded", () => {
    const foodGallery = document.getElementById("foodGallery");
    const searchBox = document.getElementById("searchBox");

    // Sample food images
    const foods = [
        { name: "food1", src: "pictures/food (1).jpeg" },
        { name: "food1", src: "pictures/food (3).jpeg" },
        { name: "food1", src: "pictures/food (5).jpeg" },
        { name: "food1", src: "pictures/food (10).jpeg" },
        { name: "food1", src: "pictures/food (14).jpeg" },
        { name: "food1", src: "pictures/food (11).jpeg" },
        { name: "food1", src: "pictures/food (9).jpeg" },
        { name: "food1", src: "pictures/food (4).jpeg" },
        { name: "food1", src: "pictures/food (7).jpeg" },
        { name: "food1", src: "pictures/food (12).jpeg" },
        { name: "food1", src: "pictures/Donation (3).jpeg" },
        { name: "food1", src: "pictures/Donation (4).jpeg" },
        { name: "food1", src: "pictures/Donation.jpeg" },
        { name: "food1", src: "pictures/food (3).jpeg" },
    
    ];

    // Function to display images
    function displayImages(images) {
        foodGallery.innerHTML = "";
        images.forEach(food => {
            const img = document.createElement("img");
            img.src = food.src;
            img.alt = food.name;
            foodGallery.appendChild(img);
        });
    }

    // Initial display
    displayImages(foods);

    // Search functionality
    searchBox.addEventListener("input", () => {
        const query = searchBox.value.toLowerCase();
        const filteredFoods = foods.filter(food => food.name.toLowerCase().includes(query));
        displayImages(filteredFoods);
    });
});


document.addEventListener("DOMContentLoaded", function () {

    // Handle donor form submission
        const donorForm = document.getElementById('donationForm');
    
        if (donorForm) {
            donorForm.addEventListener('submit', async function (event) {
                event.preventDefault();
    
                const formData = {
                    donorname: document.getElementById("donorname").value,
                    foodType: document.getElementById('foodType').value,
                    quantity: parseInt(document.getElementById('quantity').value), // Ensure quantity is an integer
                    location: document.getElementById('location').value,
                    contact: document.getElementById('contact').value,
                    expiry: document.getElementById('expiry').value // Ensure format is YYYY-MM-DD HH:MM:SS
                };
    
                try {
                    const response = await fetch('http://localhost:5000/api/donate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });
    
                    const result = await response.json();
                    alert(result.message); 
    
                    if (response.ok) {
                        //donorForm.reset();
                        window.location.href = `thankyou.html?donationNumber=${result.donationNumber}`;
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to submit donation.');
                }
            });
        }

  
         

    // Handle search functionality
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", function () {
            const location = document.getElementById("searchLocation").value.trim();

            if (!location) {
                alert("Please enter a location.");
                return;
            }

            // Redirect to results.html with the search location in URL
            window.location.href = `results.html?location=${encodeURIComponent(location)}`;
        });
    }

    /*const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", async function () {
            const location = document.getElementById("searchLocation").value.trim();
            const resultsDiv = document.getElementById("results");

            if (!location) {
                resultsDiv.innerHTML = "<p>Please enter a location.</p>";
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/search?location=${encodeURIComponent(location)}`);
                const data = await response.json();

                if (data.length > 0) {
                    resultsDiv.innerHTML = data.map(item =>
                        `<div class="result-item">
                            <p><strong>Food:</strong> ${item.food_type}</p>
                            <p><strong>Quantity:</strong> ${item.quantity}</p>
                            <p><strong>Location:</strong> ${item.location}</p>
                            <p><strong>Contact:</strong> ${item.contact_info}</p>
                            <p><strong>Expiry Date:</strong> ${item.expiry_time}</p>
                        </div>`
                    ).join("");
                } else {
                    resultsDiv.innerHTML = "<p>No food available in this location.</p>";
                }
            } catch (error) {
                console.error("Error:", error);
                resultsDiv.innerHTML = "<p>Something went wrong. Please try again.</p>";
            }
        });
    }*/
});

document.getElementById('contactForm').addEventListener('submit', async function (event) {
   // event.preventDefault(); // Prevent page refresh

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value, // New phone field
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/contact', { // Adjust port if needed
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        alert(result.message); // Show success or error message
        if (result.success) document.getElementById('contactForm').reset();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send message. Please try again later.');
    }
});

