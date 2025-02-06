// Declare orders globally
let orders = [];

function searchOrders() {
    const searchTerm = document.getElementById("searchBar").value.toLowerCase();
	const filteredOrders = orders.filter(order => {
		// Search across multiple fields (e.g., mobile, name, pincode, address, order ID, etc.)
		return order.mobile.toLowerCase().includes(searchTerm) || 
			order.name.toLowerCase().includes(searchTerm) ||
			order.pincode.toLowerCase().includes(searchTerm) ||
			order.address.toLowerCase().includes(searchTerm) ||
			order.date.toLowerCase().includes(searchTerm) ||
			order.time.toLowerCase().includes(searchTerm) ||
			order.order_id.toLowerCase().includes(searchTerm) ||
			order.payment_id.toLowerCase().includes(searchTerm) ||
			order.current_status.toLowerCase().includes(searchTerm) ||
			(order.feedback && order.feedback.toLowerCase().includes(searchTerm)) ||
			order.feedback_timestamp.toLowerCase().includes(searchTerm) ||
			order.reusable_field1.toLowerCase().includes(searchTerm) ||
			order.reusable_field2.toLowerCase().includes(searchTerm);
	});
	

    // Clear the existing table rows
    ordersBody.innerHTML = "";

    // Display the filtered orders in the table
    filteredOrders.forEach((order, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="mobile" onclick="showOrderDetails('${order.mobile}')">${order.mobile}</td>
            <td>${order.name}</td>
            <td class="pincode" onclick="showLocation('${order.pincode}')">${order.pincode}</td>
            <td>${order.date}</td>
            <td class="status" onclick="showStatusUpdate('${order.order_id}', '${order.current_status}')">${order.current_status}</td>
            <td class="feedback" onclick="showFeedbackOptions('${order.feedback}')">${order.feedback}</td>
        `;
        ordersBody.appendChild(row);
    });

    // If no results are found, display a message
    if (filteredOrders.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = "<td colspan='6'>No orders found</td>";
        ordersBody.appendChild(row);
    }
}


document.addEventListener("DOMContentLoaded", async function () {
    const ordersTable = document.getElementById("ordersTable");
    const ordersBody = document.getElementById("ordersBody");
    const loadingText = document.querySelector(".loading");

    try {
        console.log("Sending GET request to the server to fetch order data...");

        // Send GET request to /admin/getOrders endpoint
        const response = await fetch('/admin/getOrders', { 
            method: "GET", 
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("API Response Status:", response.status); 
        
        if (!response.ok) {
            throw new Error(`Failed to fetch orders. Status: ${response.status}`);
        }

        // Populate the orders array with the server data
        orders = await response.json(); // Server data is stored in orders

        console.log("Orders data fetched:", orders);

        if (orders.length === 0) {
            console.log("No orders found.");
            loadingText.textContent = "No orders found.";
            return;
        }

        // Sort orders by date in descending order
        orders.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;  // This ensures the order is descending
        });

        loadingText.style.display = "none";
        ordersTable.style.display = "table";

        // Populate the table with data
		orders.forEach((order, index) => {
			console.log(`Populating row ${index + 1}:`, order);
			const row = document.createElement("tr");
			row.innerHTML = `
				<td class="mobile" onclick="showOrderDetails('${order.mobile}')">${order.mobile}</td>
				<td>${order.name}</td>
				<td class="pincode" onclick="showLocation('${order.pincode}')">${order.pincode}</td>
				<td>${order.date}</td>
				<td class="status" onclick="showStatusUpdate('${order.order_id}', '${order.current_status}', \`${order.reusable_field2 || ''}\`)">
					${order.current_status}
				</td>
				<td class="feedback" onclick="showFeedbackOptions('${order.feedback}')">${order.feedback}</td>
			`;
			ordersBody.appendChild(row);
		});


    } catch (error) {
        console.error("Error fetching orders:", error);
        loadingText.textContent = "Failed to load orders.";
    }
});


// Show all order details in a popup when clicking on the mobile number
function showOrderDetails(mobile) {
    // Find the order based on the mobile number from the global orders array
    const order = orders.find(order => order.mobile === mobile);

    if (order) {
		const orderDetails = `
			<div style="font-family: Arial, sans-serif; padding: 10px; border: 1px solid #ccc; border-radius: 8px; background: #f9f9f9;">
		
				<table style="width: 100%; border-collapse: collapse;">
					<tr><td><strong>Name:</strong></td><td>${order.name}</td></tr>
					<tr><td><strong>Mobile:</strong></td><td>${order.mobile}</td></tr>
					<tr><td><strong>Address:</strong></td><td>${order.address}</td></tr>
					<tr><td><strong>Date:</strong></td><td>${order.date}</td></tr>
					<tr><td><strong>Time:</strong></td><td>${order.time}</td></tr>
					<tr><td><strong>Pincode:</strong></td><td>${order.pincode}</td></tr>
					<tr><td><strong>Order ID:</strong></td><td>${order.order_id}</td></tr>
					<tr><td><strong>Payment ID:</strong></td><td>${order.payment_id}</td></tr>
					<tr><td><strong>Current Status:</strong></td><td>${order.current_status}</td></tr>
					<tr><td><strong>Feedback Shipping:</strong></td><td>${order.feedback && order.feedback.length > 0 && !isNaN(order.feedback.charAt(0)) ? order.feedback.charAt(0) : 'NA'}</td></tr>
					<tr><td><strong>Feedback Packaging:</strong></td><td>${order.feedback && order.feedback.length > 1 && !isNaN(order.feedback.charAt(1)) ? order.feedback.charAt(1) : 'NA'}</td></tr>
					<tr><td><strong>Feedback Product Satisfaction:</strong></td><td>${order.feedback && order.feedback.length > 2 && !isNaN(order.feedback.charAt(2)) ? order.feedback.charAt(2) : 'NA'}</td></tr>
					<tr><td><strong>Feedback Overall:</strong></td><td>${order.feedback && order.feedback.length > 3 && !isNaN(order.feedback.charAt(3)) ? order.feedback.charAt(3) : 'NA'}</td></tr>
					<tr><td><strong>Feedback Timestamp:</strong></td><td>${order.feedback_timestamp}</td></tr>
					<tr><td><strong>Recommendation:</strong></td><td>${order.reusable_field1}</td></tr>
					<tr><td><strong>Tracking Details:</strong></td><td>${order.reusable_field2}</td></tr>
				</table>
			</div>
		`;


        // Update the modal content with the order details
        document.getElementById("orderDetailsContent").innerHTML = orderDetails;
        openModal('orderDetailsModal');
    } else {
        console.error('Order not found for mobile:', mobile);
        alert('Order not found.');
    }
}






function showLocation(pincode) {
    console.log("Fetching location for pincode:", pincode); // Check the value
    openModal('pincodeModal');

    fetch(`/admin/getLocationByPincode?pincode=${pincode}`)
        .then(response => response.json())
        .then(data => {
            console.log('Location Data:', data); // Log response to check what is being returned
            if (data.success) {
				const locationInfo = `
					<table style="width: 100%; border-collapse: collapse;">
						<tr>
							<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Location:</td>
							<td style="padding: 8px; border: 1px solid #ddd;">${data.location}</td>
						</tr>
						<tr>
							<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">State:</td>
							<td style="padding: 8px; border: 1px solid #ddd;">${data.state}</td>
						</tr>
						<tr>
							<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">District:</td>
							<td style="padding: 8px; border: 1px solid #ddd;">${data.district}</td>
						</tr>
						<tr>
							<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Country:</td>
							<td style="padding: 8px; border: 1px solid #ddd;">${data.country}</td>
						</tr>
					</table>
				`;
				
                document.getElementById("pincodeInfo").innerHTML = locationInfo;
            } else {
                document.getElementById("pincodeInfo").innerHTML = "Location details not found for this pincode.";
            }
        })
        .catch(error => {
            console.error('Error fetching location:', error);
            document.getElementById("pincodeInfo").innerHTML = "Error fetching location details.";
        });
}


// Function to show the modal and reset the status dropdown
function showStatusUpdate(orderId, currentStatus, reusable_field2) {
    openModal('statusModal');

    // Select modal elements
    const statusDropdown = document.getElementById("statusDropdown");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");
    const trackingDetailsInput = document.getElementById("trackingDetails");

    // Ensure elements exist before using them
    if (!statusDropdown || !errorMessage || !successMessage || !trackingDetailsInput) {
        console.error("One or more modal elements not found.");
        return;
    }

    // Debugging: Log values to check if they are correctly received
    console.log(`Order ID: ${orderId}`);
    console.log(`Current Status: ${currentStatus}`);
    console.log(`Tracking Details (reusable_field2): ${reusable_field2}`);

    // Reset messages
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    successMessage.style.display = 'none';
    successMessage.textContent = '';

    // Pre-fill tracking details if available
    trackingDetailsInput.value = reusable_field2 ? reusable_field2 : '';  

    // Set default dropdown value if not matched
    if (![...statusDropdown.options].some(option => option.value === currentStatus)) {
        statusDropdown.value = "Order Placed";  // Default if status is not in dropdown
    } else {
        statusDropdown.value = currentStatus;
    }

    // Handle update button click
    const updateButton = document.getElementById('updateStatusBtn');
    if (updateButton) {
        updateButton.onclick = function() {
            let selectedStatus = statusDropdown.value; // Use 'let' here to allow reassignment
            const trackingDetails = trackingDetailsInput.value.trim(); // Get trimmed input value

            // Determine if status or tracking details were changed
            let statusChanged = false;
            let trackingDetailsChanged = false;

            if (selectedStatus !== currentStatus) {
                statusChanged = true;
            }

            if (trackingDetails !== reusable_field2) {
                trackingDetailsChanged = true;
            }

            // If tracking details are present and status is 'Order Placed', change status to 'Shipped'
            if (trackingDetails && currentStatus === 'Order Placed') {
                selectedStatus = 'Shipped'; // Reassigning selectedStatus to 'Shipped'
                statusChanged = true; // Status is now updated
            }

            // If the status is set to 'Shipped', no need to check for tracking details
            if (selectedStatus === 'Shipped') {
                statusChanged = true;
            }

            // Validate if either status or tracking details need to be updated
            if (!statusChanged && !trackingDetailsChanged) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = "Error: No changes detected. Status or Tracking Details must be updated.";
            } else {
                // Proceed with updating status and tracking details if any change was made
                updateStatus(orderId, selectedStatus, trackingDetails);
            }
        };
    } else {
        console.error("Update button not found.");
    }
}



// Function to update the status of the order along with trading details
function updateStatus(orderId, status, tradingDetails) {
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    // Reset error and success messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Make the API call to update the status and trading details
    fetch(`/admin/updateOrderStatus`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status, tradingDetails }), // Send trading details to the server
    })
    .then(response => {
        if (response.ok) {
            // Show success message inside the modal
            successMessage.style.display = 'block';
            successMessage.textContent = "Success: The status has been updated successfully to " + status + ".";

            // Wait before closing the modal to ensure the message is visible
            setTimeout(() => {
                closeModal('statusModal');
            }, 2000); // Adjust the timeout as needed
        } else {
            // Show error message inside the modal
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Error: Failed to update status. Please try again.';
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
        // Show error message inside the modal
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Error: Something went wrong while updating status.';
    });
}



// Show feedback options when clicking on feedback
function showFeedbackOptions(feedback) {
    const feedbackData = `
        <h3>Feedback Details</h3>
        <table>
            <tr>
                <td><strong>Feedback Shipping:</strong></td>
                <td>${feedback && feedback.length > 0 && !isNaN(feedback.charAt(0)) ? feedback.charAt(0) : 'NA'}</td>
            </tr>
            <tr>
                <td><strong>Feedback Packaging:</strong></td>
                <td>${feedback && feedback.length > 1 && !isNaN(feedback.charAt(1)) ? feedback.charAt(1) : 'NA'}</td>
            </tr>
            <tr>
                <td><strong>Feedback Product Satisfaction:</strong></td>
                <td>${feedback && feedback.length > 2 && !isNaN(feedback.charAt(2)) ? feedback.charAt(2) : 'NA'}</td>
            </tr>
            <tr>
                <td><strong>Feedback Overall:</strong></td>
                <td>${feedback && feedback.length > 3 && !isNaN(feedback.charAt(3)) ? feedback.charAt(3) : 'NA'}</td>
            </tr>
        </table>
    `;
    document.getElementById("feedbackOptionsContent").innerHTML = feedbackData;
    openModal('feedbackOptionsModal');
}


// Update the feedback value
function updateFeedback(newFeedback) {
    const orderId = 12345; // Use the correct order ID here
    fetch(`/updateFeedback`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, feedback: newFeedback }),
    })
    .then(response => {
        if (response.ok) {
            alert('Feedback updated successfully');
            closeModal('feedbackOptionsModal');
        } else {
            alert('Failed to update feedback');
        }
    })
    .catch(error => {
        console.error('Error updating feedback:', error);
        alert('Error updating feedback');
    });
}

// Open a modal by its ID
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

// Close a modal by its ID
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}
