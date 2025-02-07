const express = require('express');
const axios = require('axios');
const path = require('path');
const router = express.Router();
require('dotenv').config();  // Load environment variables

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_REPO = process.env.GITHUB_REPO;  // e.g., 'username/repository-name'
const FILE_PATH = process.env.PAYMENT;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;  // GitHub Personal Access Token

// Serve the orders page (GET request)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/orders.html'));
});

// Function to fetch JSON data from GitHub
async function fetchOrdersFromGitHub() {
    try {
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        if (!response.data || !response.data.content) {
            return null;
        }

        const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error fetching orders from GitHub:', error);
        return null;
    }
}

// Function to parse date and time into a timestamp
function parseDateTime(date, time) {
    // Combine the date and time into a single string and convert it to a Date object
    const formattedDate = `${date} ${time}`;
    return new Date(formattedDate);
}

// Handle POST request for fetching order details
router.post('/', async (req, res) => {
    //console.log('Received request for order details:', req.body);

    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ message: 'Mobile number is required' });
        }

        const orders = await fetchOrdersFromGitHub();
        if (!orders) {
            return res.status(500).json({ message: 'Error fetching orders from GitHub' });
        }

        // Find all orders matching the mobile number
        const matchingOrders = orders.filter(order => order.mobile === mobileNumber);

        if (matchingOrders.length === 0) {
            return res.status(404).json({ message: 'No order found for this mobile number' });
        }

        // Sort orders by date and time in descending order
        matchingOrders.sort((a, b) => {
            const dateTimeA = parseDateTime(a.date, a.time);
            const dateTimeB = parseDateTime(b.date, b.time);

            // Sort by timestamp in descending order
            return dateTimeB - dateTimeA;
        });

        //console.log('Sorted Order Details:', matchingOrders);
        res.status(200).json({ message: 'Order details found', orders: matchingOrders });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Handle POST request for submitting feedback
router.post('/submit-feedback', async (req, res) => {
    const { mobileNumber, shipping, packaging, product, feedback, order } = req.body;

    // Validate incoming order data
    if (!order || !order.order_id) {
        return res.status(400).json({ error: 'Order data is missing or invalid' });
    }

    // Ensure ratings are treated as numbers to prevent concatenation issues
    const shippingRating = Number(shipping) || 0;
    const packagingRating = Number(packaging) || 0;
    const productRating = Number(product) || 0;

    // Calculate the average rating
    const averageRating = Math.ceil((shippingRating + packagingRating + productRating) / 3);
    const combinedFeedback = `${shippingRating}${packagingRating}${productRating}${averageRating}`;

    // Get current timestamp in IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const currentTimestamp = new Date(Date.now() + istOffset).toISOString();

    // Update order details
    order.feedback = combinedFeedback;
    order.reusable_field1 = feedback || order.reusable_field1;
    order.feedback_timestamp = currentTimestamp;

    try {
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        
        // **Step 1: Fetch the latest file content and SHA**
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        const data = response.data;
        const latestSHA = data.sha; // Fetch the latest SHA to avoid conflicts

        // Decode and parse JSON file content
        let orders = [];
        try {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            orders = JSON.parse(fileContent);
        } catch (err) {
            console.error("Error parsing file content:", err);
            return res.status(500).json({ error: "Invalid file format on GitHub" });
        }

        // Find and update the order
        const orderIndex = orders.findIndex(o => o.order_id === order.order_id);
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found in the file' });
        }
        orders[orderIndex] = order;

        // Prepare new file content
        const updatedContent = JSON.stringify(orders, null, 2);
        const encodedContent = Buffer.from(updatedContent).toString('base64');

        // **Step 2: Update the file with the latest SHA**
        const updateResponse = await axios.put(url, {
            message: 'Updated feedback and reusable_field1 for order',
            content: encodedContent,
            sha: latestSHA, // Use the latest SHA to prevent conflicts
        }, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        if (updateResponse.status === 200 || updateResponse.status === 201) {
            return res.json({
                message: 'Feedback submitted and file updated successfully!',
                orderDetails: order,
                feedbackDetails: { shipping: shippingRating, packaging: packagingRating, product: productRating, feedback },
            });
        } else {
            console.error('Error updating file on GitHub:', updateResponse.data);
            return res.status(500).json({ error: 'Failed to update the file on GitHub' });
        }

    } catch (error) {
        console.error('Error processing feedback submission:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
