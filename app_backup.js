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
const FILE_PATH = process.env.PAYMENT;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes


const session = require('express-session');
// Session middleware to store user sessions
app.use(session({
    secret: process.env.SESSIONKEY, // Secret key to sign the session ID cookie
    resave: false,              	// Whether to resave the session on every request
    saveUninitialized: true,    	// Whether to save an uninitialized session
    cookie: { secure: false }   	// Set to true if using HTTPS
}));



// Import routes
const myordersRoutes = require('./routes/Rorders');
const adminRoutes = require('./routes/Radmin');
const reviewRoutes = require('./routes/Rreview');

// Use routes
app.use('/my-orders', myordersRoutes);  // Match the frontend '/my-orders' path
app.use('/admin', adminRoutes);         // Match the frontend '/admin' path
app.use('/review', reviewRoutes);         // Match the frontend '/review' path

// Set up the route for /review
app.get('/review', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/review.html'));
});

// Set up the route for /review
app.get('/FAQs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/FAQ.html'));
});


// Replace with your Razorpay API credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Public key
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Secret key - Do not expose this on client side
});

// Route to create an order
// Route to create an order
app.post("/createOrder", async (req, res) => {
  let { amount } = req.body;

  try {
    // Ensure the amount is at least 800; if less, set it to 1000
    if (amount < 800) {
      amount = 1000;
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100); // Round to ensure it's an integer

    const options = {
      amount: amountInPaise, // Amount in paise
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
    if (generatedSignature === signature) {
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

async function writeDataFile(data) {
  try {
    // Get the current date in DD-MON-YY format
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
    const year = currentDate.getFullYear().toString().slice(-2);
    const formattedDate = `${day}-${month}-${year}`;

    // Get the current time in HH:MM:SS format
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    // Add date, time, and the new fields with default values
    const recordWithDateTime = { 
      ...data, 
      date: formattedDate, 
      time: formattedTime, 
      current_status: "NA",
      feedback: "NA",
      feedback_timestamp: "NA",
      reusable_field1: "NA",
      reusable_field2: "NA"
    };

    // Convert the data to JSON format and encode it in base64
    const fileContent = Buffer.from(JSON.stringify(recordWithDateTime, null, 2), 'utf-8').toString('base64');

    // Fetch the current file information from GitHub to get the SHA for the existing file
    const { data: fileInfo } = await axios.get(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });

    // Ensure current data is an object or array before proceeding
    let currentData = JSON.parse(Buffer.from(fileInfo.content, 'base64').toString('utf-8'));
    
    // If it's not an array, wrap it into an array (assuming your data should be an array)
    if (!Array.isArray(currentData)) {
      currentData = [currentData]; // Wrap the object into an array if it's not already an array
    }

    // Append the new record to the existing data array
    currentData.push(recordWithDateTime);

    // Create a commit to update the file
    const updateResponse = await axios.put(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      message: "Payment Data Update", // Commit message
      content: Buffer.from(JSON.stringify(currentData, null, 2), 'utf-8').toString('base64'), // Updated content
      sha: fileInfo.sha, // SHA of the current file to overwrite
      branch: "main" // Ensure the correct branch is used
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });

    console.log("Data successfully written to GitHub:");
    
    // After writing the data, send an email notification
    await sendOrderEmail(recordWithDateTime); 
    
  } catch (error) {
    console.error("Error writing to GitHub:", error);
  }
}




const nodemailer = require('nodemailer');

// Setup email transport using App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App Password
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function sendOrderEmail(paymentData) {
    try {
        // Format the address by splitting it if it's longer than 30 characters per line
        let formattedAddress = paymentData.address;
        if (formattedAddress.length > 30) {
            // Split the address into chunks of 30 characters
            let addressLines = formattedAddress.match(/.{1,30}/g);
            
            // Ensure that each split line is indented with the appropriate number of spaces
            formattedAddress = addressLines.map(line => `${line}`).join('\n');
        } else {
            // If the address is short, just use it without any wrapping
            formattedAddress = `${formattedAddress}`;
        }

        // Prepare the email content with custom formatting (no leading spaces in 'To' and added spaces to 'From')
        const emailText = `
\n\n\n
                                       Order ID: ${paymentData.order_id}

To,
${paymentData.name},
${formattedAddress}
Pincode: ${paymentData.pincode},
Mobile: ${paymentData.mobile}

\n\n
                                                                                 From,
                                                                                   Rahul Gupta,
                                                                                   vandematram Road,
                                                                                   Sanjay Nagar, Shikshak Colony, Kurud
                                                                                   Dhamtari, C.G. , pin - 493663
                                                                                   Mobile - 8839623805
`;

        // Setup mail options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECIPIENT,  // The recipient email address
            subject: 'New Order Received',  // Email subject
            text: emailText  // Email body text
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent successfully:', info.response);
            }
        });
    } catch (error) {
        console.error('Error in sending email:', error);
    }
}


app.get('/policies', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/policies.html'));  // Serves the policies.html file when /policies is accessed
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
