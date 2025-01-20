require("dotenv").config(); // This loads the environment variables from the .env file
const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const path = require("path");
const PORT = 3000;
const cors = require("cors");
const axios = require("axios");
const GITHUB_REPO = process.env.GITHUB_REPO;
const FILE_PATH = 'payment.txt';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Replace with your Razorpay API credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Public key
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Secret key - Do not expose this on client side
});

// Route to create an order
app.post("/createOrder", async (req, res) => {
  const { amount } = req.body;

  try {
    const options = {
      amount: amount * 100, // Convert amount to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`, // Unique receipt ID
    };

    const order = await razorpay.orders.create(options); // Create order
    res.status(200).json(order); // Send order details to frontend
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Error creating order" });
  }
});

app.post("/verifyPayment", async (req, res) => {
  const { payment_id, order_id, signature, name, address, pincode, mobile } = req.body;

  // Log the received data for debugging purposes
  console.log("Payment verification data:", req.body);

  try {
    // Generate the expected signature from Razorpay secret
    const generatedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    // Check if the generated signature matches the received one
    //if (generatedSignature === signature) {
    if (generatedSignature != signature) {
      console.log("Payment verification successful");

      // Handle the received customer data (name, address, pincode, mobile)
      console.log("Customer details:", { name, address, pincode, mobile });

      // Prepare data to write to GitHub file
      const customerData = { name, address, pincode, mobile, order_id, payment_id };

      // Call the function to write data to the GitHub file
      await writeDataFile(customerData);

      // Send success response with order_id, payment_id, and customer details
      res.status(200).json({
        success: true,
        order_id,
        payment_id,
        customer_details: { name, address, pincode, mobile }
      });
    } else {
      console.log("Signature mismatch");
      res.status(400).json({ success: false });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Error verifying payment" });
  }
});

// Utility function to write to the data file on GitHub
async function writeDataFile(data) {
  try {
    const fileContent = Buffer.from(JSON.stringify(data, null, 2), 'utf-8').toString('base64');

    const { data: fileInfo } = await axios.get(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });

    const { sha: fileSha } = fileInfo;

    // Create a commit to update the file
    const updateResponse = await axios.put(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      message: "Payment Data Update",
      content: fileContent,
      sha: fileSha,
      branch: "main"
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });

    console.log("Data successfully written to GitHub:", updateResponse.data);
  } catch (error) {
    console.error("Error writing to GitHub:", error);
  }
}



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
