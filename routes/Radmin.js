require('dotenv').config();  // Load .env file first
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';  // Override if needed
const express = require('express');
const router = express.Router();
require('dotenv').config();  // Load environment variables from .env file
const axios = require('axios');





// Define route for Admin login
router.post('/admin-login', (req, res) => {
    const { password } = req.body;

    // Initialize or increment login attempt counter
    if (!req.session.loginAttempts) {
        req.session.loginAttempts = 0;
    }

    // If attempts are more than 3, deny login and inform the user
    if (req.session.loginAttempts >= 3) {
        res.status(429).json({ message: "Too many attempts. Please try again after 5 minutes." });
        return;
    }

    // Check if password matches the one in the .env file
    if (password === process.env.PASSWORD) {
        // Reset login attempts on successful login
        req.session.isAuthenticated = true;
        req.session.loginAttempts = 0;
        res.status(200).json({ message: "Admin login successful." });
		console.log('Session initialized:', req.session); // Debugging line
    } else {
        // Increment the login attempt counter on failure
        req.session.loginAttempts++;

        // If login attempts exceed 3, deny login and inform user
        if (req.session.loginAttempts >= 3) {
            res.status(429).json({ message: "Too many attempts. Please try again after 5 minutes." });
        } else {
            res.status(401).json({ message: "Invalid password, Please try again." });
        }
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE_PATH = process.env.PAYMENT;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next(); // Allow the request to proceed
    } else {
        console.log('Redirecting to login page...');
        res.redirect('/'); // Redirect to login or home page if not authenticated
    }
}


// API route for getting orders
router.get('/getOrders', isAuthenticated, async (req, res) => {
    console.log("API request received for /getOrders");

    try {
        // Construct GitHub API URL to fetch file contents
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        console.log(`Requesting URL: ${url}`); // Log the request URL

        // Fetch data from GitHub API
        const response = await axios.get(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        // Check if the response contains content
        if (!response.data || !response.data.content) {
            console.log("No content found in response.");
            res.status(404).json({ message: "No content found." });
            return;
        }

        // Decode the base64 content
        const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
        console.log("File content fetched from GitHub.");

        // Parse the content as JSON
        const orders = JSON.parse(fileContent);

        if (orders && orders.length > 0) {
            console.log("Orders successfully fetched:", orders);
            res.json(orders);
        } else {
            console.log("No orders found in the file.");
            res.status(404).json({ message: "No orders found." });
        }

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Error fetching orders" });
    }
});




// Function to fetch JSON data from GitHub
async function fetchOrdersFromGitHub() {
    try {
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        console.log(`Requesting URL: ${url}`); // Log the request URL

        const response = await axios.get(url, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        console.log('GitHub API response:', response.data); // Log the API response

        if (!response.data || !response.data.content) {
            console.error('No content found in the response');
            return null;
        }

        const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
        console.log('Decoded file content:', fileContent); // Log the decoded file content

        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error fetching orders from GitHub:', error); // Log any error encountered
        return null;
    }
}


process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';  // This disables certificate validation
// Endpoint to fetch location details by pincode
router.get('/getLocationByPincode', async (req, res) => { // Correct route path
    const { pincode } = req.query;
    console.log('Received pincode in request:', pincode); // Log to verify

    if (!pincode) {
        return res.status(400).json({ success: false, message: 'Pincode is required' });
    }

    try {
        // Replace with your actual API URL for fetching pincode details
        const apiUrl = `https://api.postalpincode.in/pincode/${pincode}`;

        // Fetch the data from the external API
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if location data is available
        if (data && data[0].Status === 'Success' && data[0].PostOffice) {
            const location = data[0].PostOffice[0];
            res.status(200).json({
                success: true,
                location: location.Name, // Location name from the API response
                state: location.State,   // State from the API response
                district: location.District, // District from the API response
                country: 'India' // Country for Indian pincode
            });
        } else {
            res.status(404).json({ success: false, message: 'Location not found' });
        }
    } catch (error) {
        console.error('Error fetching location data:', error);
        res.status(500).json({ success: false, message: 'Error fetching location data' });
    }
});




// Endpoint to update order status
router.post('/updateOrderStatus', async (req, res) => {
    const { orderId, status, tradingDetails } = req.body;
    
    // Fetch and update orders in the GitHub file
    try {
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
            }
        });
        
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const orders = JSON.parse(content);

        const orderIndex = orders.findIndex(order => order.order_id === orderId);
        if (orderIndex === -1) {
            return res.status(404).send('Order not found');
        }

        // Update the status
        orders[orderIndex].current_status = status;
	orders[orderIndex].reusable_field2 = tradingDetails; // Added trading details update

        // Update the file on GitHub
        const updatedContent = Buffer.from(JSON.stringify(orders, null, 2)).toString('base64');
        const commitMessage = `Update status for order ${orderId}`;

        const updateResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: commitMessage,
                content: updatedContent,
                sha: data.sha, // The sha from the original file to update
            }),
        });

        if (updateResponse.ok) {
            res.status(200).send('Status updated');
        } else {
            res.status(500).send('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Error updating order status');
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const path = require('path');

// Redirect to login page for any attempt to access admin.html directly
router.get('/admin.html', (req, res) => {
    console.log('Redirecting to login page...');
    res.redirect('/');
});


router.get('/', (req, res) => {
    // Check if the user is authenticated
console.log('Is authenticated:', req.session.isAuthenticated);
if (req.session.isAuthenticated) {
    console.log('Redirecting to admin page...');
    res.sendFile(path.join(__dirname, '../public/admin.html'));
} else {
    console.log('Redirecting to login page...');
    res.redirect('/');
  //res.sendFile(path.join(__dirname, '../public/admin.html'));
}

});





module.exports = router;
