let currentPage = 1;
const reviewsPerPage = 3;  // Set reviews per page to 3

// Modified function to handle pagination
document.addEventListener("DOMContentLoaded", async function () {
    const reviewsContainer = document.getElementById("reviews-container");
    const loadingText = document.querySelector(".loading");

    try {
        const response = await fetch('/review/getOrders');
        if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`);

        const orders = await response.json();
        loadingText.style.display = "none";

        // Filter out reviews with "NA"
        const filteredOrders = orders.filter(order => order.feedback !== "NA");

        // Get the total number of pages
        const totalPages = Math.ceil(filteredOrders.length / reviewsPerPage);

        // Function to load reviews for the current page
        function loadReviews(page) {
            reviewsContainer.innerHTML = ""; // Clear previous reviews
            const startIndex = (page - 1) * reviewsPerPage;
            const endIndex = Math.min(page * reviewsPerPage, filteredOrders.length);
            const reviewsToShow = filteredOrders.slice(startIndex, endIndex);

            reviewsToShow.forEach(order => {
                const reviewCard = document.createElement("div");
                reviewCard.classList.add("review-card");

                // Masked mobile number
                const maskedMobile = maskMobile(order.mobile);

                // Handling tracking details
                let trackingDetailsContent;
                if (order.reusable_field2.startsWith("http")) {
                    trackingDetailsContent = `
                        <button class="tracking-btn" onclick="window.open('${order.reusable_field2}', '_blank')">Track Order</button>
                    `;
                } else {
                    trackingDetailsContent = `
                        <button class="tracking-toggle-btn" onclick="revealTrackingDetails(this)">TRACK ORDER</button>
                        <span class="tracking-details" style="display: none;">${order.reusable_field2}</span>
                    `;
                }

                // Add the review content to the card
		//CHANGE - 2025/MARCH TO HIDE ADDRESS - Changing- "<p class="address">${order.address}, ${order.pincode}</p>" to "<p class="address"> ${order.pincode}</p>" to <p class="address">Pincode : ${order.pincode}</p>
                reviewCard.innerHTML = `
                    <div class="review-header">
                        <h3>${order.name} <span class="details">(<span class="mobile-prefix">${order.mobile.slice(0, -3)}</span><span class="mobile-blur">${order.mobile.slice(-3)}</span>)</span></h3>
                        <p class="address">Pincode : ${order.pincode}</p>
                        <p><strong>Order Date:</strong> ${order.date}</p>
                    </div>

                    <div class="rating">
                        <div class="rating-item">
                            <strong>Shipping:</strong>
                            <div class="stars">${getStars(order.feedback.charAt(0))}</div>
                        </div>
                        <div class="rating-item">
                            <strong>Packaging:</strong>
                            <div class="stars">${getStars(order.feedback.charAt(1))}</div>
                        </div>
                        <div class="rating-item">
                            <strong>Quality:</strong>
                            <div class="stars">${getStars(order.feedback.charAt(2))}</div>
                        </div>
                        <div class="rating-item">
                            <strong>Overall:</strong>
                            <div class="stars">${getStars(order.feedback.charAt(3))}</div>
                        </div>
                    </div>

                    <div class="tracking-details-container">
                        <strong>Tracking Details:</strong>
                        ${trackingDetailsContent}
                    </div>

                    <div class="review-feedback">
                        <strong>Feedback:</strong>
                        <span class="feedback-text">${order.reusable_field1}</span>
                    </div>

                    <div class="more-details">
                        <a href="#" class="more-details-link" onclick="showMoreDetails('${order.name}', '${order.current_status}', '${order.order_id}')">... More Details</a>
                    </div>
                `;

                reviewsContainer.appendChild(reviewCard);
            });
        }

		// Function to handle pagination controls
		function renderPagination(totalPages) {
			const paginationContainer = document.getElementById("pagination-container");
			paginationContainer.innerHTML = ""; // Clear previous pagination buttons
		
			// Previous page button
			const prevButton = document.createElement("button");
			prevButton.textContent = "Previous";
			prevButton.disabled = currentPage === 1;
			prevButton.onclick = () => {
				if (currentPage > 1) {
					currentPage--;
					loadReviews(currentPage);
					renderPagination(totalPages);
				}
			};
		
			// Next page button
			const nextButton = document.createElement("button");
			nextButton.textContent = "Next";
			nextButton.disabled = currentPage === totalPages;
			nextButton.onclick = () => {
				if (currentPage < totalPages) {
					currentPage++;
					loadReviews(currentPage);
					renderPagination(totalPages);
				}
			};
		
			paginationContainer.appendChild(prevButton);
			paginationContainer.appendChild(nextButton);
		}
 
        // Load reviews for the current page
        loadReviews(currentPage);
        renderPagination(totalPages);

    } catch (error) {
        console.error("Error fetching reviews:", error);
        loadingText.textContent = "Failed to load reviews.";
    }
});





// Function to mask the last three digits of the mobile number
function maskMobile(mobile) {
    if (!mobile || mobile.length < 3) return mobile;
    return mobile.slice(0, -3) + "***";
}



// Function to show more details in a popup
function showMoreDetails(name, status, orderId) {
    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("modal-content");

    // Fill modal with the selected order details
    modalContent.innerHTML = `
        <h3 class="modal-title">📦 Order Details</h3>
        <p><strong>Name:</strong> <span>${name}</span></p>
        <p><strong>Status:</strong> <span class="${getStatusClass(status)}">${status}</span></p>
        <p><strong>Order ID:</strong> <span>${orderId}</span></p>
        <button class="modal-close-btn" onclick="closeModal()">✖ </button>
    `;

    // Show the modal and apply background blur
    modal.classList.add("popup-active");
    document.body.classList.add("blur-background");
}

// Function to determine status color class
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case "delivered": return "status-delivered";
        case "shipped": return "status-shipped";
        case "processing": return "status-processing";
        case "cancelled": return "status-cancelled";
        default: return "status-default";
    }
}

// Function to close modal
function closeModal() {
    document.getElementById("details-modal").classList.remove("popup-active");
    document.body.classList.remove("blur-background");
}




// Helper function to generate star ratings with SVG icons
function getStars(rating) {
    let stars = "";
    const starSize = 20; // Set the size for the stars

    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            // Filled star SVG
            stars += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${starSize}" height="${starSize}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#f39c12"/></svg>`;
        } else {
            // Empty star SVG
            stars += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${starSize}" height="${starSize}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="#dcdcdc" stroke-width="2"/></svg>`;
        }
    }
    return stars;
}




// Function to reveal the tracking details if it's text only
function revealTrackingDetails(button) {
    const details = button.nextElementSibling;
    button.style.display = "none"; // Hide the button
    details.style.display = "inline"; // Show the tracking details inline
}
