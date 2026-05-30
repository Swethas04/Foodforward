/** Star rating UI and review display helpers */

function renderStarInput(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hidden = document.getElementById(hiddenInputId);
    if (!container || !hidden) return;

    container.innerHTML = "";
    container.className = "star-input";

    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "star-btn";
        btn.dataset.value = String(i);
        btn.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
        btn.innerHTML = "&#9734;";
        btn.addEventListener("click", () => setStarValue(container, hidden, i));
        btn.addEventListener("mouseenter", () => highlightStars(container, i));
        container.appendChild(btn);
    }

    container.addEventListener("mouseleave", () => {
        const current = parseInt(hidden.value, 10) || 0;
        highlightStars(container, current);
    });
}

function setStarValue(container, hidden, value) {
    hidden.value = String(value);
    highlightStars(container, value);
}

function highlightStars(container, upTo) {
    container.querySelectorAll(".star-btn").forEach((btn) => {
        const val = parseInt(btn.dataset.value, 10);
        const filled = val <= upTo;
        btn.classList.toggle("filled", filled);
        btn.innerHTML = filled ? "&#9733;" : "&#9734;";
    });
}

function renderStarDisplay(rating, max = 5) {
    const r = Math.round(parseFloat(rating) || 0);
    let html = '<span class="star-display" aria-label="' + r + ' out of ' + max + ' stars">';
    for (let i = 1; i <= max; i++) {
        html += `<span class="star ${i <= r ? "filled" : ""}">${i <= r ? "&#9733;" : "&#9734;"}</span>`;
    }
    html += "</span>";
    return html;
}

function formatReviewDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function renderDonorRatingBadge(avgRating, reviewCount) {
    if (!reviewCount || reviewCount === 0) {
        return '<p class="donor-rating none">No reviews yet for this donor</p>';
    }
    const avg = Number(avgRating).toFixed(1);
    return `<div class="donor-rating">
        ${renderStarDisplay(avg)}
        <span class="rating-text">${avg} (${reviewCount} review${reviewCount === 1 ? "" : "s"})</span>
    </div>`;
}
