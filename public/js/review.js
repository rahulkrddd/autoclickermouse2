// Declare orders globally
let orders = [];

// Fetch orders when the page loads
document.addEventListener("DOMContentLoaded", async function () {
    const ordersTable = document.getElementById("ordersTable");
    const ordersBody = document.getElementById("ordersBody");
    const loadingText = document.querySelector(".loading");

    try {
        // Fetch data from the server
        const response = await fetch('/review/getOrders', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch orders. Status: ${response.status}`);
        }

        // Populate the orders array with the fetched data
        orders = await response.json();

        // Sort orders by date (descending)
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));

        loadingText.style.display = "none";
        ordersTable.style.display = "table";

        // Populate the table with orders data
        orders.forEach((order) => {
            const row = document.createElement("tr");
			row.innerHTML = `
				<td class="mobile" onclick="showOrderDetails('${order.mobile}')">${order.mobile}</td>
				<td>${order.name}</td>
				<td class="pincode">${order.pincode}</td>
				<td>${order.date}</td>
				<td class="status">${order.current_status}</td>
				<td class="feedback">${order.feedback}</td>
			`;
			
            ordersBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        loadingText.textContent = "Failed to load orders.";
    }
});

// Search function to filter orders based on user input
function searchOrders() {
    const searchTerm = document.getElementById("searchBar").value.toLowerCase();
    const filteredOrders = orders.filter(order => {
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

    // Clear the table and render the filtered orders
    const ordersBody = document.getElementById("ordersBody");
    ordersBody.innerHTML = "";

    filteredOrders.forEach((order) => {
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


// Function to open a modal (for showing detailed information)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "block";
}

// Function to close the modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
}
