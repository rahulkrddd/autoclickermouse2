// Get mobile number from URL
const urlParams = new URLSearchParams(window.location.search);
const mobileNumber = urlParams.get('mobileNumber');

// Global variables
let textFeedback, orderFeedback;

// Function to display order details
function displayOrderDetails(order) {
	document.getElementById('order-name').textContent = order.name;
	document.getElementById('order-mobile').textContent = order.mobile;
	document.getElementById('order-id').textContent = order.order_id;
	document.getElementById('payment-id').textContent = order.payment_id;
	document.getElementById('order-address').textContent = order.address;
	document.getElementById('order-pincode').textContent = order.pincode;
	document.getElementById('order-date').textContent = order.date;
	document.getElementById('order-time').textContent = order.time;
	let statusText = order.current_status === "Order Placed" ? "Order Confirmed" : order.current_status;
	document.getElementById('order-status').textContent = statusText;

	document.getElementById('tracking-id').textContent = order.reusable_field2 || "No tracking ID available.";
	let trackingElement = document.getElementById('tracking-id');
	let trackingValue = order.reusable_field2 || "No tracking ID available.";
	
	if (trackingValue.startsWith("http")) {
		trackingElement.innerHTML = `<a href="${trackingValue}" target="_blank" class="tracking-link">Track Your Order</a>`;
	} else {
		trackingElement.textContent = trackingValue;
	}

	// Assign values to global variables
	textFeedback = order.reusable_field1 || "No text feedback available.";
	orderFeedback = order.feedback !== 'NA' ? order.feedback : "No feedback yet.";

	// Set tracking progress
	const progressBar = document.getElementById('progress');
	if (order.current_status === 'Shipped') progressBar.style.width = '50%';
	else if (order.current_status === 'Delivered') progressBar.style.width = '100%';

	// Log the results in console
	console.log("Text Feedback:", textFeedback);
	console.log("Order Feedback:", orderFeedback);
}





function updateTrackingProgress(status) {
    const progressBar = document.getElementById('progress');

    // Define step percentages
    const steps = {
        "Order Placed": 40,
        "Order Confirmed": 40,
        "Shipped": 73,
        "Delivered": 100,
        "Returned": 100
    };

    // Get progress value based on status
    let progress = steps[status] || 50;
    
    console.log(`Current Status: ${status} | Calculated Progress: ${progress}%`);

    // Reset width to force reflow (Fix for progress bar update delay)
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    progressBar.offsetWidth;  // Trigger reflow

    // Apply new width after a small delay
    setTimeout(() => {
        progressBar.style.transition = "width 1.5s ease-in-out";
        progressBar.style.width = progress + "%";
        console.log(`Applied Width: ${progressBar.style.width}`);
    }, 50);

    // Add active class to steps
    setTimeout(() => {
        document.getElementById('step1').classList.add("active"); // Order Placed
        if (progress >= 40) document.getElementById('step2').classList.add("active"); // Order Confirmed
        if (progress >= 73) document.getElementById('step3').classList.add("active"); // Shipped
        if (progress >= 100) document.getElementById('step4').classList.add("active"); // Delivered

        // Show "Returned" step only when applicable
        if (status === "Returned") {
            document.getElementById('step5').classList.remove("hidden");
            document.getElementById('step5').classList.add("active");
        }
    }, 500);
}






//******************FEEDBACK********************************************************//
let ratings = { shipping: 0, packaging: 0, product: 0 };

// Global variable to store the current order
let currentOrder = null;

/**
 * Updates the state of the "Submit Feedback" button based on the feedback timestamp.
 * 
 * - Converts `currentOrder.feedback_timestamp` from IST to GMT by subtracting 5 hours and 30 minutes.
 * - Compares the adjusted feedback timestamp with the current GMT time.
 * - If the feedback is older than 7 days (7 * 24 * 60 * 60 seconds), the button is disabled.
 * - Otherwise, the button remains enabled to allow feedback updates.
 * - Logs the current timestamp (GMT), adjusted feedback timestamp (GMT), and the age of feedback in seconds to the console.
 */

function updateSubmitButtonState() {
    let feedbackValue = (currentOrder.feedback && currentOrder.feedback !== "NA") ? currentOrder.feedback.toString() : null;
    let reusableField = (currentOrder.reusable_field1 && currentOrder.reusable_field1 !== "NA") ? currentOrder.reusable_field1 : null;

    let submitButton = document.getElementById('submit-feedback-btn');

    // Get the feedback timestamp (IST), subtract 5:30 to convert to GMT
    let feedbackTimestampIST = new Date(currentOrder.feedback_timestamp);
    feedbackTimestampIST.setHours(feedbackTimestampIST.getHours() - 5);
    feedbackTimestampIST.setMinutes(feedbackTimestampIST.getMinutes() - 30);

    // Get current time in GMT
    let currentTimestampGMT = new Date();

    // Calculate the time difference in seconds
    let timeDiffInSeconds = Math.floor((currentTimestampGMT - feedbackTimestampIST) / 1000);

    // Print the timestamps and the time difference in seconds
    console.log("Current Timestamp (GMT):", currentTimestampGMT);
    console.log("Feedback Timestamp (IST converted to GMT):", feedbackTimestampIST);
    console.log("Time difference in seconds:", timeDiffInSeconds);

    // If the feedback timestamp is older than 7 days (7 days * 24 hours * 60 minutes * 60 seconds)
    const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

    if (timeDiffInSeconds > SEVEN_DAYS_IN_SECONDS) {
        submitButton.disabled = true;
        submitButton.style.backgroundColor = "#ccc"; // Gray disabled color
        submitButton.style.cursor = "not-allowed";
        submitButton.style.opacity = "0.6"; // Faded look
    } else {
        submitButton.disabled = false;
        submitButton.style.backgroundColor = "#007bff"; // Default enabled color (blue)
        submitButton.style.cursor = "pointer";
        submitButton.style.opacity = "1"; // Fully visible
    }
}




/**
 * Loads the default values for the feedback form based on the provided order data.
 * 
 * - Logs the received order data to the console for debugging.
 * - Stores the order data in the global `currentOrder` variable.
 * - Extracts and processes the feedback value and reusable field:
 *   - If `feedback` exists and is not "NA", it is parsed into individual rating values (shipping, packaging, product).
 *   - If `reusable_field1` exists and is not "NA", it is set as the default value for the feedback input field.
 * - Updates the UI elements:
 *   - Updates the rating stars based on extracted values.
 *   - Changes the feedback button text to "View your feedback" if valid feedback is present.
 * - Ensures the feedback input field is populated correctly.
 * - Calls `updateSubmitButtonState()` to update the submit button's enabled/disabled state.
 * - Logs the parsed feedback and ratings to the console for debugging.
 * 
 * This function should be called inside `loadDefaultValues` to ensure that UI elements are updated when data is loaded.
 */

function loadDefaultValues(order) {
    console.log("loadDefaultValues function called", order);

    if (!order) {
        console.error("Order data is undefined!");
        return;
    }

    console.log("Order Data Received:", order);

    // Store the order in the global variable
    currentOrder = order;

    let feedbackValue = (order.feedback && order.feedback !== "NA") ? order.feedback.toString() : null;
    let reusableField = (order.reusable_field1 && order.reusable_field1 !== "NA") ? order.reusable_field1 : null;

    console.log("Parsed Feedback Value:", feedbackValue);
    console.log("Parsed Reusable Field:", reusableField);

    if (feedbackValue && feedbackValue !== "NA" && feedbackValue.length >= 3) {
        ratings.shipping = parseInt(feedbackValue[0]) || 5;
        ratings.packaging = parseInt(feedbackValue[1]) || 5;
        ratings.product = parseInt(feedbackValue[2]) || 5;

        document.getElementById('feedback-btn').innerText = "View your feedback";
    }

    console.log("Final Ratings:", ratings);

    updateStars("shipping", ratings.shipping);
    updateStars("packaging", ratings.packaging);
    updateStars("product", ratings.product);

    let feedbackInput = document.getElementById('new-feedback');
    if (feedbackInput) {
        feedbackInput.value = reusableField || "";
    } else {
        console.error("Element with ID 'new-feedback' not found.");
    }

    // Update submit button state
    updateSubmitButtonState();
}




// Set star ratings
function setRating(category, value) {
    ratings[category] = value;
    updateStars(category, value);
}

// Highlight stars on hover
function hoverStars(category, value) {
    let stars = document.querySelectorAll(`#${category}-stars .star`);
    stars.forEach((star, index) => star.classList.toggle('hovered', index < value));
}

// Reset stars on mouse leave
function resetStars(category) {
    updateStars(category, ratings[category]);
}

// Update stars based on rating
function updateStars(category, value) {
    let stars = document.querySelectorAll(`#${category}-stars .star`);
    stars.forEach((star, index) => {
        star.classList.toggle('selected', index < value);
        star.classList.remove('hovered');
    });
}

/**
 * Submits the user feedback for the current order.
 * 
 * - Checks if `currentOrder` is defined; if not, logs an error and stops execution.
 * - Retrieves the feedback text from the input field (`new-feedback`).
 * - Logs the `currentOrder` object to the console for debugging.
 * - Sends a `POST` request to `/my-orders/submit-feedback` with the following data:
 *   - `shipping`, `packaging`, `product`: Captures ratings for different categories.
 *   - `feedback`: Includes the user-provided feedback text.
 *   - `order`: Passes the entire `currentOrder` object.
 * - Handles the API response:
 *   - If successful, displays a confirmation popup thanking the user.
 *   - If an error occurs, logs the error and shows a popup message prompting the user to retry.
 * 
 * This function ensures that feedback is properly submitted while providing debugging logs for tracking issues.
 */

function submitFeedback() {
    if (!currentOrder) {
        console.error("Order is not defined.");
        return;
    }

    const feedback = document.getElementById('new-feedback').value;
	console.log("order:", currentOrder); // Log the global order object


    // Make the API call to submit feedback, passing the entire order object
    fetch('/my-orders/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mobileNumber: window.mobileNumber || "Unknown", // Ensure mobileNumber is defined
            shipping: ratings.shipping,
            packaging: ratings.packaging,
            product: ratings.product,
            feedback: feedback,
            order: currentOrder // Pass the global order object
        })
    })
    .then(response => response.json())
    .then(data => {
        showPopup("Thank you for your feedback, Warranty claimed!");
        // Optionally, handle the response here (e.g., updating UI)
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        showPopup("Error submitting feedback. Please try again.");
    });
}

// Show the custom popup with a message
function showPopup(message) {
    const popup = document.getElementById('Mpopup');
    const popupMessage = document.getElementById('popup-message');
    popupMessage.textContent = message; // Set the message in the popup
    popup.style.display = 'flex'; // Show the popup
    
    // Close the popup automatically after 3 seconds
    setTimeout(() => {
        closePopup();
    }, 3000); // 3000 milliseconds = 3 seconds
}

// Close the popup
function closePopup() {
    const popup = document.getElementById('Mpopup');
    popup.style.display = 'none'; // Hide the popup
}


// Example call to loadDefaultValues with order data
const orderData = { 
    feedback: "", 
    reusable_field1: "Some reusable data", 
    reusable_field2: "Tracking ID 12345", 
    // other fields like current_status
};
loadDefaultValues(orderData);


/**
 * Toggles the visibility of the feedback content.
 * 
 * - Checks if feedback exists based on the flip button's text.
 * - If feedback exists, displays the feedback content and card.
 * - Otherwise, hides the flip button and shows the feedback form.
 */
function flipContent() {
    var flipButton = document.querySelector('.flip-btn');
    var flippedContent = document.getElementById('flipped-content');
    var feedbackCard = document.getElementById('feedback-card');

    // Check if feedback exists
    if (flipButton.innerText === "View your feedback") {
        // If feedback already exists, show it and flip the card
        flippedContent.style.display = 'block';
        feedbackCard.style.display = 'block';
    } else {
        // Otherwise, show the form to submit feedback
        flipButton.style.display = 'none';
        flippedContent.style.display = 'block';
        feedbackCard.style.display = 'block';
    }
}

//******************FEEDBACK********************************************************//




let totalOrders = 5;  // Change this based on real data
let currentOrderIndex = new URLSearchParams(window.location.search).get("orderIndex") || 1;
let totalRecordSets = 1;  // Default value before fetch

// Function to update the "Next Order" and "Previous Order" buttons based on the current order index
/**
 * Updates "Next" and "Previous" order buttons based on the current order index.  
 * Disables "Next" if the last order is reached and hides "Previous" for the first order.  
 * Adjusts navigation when moving between orders.  
 */
function updateOrderButtons() {
    const nextButton = document.getElementById("next-order");

    // Disable the "Next Order" button if we've reached the last set
    if (currentOrderIndex >= totalRecordSets) {
        nextButton.disabled = true; // Disable button
    } else {
        nextButton.disabled = false; // Enable button
    }

    // Hide "Previous Order" button if it's the first order
    const prevButton = document.getElementById("prev-order");
    if (currentOrderIndex == 1) {
        prevButton.style.display = "none";
    } else {
        prevButton.style.display = "inline-block";
    }
}

// Function to handle the "Previous Order" action
function previousOrder() {
    if (currentOrderIndex > 1) {
        currentOrderIndex--;  // Decrease the current order index
        window.location.href = `/my-orders?mobileNumber=${mobileNumber}&orderIndex=${currentOrderIndex}`;
        updateOrderButtons();  // Update buttons after navigating
    }
}

// Function to handle the "Next Order" action
function nextOrder() {
    if (currentOrderIndex < totalRecordSets) {
        currentOrderIndex++;  // Increase the current order index
        window.location.href = `/my-orders?mobileNumber=${mobileNumber}&orderIndex=${currentOrderIndex}`;
        updateOrderButtons();  // Update buttons after navigating
    }
}

// Fetch orders and handle order details
/**  
 * Fetches orders for the given mobile number and processes them.  
 * Divides orders into record sets and updates tracking information.  
 * Initializes ratings and displays order details on the page.  
 * Extracts a subset of orders for the current set and processes them.  
 * Updates navigation buttons based on the available orders.  
 */

fetch('/my-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber: mobileNumber })
})
.then(response => response.json())
.then(data => {
    if (data.orders && data.orders.length > 0) {
        console.log("Order data received:", data.orders); // Debugging log

        // Define the number of records per set (assuming 5 sets)
        const recordsPerSet = Math.ceil(data.orders.length / 5);

        // Calculate the total number of record sets
        totalRecordSets = Math.ceil(data.orders.length / recordsPerSet);
        console.log("Total record sets:", totalRecordSets);

        // Set the value of recordSet (1 to 5)
        let recordSet = currentOrderIndex; // You can change this value to switch between different sets of records.

        // Get the start and end index for the current set
        const startIndex = (recordSet - 1) * recordsPerSet;
        const endIndex = recordSet * recordsPerSet;

        // Get the subset of orders for the current set
        const ordersSubset = data.orders.slice(startIndex, endIndex);

        // Process the subset of orders (for the current set)
        ordersSubset.forEach(order => {
            // Update tracking ID
            document.getElementById('tracking-id').textContent = order.reusable_field2 || "No tracking ID available.";
            updateTrackingProgress(order.current_status);

            // Call loadDefaultValues to initialize ratings
            loadDefaultValues(order);

            // Display order details
            displayOrderDetails(order);
        });

        // After processing the orders, update the buttons
        updateOrderButtons();

    } else {
        alert('No orders found for this mobile number!');
    }
})
.catch(error => console.error('Error fetching order details:', error));


//LOGOUT

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    // Logout button click handler
    logoutButton.addEventListener('click', () => {
        // Clear session data from localStorage or sessionStorage
        localStorage.removeItem('mobileNumber');  // or sessionStorage.removeItem('mobileNumber');
        
        // Redirect to home page where Xpopup should show
        window.location.href = '/';
    });
});

//LOGOUT


//REORDER 
function redirectToHome() {
    if (!currentOrder) {
        console.error("No order data available!");
        return;
    }

    // Store order details in localStorage
    localStorage.setItem("orderData", JSON.stringify({
        name: currentOrder.name,
        address: currentOrder.address,
        pincode: currentOrder.pincode,
        mobile: currentOrder.mobile
    }));

    // Store flag to indicate that the modal should open immediately
    localStorage.setItem("showPopup", "true");

    // Redirect to index.html
    window.location.href = "/";
}

//REORDER 



document.addEventListener('DOMContentLoaded', function () {
    const buttonContainer = document.querySelector('.button-container');
    const buttons = buttonContainer.querySelectorAll('button');

    // Get button order (index) based on the number of buttons
    if (buttons.length === 3) {
        // Swap button 3 and button 2 when there are only 3 buttons
        buttons[1].style.order = 3;
        buttons[2].style.order = 2;
    } else if (buttons.length === 4) {
        // Reset order to default for 4 buttons
        buttons[0].style.order = 1;  // Home
        buttons[1].style.order = 2;  // Reorder
        buttons[2].style.order = 3;  // Previous Order
        buttons[3].style.order = 4;  // Next Order
    }
});
