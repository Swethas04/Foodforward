/** Shared food category, dietary, and allergen definitions for FoodForward */
const FOOD_CATEGORIES = [
    "Prepared Meals",
    "Baked Goods",
    "Fruits & Vegetables",
    "Dairy & Eggs",
    "Grains & Pasta",
    "Canned & Packaged",
    "Beverages",
    "Snacks",
    "Other"
];

const DIETARY_OPTIONS = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "Dairy-Free"
];

const ALLERGEN_OPTIONS = [
    "Peanuts",
    "Tree Nuts",
    "Milk",
    "Eggs",
    "Wheat",
    "Soy",
    "Fish",
    "Shellfish",
    "Sesame"
];

function formatTagList(value) {
    if (!value || value === "None") return "None listed";
    return value.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
}

function getCheckedCheckboxValues(form, name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function populateFoodCategorySelect(selectEl, includeAllOption) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    if (includeAllOption) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "All categories";
        selectEl.appendChild(opt);
    }
    FOOD_CATEGORIES.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        selectEl.appendChild(opt);
    });
}

function buildCheckboxGroup(container, name, options, hint) {
    if (!container) return;
    container.innerHTML = "";
    if (hint) {
        const p = document.createElement("p");
        p.className = "field-hint";
        p.textContent = hint;
        container.appendChild(p);
    }
    const grid = document.createElement("div");
    grid.className = "checkbox-grid";
    options.forEach((label) => {
        const id = `${name}-${label.replace(/\s+/g, "-").toLowerCase()}`;
        const wrap = document.createElement("label");
        wrap.className = "checkbox-item";
        wrap.htmlFor = id;
        wrap.innerHTML = `<input type="checkbox" id="${id}" name="${name}" value="${label}"> <span>${label}</span>`;
        grid.appendChild(wrap);
    });
    container.appendChild(grid);
}

function foodImageUrl(imagePath) {
    if (!imagePath) return null;
    const base = typeof window !== "undefined" && window.API_BASE !== undefined ? window.API_BASE : "";
    const path = imagePath.startsWith("/") ? imagePath : `/uploads/${imagePath}`;
    return `${base}${path}`;
}

function renderFoodImage(imagePath, altText) {
    const url = foodImageUrl(imagePath);
    if (!url) {
        return '<div class="food-photo-placeholder">No photo</div>';
    }
    const alt = altText ? String(altText).replace(/"/g, "&quot;") : "Food photo";
    return `<img class="food-photo" src="${url}" alt="${alt}" loading="lazy">`;
}

function renderFoodMetaBadges(category, dietaryInfo, allergenInfo) {
    let html = "";
    if (category) {
        html += `<span class="badge badge-category">${category}</span>`;
    }
    const diets = dietaryInfo ? dietaryInfo.split(",").map((s) => s.trim()).filter(Boolean) : [];
    diets.forEach((d) => {
        html += `<span class="badge badge-diet">${d}</span>`;
    });
    const allergens = allergenInfo ? allergenInfo.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (allergens.length) {
        html += `<p class="allergen-warning"><strong>Contains allergens:</strong> ${allergens.join(", ")}</p>`;
    } else {
        html += `<p class="allergen-safe">No allergens declared by donor</p>`;
    }
    return html;
}
