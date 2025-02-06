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
    console.log('Received request for order details:', req.body);

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

        console.log('Sorted Order Details:', matchingOrders);
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

    // Calculate the average of shipping, packaging, and product
    const averageRating = Math.ceil((shipping + packaging + product) / 3);

    // Combine shipping, packaging, and product into a new feedback value
    const combinedFeedback = `${shipping}${packaging}${product}${averageRating}`;  // Format as "shipping, packaging, product, average"

    // Get current timestamp in IST (Indian Standard Time)
    const istOffset = 5.5 * 60;  // IST is UTC +5:30
    const currentTimestamp = new Date(new Date().getTime() + istOffset * 60000).toISOString();  // Get the timestamp in ISO format

    // Update the feedback field and reusable_field1 based on the order data
    order.feedback = combinedFeedback;  // Set feedback to combined shipping, packaging, and product values
    order.reusable_field1 = feedback || order.reusable_field1;  // Set reusable_field1 to the incoming feedback if available
    order.feedback_timestamp = currentTimestamp;  // Set the feedback timestamp to current timestamp in IST

    try {
        // Fetch the current file content from the GitHub repository
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
            }
        });

        const data = response.data;

        // Decode the base64 content of the file
        const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
        
        // Parse the file content (assuming JSON format in the file)
        const orders = JSON.parse(fileContent);
        
        // Find the order by order_id
        const orderIndex = orders.findIndex(o => o.order_id === order.order_id);
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found in the file' });
        }

        // Update the order details
        orders[orderIndex] = order;  // Replace the order with the updated one

        // Prepare the updated content to save back to GitHub
        const updatedContent = JSON.stringify(orders, null, 2);

        // Re-encode the updated content to base64
        const encodedContent = Buffer.from(updatedContent).toString('base64');

        // Update the file on GitHub with the new content
        const updateResponse = await axios.put(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: {
                message: 'Updated feedback and reusable_field1 for order',
                content: encodedContent,
                sha: data.sha,  // Provide the SHA of the existing file for the commit
            }
        });

        const updateData = updateResponse.data;
        if (updateResponse.status === 200) {
            return res.json({
                message: 'Feedback submitted and file updated successfully!',
                orderDetails: order,
                feedbackDetails: { shipping, packaging, product, feedback },
            });
        } else {
            console.error('Error updating file on GitHub:', updateData);
            return res.status(500).json({ error: 'Failed to update the file on GitHub' });
        }

    } catch (error) {
        console.error('Error processing feedback submission:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
