require('dotenv').config();  // Load .env file first
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';  // Override if needed
const express = require('express');
const router = express.Router();
require('dotenv').config();  // Load environment variables from .env file
const axios = require('axios');





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE_PATH = process.env.PAYMENT;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';




// API route for getting orders
router.get('/getOrders', async (req, res) => {
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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////






module.exports = router;
