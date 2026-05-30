// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {

    // Get the buttons
    const donorBtn = document.querySelector(".donor-btn");
    const receiverBtn = document.querySelector(".receiver-btn");

    if (donorBtn) {
        donorBtn.addEventListener("click", function () {
            window.location.href = "donate.html";
        });
    }

    if (receiverBtn) {
        receiverBtn.addEventListener("click", function () {
            window.location.href = "search.html";
        });
    }

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
    if (!foodGallery) return;

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

    displayImages(foods);

    if (searchBox) {
        searchBox.addEventListener("input", () => {
            const query = searchBox.value.toLowerCase();
            const filteredFoods = foods.filter((food) => food.name.toLowerCase().includes(query));
            displayImages(filteredFoods);
        });
    }
});


function initDonateFoodMeta() {
    const categorySelect = document.getElementById("foodCategory");
    if (categorySelect) {
        populateFoodCategorySelect(categorySelect, false);
    }
    buildCheckboxGroup(
        document.getElementById("dietaryOptions"),
        "dietary",
        DIETARY_OPTIONS,
        "Mark diets this donation is suitable for."
    );
    buildCheckboxGroup(
        document.getElementById("allergenOptions"),
        "allergens",
        ALLERGEN_OPTIONS,
        "Mark allergens that are in this food."
    );

    const noAllergens = document.getElementById("noAllergens");
    if (noAllergens) {
        noAllergens.addEventListener("change", () => {
            if (noAllergens.checked) {
                document.querySelectorAll('input[name="allergens"]').forEach((el) => {
                    el.checked = false;
                    el.disabled = true;
                });
            } else {
                document.querySelectorAll('input[name="allergens"]').forEach((el) => {
                    el.disabled = false;
                });
            }
        });
        document.querySelectorAll('input[name="allergens"]').forEach((el) => {
            el.addEventListener("change", () => {
                if (el.checked) {
                    noAllergens.checked = false;
                    document.querySelectorAll('input[name="allergens"]').forEach((a) => {
                        a.disabled = false;
                    });
                }
            });
        });
    }
}

function initSearchFoodMeta() {
    populateFoodCategorySelect(document.getElementById("filterCategory"), true);
    buildCheckboxGroup(document.getElementById("filterDietary"), "filterDietary", DIETARY_OPTIONS);
    buildCheckboxGroup(document.getElementById("filterAllergens"), "filterAllergens", ALLERGEN_OPTIONS);
}

document.addEventListener("DOMContentLoaded", function () {
    initDonateFoodMeta();
    initSearchFoodMeta();

    // Handle donor form submission
        const donorForm = document.getElementById('donationForm');
    
        const foodImageInput = document.getElementById("foodImage");
        const imagePreview = document.getElementById("imagePreview");
        const previewImg = document.getElementById("previewImg");
        const clearImageBtn = document.getElementById("clearImage");

        if (foodImageInput && imagePreview && previewImg) {
            foodImageInput.addEventListener("change", () => {
                const file = foodImageInput.files[0];
                if (!file) {
                    imagePreview.hidden = true;
                    return;
                }
                previewImg.src = URL.createObjectURL(file);
                imagePreview.hidden = false;
            });
        }

        if (clearImageBtn && foodImageInput && imagePreview) {
            clearImageBtn.addEventListener("click", () => {
                foodImageInput.value = "";
                previewImg.src = "";
                imagePreview.hidden = true;
            });
        }

        if (donorForm) {
            donorForm.addEventListener('submit', async function (event) {
                event.preventDefault();

                const dietary = getCheckedCheckboxValues(donorForm, "dietary");
                const allergens = document.getElementById("noAllergens")?.checked
                    ? ""
                    : getCheckedCheckboxValues(donorForm, "allergens").join(",");

                const payload = {
                    donorname: document.getElementById("donorname").value.trim(),
                    foodCategory: document.getElementById("foodCategory").value,
                    foodType: document.getElementById("foodType").value.trim(),
                    dietaryInfo: dietary.join(","),
                    allergenInfo: allergens,
                    quantity: document.getElementById("quantity").value,
                    location: document.getElementById("location").value.trim(),
                    contact: document.getElementById("contact").value.trim(),
                    expiry: document.getElementById("expiry").value,
                };

                if (!payload.foodCategory) {
                    alert("Please select a food category from the dropdown.");
                    return;
                }
                if (!payload.expiry) {
                    alert("Please set the food expiry date and time.");
                    return;
                }

                const imageFile = foodImageInput?.files?.[0];
                let fetchOptions;

                if (imageFile) {
                    const formData = new FormData();
                    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
                    formData.append("foodImage", imageFile);
                    fetchOptions = { method: "POST", body: formData };
                } else {
                    fetchOptions = {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    };
                }

                try {
                    const response = await fetch(apiUrl("/api/donate"), fetchOptions);
                    const result = await response.json();
                    alert(result.message);

                    if (response.ok) {
                        window.location.href = `thankyou.html?donationNumber=${result.donationNumber}`;
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert("Failed to submit donation. Use http://localhost:5000 and ensure node server.js is running.");
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

            const params = new URLSearchParams({ location });
            const category = document.getElementById("filterCategory")?.value;
            if (category) params.set("category", category);

            const dietary = getCheckedCheckboxValues(document, "filterDietary");
            if (dietary.length) params.set("dietary", dietary.join(","));

            const excludeAllergens = getCheckedCheckboxValues(document, "filterAllergens");
            if (excludeAllergens.length) params.set("excludeAllergens", excludeAllergens.join(","));

            window.location.href = `results.html?${params.toString()}`;
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
                const response = await fetch(apiUrl(`/api/search?location=${encodeURIComponent(location)}`));
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

const contactFormEl = document.getElementById("contactForm");
if (contactFormEl) {
    contactFormEl.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            message: document.getElementById("message").value,
        };

        try {
            const response = await fetch(apiUrl("/api/contact"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            alert(result.message);
            if (result.success) contactFormEl.reset();
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to send message. Please try again later.");
        }
    });
}

