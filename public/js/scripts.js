// Global variables for product price
let productPrice = 899; // Define the product price
let collectGatewayCharges = "N"; // Define whether to collect gateway charges ('Y' or 'N')
let gatewayChargePercentage = 1.0218; // Razorpay charges ~2.18%

  document.addEventListener("DOMContentLoaded", () => {


    const priceElement = document.getElementById("productPrice");
    const priceNoteElement = document.getElementById("priceNote");

    // Calculate the original price (Rs. 200 more)
    const originalPrice = productPrice + 300;

    // Update price element with current price and original price (strikethrough with red color and 75% opacity)
    priceElement.innerHTML = `
      Price: ₹<span>${productPrice}</span> 
      <span style="text-decoration: line-through; text-decoration-color: rgba(255, 0, 0, 0.55); color: #888; font-size: 0.9em;">₹${originalPrice}</span>
    `;

    // Set note based on the value of collectGatewayCharges
    if (collectGatewayCharges === "Y") {
      priceNoteElement.textContent = "(Excluding payment gateway charges)";
    } else {
      priceNoteElement.textContent = "(Including payment gateway charges)";
    }
  });

//REST OF THE CODING
let currentSlide = 0;
function showSlides() {
  const slides = document.querySelectorAll(".slides");
  slides.forEach((slide) => (slide.style.display = "none")); // Hide all slides
  slides[currentSlide].style.display = "block"; // Show the active slide
}

function nextSlide() {
  const slides = document.querySelectorAll(".slides");
  currentSlide = (currentSlide + 1) % slides.length; // Move to the next slide
  showSlides();
}

function prevSlide() {
  const slides = document.querySelectorAll(".slides");
  currentSlide = (currentSlide - 1 + slides.length) % slides.length; // Move to the previous slide
  showSlides();
}

function startAutoSlide() {
  setInterval(nextSlide, 3000); // Automatically change slide every 3 seconds
}

// Image Zoom Functionality
const images = document.querySelectorAll(".slide-image");
const modal = document.getElementById("fullscreenModal");
const zoomedImg = document.getElementById("zoomedImg");
const closeModal = document.getElementById("closeModal");

images.forEach((image) => {
  image.addEventListener("click", function () {
    zoomedImg.src = image.src; // Set the zoomed image source to clicked image's source
    modal.style.display = "flex"; // Show the modal
  });
});

closeModal.addEventListener("click", function () {
  modal.style.display = "none"; // Hide the modal
});

function callNow() {
  window.location.href = "tel:+918839623805"; // Make a direct phone call
}

function openForm() {
  document.getElementById("popupModal").style.display = "flex";
}

function closeForm() {
  document.getElementById("popupModal").style.display = "none";
}


/////////////////////////////////////////////////////////////
function validateField(fieldId, errorMessageId, validationFunction, successIconId) {
  const field = document.getElementById(fieldId);
  const errorMessage = document.getElementById(errorMessageId);
  const successIcon = document.getElementById(successIconId);

  field.addEventListener("blur", function () {
    if (!validationFunction(field.value.trim())) {
      errorMessage.innerText = field.dataset.errorMessage;
      successIcon.style.display = "none";
    } else {
      errorMessage.innerText = "";
      successIcon.style.display = "inline";
    }
    validateForm();  // Validate form after blur event
  });

  field.addEventListener("input", function () {
    errorMessage.innerText = "";
    successIcon.style.display = "none";
    validateForm();  // Validate form during input (as soon as the user types)
  });
}

function validateName(value) {
  return value.replace(/\s/g, '').length >= 3 && !/^([a-zA-Z])\1*$/.test(value);
}


function validateAddress(value) {
  const spaceCommaCount = (value.match(/[ ,]/g) || []).length; // Count spaces and commas
  return value.length >= 15 && spaceCommaCount > 3 && value.replace(/[ ,]/g, '').length >= 15;
}



function validatePinCode(value) {
  return /^\d{6}$/.test(value);
}

function validateMobile(value) {
  return /^[6-9]\d{9}$/.test(value);
}


function validateForm() {
  const fullNameValid = validateName(
    document.getElementById("fullName").value.trim()
  );
  const addressValid = validateAddress(
    document.getElementById("address").value.trim()
  );
  const pinCodeValid = validatePinCode(
    document.getElementById("pinCode").value.trim()
  );
  const mobileValid = validateMobile(
    document.getElementById("mobileNumber").value.trim()
  );

  const payNowButton = document.getElementById("payNowButton");

  // Enable and turn the button green if all fields are valid
  if (fullNameValid && addressValid && pinCodeValid && mobileValid) {
    payNowButton.disabled = false;
    payNowButton.style.backgroundColor = "green";  // Set to green when valid
  } else {
    payNowButton.disabled = true;
    payNowButton.style.backgroundColor = "";  // Reset background if invalid
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fullName").dataset.errorMessage = "Name is not valid.";
  document.getElementById("address").dataset.errorMessage = "Address is incomplete.";
  document.getElementById("pinCode").dataset.errorMessage = "Incorrect pincode, enter the correct one.";
  document.getElementById("mobileNumber").dataset.errorMessage = "Mobile number is not valid.";

  validateField("fullName", "nameError", validateName, "nameSuccess");
  validateField("address", "addressError", validateAddress, "addressSuccess");
  validateField("pinCode", "pinCodeError", validatePinCode, "pinCodeSuccess");
  validateField("mobileNumber", "mobileError", validateMobile, "mobileSuccess");

  showSlides();
  startAutoSlide();
});






/////////////////////////////////////////// PAYMENT GATEWAY CONNECTION ///////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("payNowButton").addEventListener("click", async () => {
    try {
      let amount = productPrice; // Base price of the product
      if (collectGatewayCharges === "Y") {
        amount = Math.round(amount * gatewayChargePercentage);
      }

      // Step 1: Request order creation from the backend
      const response = await fetch("/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error("Failed to create an order. Please try again.");
      }

      const order = await response.json();
	  console.log("amount= ", amount);

      // Step 2: Configure Razorpay options
      const options = {
        key: "rzp_live_Fd0TU38KMJqLBw", // Replace with your Razorpay public key
        amount: order.amount,
        currency: "INR",
        name: "Auto Clicker Mouse",
        description: "Purchase Auto Clicker Mouse",
        order_id: order.id,
        handler: async function (response) {
          // Log order_id and payment_id in console
          console.log("Order ID: ", response.razorpay_order_id);
          console.log("Payment ID: ", response.razorpay_payment_id);

          // Safely access form values
          const name = document.getElementById("fullName") ? document.getElementById("fullName").value : "";
          const address = document.getElementById("address") ? document.getElementById("address").value : "";
          const pincode = document.getElementById("pinCode") ? document.getElementById("pinCode").value : "";
          const mobile = document.getElementById("mobileNumber") ? document.getElementById("mobileNumber").value : "";

          // Step 3: Verify payment on the server
          const verifyResponse = await fetch("/verifyPayment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              name, // Pass name
              address, // Pass address
              pincode, // Pass pincode
              mobile, // Pass mobile number
            }),
          });

          const verifyResult = await verifyResponse.json();
          if (verifyResult.success) {
            // Payment Successful - Show details in popup and pass order_id and payment_id
            showSuccessPopup(response, response.razorpay_order_id, response.razorpay_payment_id);
          } else {
            // Payment Verification Failed
            showFailurePopup(response);
          }
        },
        prefill: {
          name: document.getElementById("fullName") ? document.getElementById("fullName").value : "",
          email: "user@example.com", // Optional, you can add email input to your form
          contact: document.getElementById("mobileNumber") ? document.getElementById("mobileNumber").value : "",
        },
        theme: {
          color: "#007BFF",
        },
        modal: {
          // Customize the behavior when modal is dismissed
          ondismiss: function () {
            // Show your custom failure popup
            showFailurePopup({ error: { message: "Payment process was canceled" } });
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function (response) {
        // Handle payment failure response
        showFailurePopup(response);
      });
    } catch (error) {
      alert("Failed to initialize payment. Please try again.");
      console.error(error);
    }
  });
});


/////////////////////////////////////////// PAYMENT GATEWAY CONNECTION ///////////////////////////////////////////////////////



let globalOrderID = null;
let globalPaymentID = null;

//function showFailurePopup(response, order_id, payment_id) {
function showSuccessPopup(response, order_id, payment_id) {
  // Set the global variables
  globalOrderID = order_id;
  globalPaymentID = payment_id;

  // Trigger downloadDetails() function programmatically
  downloadDetails();

  // Log order_id and payment_id to the console
  console.log("Order ID: ", globalOrderID);
  console.log("Payment ID: ", globalPaymentID);

  // Get the next business day, purchase date, and order number (use the actual Razorpay order_id)
  const shippingDate = getNextBusinessDay();  // Get next business day
  const orderDate = new Date().toLocaleDateString();
  
  // Use globalOrderID as the order number
  const orderNumber = globalOrderID;  // Use the actual Razorpay order ID as order number

  // Style for the success message
  const transactionStatus = document.getElementById("transactionStatus");
  transactionStatus.innerText = "Congratulations! Payment Successful.";
  transactionStatus.style.color = "green"; // Set text color to green for success
  transactionStatus.style.textAlign = "center"; // Center the message
  transactionStatus.style.marginBottom = "20px"; // Add spacing below the message
  transactionStatus.style.fontSize = "18px"; // Increase font size for better visibility
  transactionStatus.style.fontWeight = "bold"; // Make it bold

  // Shipping Details styling
  const shippingDetails = document.getElementById("shippingDetails");
  shippingDetails.innerText = `Shipping Date: ${shippingDate}`;
  shippingDetails.style.textAlign = "center"; // Center the message
  shippingDetails.style.marginBottom = "30px"; // Add spacing below the message
  shippingDetails.style.color = "#555"; // Set a softer color for additional details
  shippingDetails.style.fontSize = "16px"; // Slightly smaller font size for details

  // Order Date and Order Number styling (order details sequence updated)
  const orderDateElem = document.getElementById("orderDate");
  const orderNumberElem = document.getElementById("orderNumber");

  // Update sequence: Order Number, Purchase Date, Shipping Date
  orderNumberElem.innerText = `Order Number: ${orderNumber}`;  // Display Razorpay order ID
  orderDateElem.innerText = `Purchase Date: ${orderDate}`;
  orderDateElem.style.textAlign = "center";
  orderNumberElem.style.textAlign = "center";
  orderDateElem.style.marginBottom = "20px";
  orderNumberElem.style.marginBottom = "20px";

  // Show the Download button only on success
  const downloadBtn = document.getElementById("downloadBtn");
  downloadBtn.style.display = "block"; // Show the download button on success
  downloadBtn.style.backgroundColor = "#28a745"; // Green color for download button
  downloadBtn.style.color = "#fff"; // White text color
  downloadBtn.style.padding = "10px 20px"; // Add padding for button
  downloadBtn.style.border = "none"; // Remove border
  downloadBtn.style.borderRadius = "5px"; // Rounded corners
  downloadBtn.style.cursor = "pointer"; // Pointer cursor on hover
  downloadBtn.style.margin = "0 auto"; // Center the download button horizontally

  // Show hover effect for download button
  downloadBtn.addEventListener("mouseover", () => {
    downloadBtn.style.backgroundColor = "#218838"; // Darker green on hover
  });
  downloadBtn.addEventListener("mouseout", () => {
    downloadBtn.style.backgroundColor = "#28a745"; // Revert back to original green
  });

  // Hide form and show transaction result
  document.getElementById("purchaseFormSection").style.display = "none";
  document.getElementById("transactionResult").style.display = "block";
}

//function showSuccessPopup(response) {
function showFailurePopup(response) {
  // Update failure message styling
  const transactionStatus = document.getElementById("transactionStatus");
  transactionStatus.innerText = "Payment Failed";
  transactionStatus.style.color = "red"; // Set text color to red
  transactionStatus.style.textAlign = "center"; // Center the message
  transactionStatus.style.marginBottom = "20px"; // Add spacing below the message
  transactionStatus.style.fontSize = "18px"; // Increase font size for better visibility
  transactionStatus.style.fontWeight = "bold"; // Make it bold

  // Update shipping details message
  const shippingDetails = document.getElementById("shippingDetails");
  shippingDetails.innerText = "Your payment could not be processed.";
  shippingDetails.style.textAlign = "center"; // Center the message
  shippingDetails.style.marginBottom = "30px"; // Add spacing below the message
  shippingDetails.style.color = "#555"; // Set a softer color for additional details
  shippingDetails.style.fontSize = "16px"; // Slightly smaller font size for details

  // Show retry and update buttons with proper spacing and color coding
  const failureOptions = document.getElementById("failureOptions");
  failureOptions.style.display = "flex"; // Display buttons side by side
  failureOptions.style.justifyContent = "center"; // Center buttons horizontally
  failureOptions.style.gap = "15px"; // Add space between the buttons
  failureOptions.style.marginTop = "20px"; // Add spacing above the buttons

  // Style the buttons dynamically
  const buttons = failureOptions.querySelectorAll("button");
  buttons.forEach((button) => {
    button.style.padding = "10px 20px"; // Add padding to the button
    button.style.border = "none"; // Remove the default border
    button.style.borderRadius = "5px"; // Add rounded corners
    button.style.fontSize = "14px"; // Increase font size
    button.style.cursor = "pointer"; // Show pointer cursor on hover
  });

  // Specific button color coding
  buttons[0].style.backgroundColor = "#007BFF"; // Update Details button color (blue)
  buttons[0].style.color = "#FFF"; // White text
  buttons[0].addEventListener("mouseover", () => (buttons[0].style.backgroundColor = "#0056b3")); // Hover effect
  buttons[0].addEventListener("mouseout", () => (buttons[0].style.backgroundColor = "#007BFF"));

  buttons[1].style.backgroundColor = "#28a745"; // Retry Payment button color (green)
  buttons[1].style.color = "#FFF"; // White text
  buttons[1].addEventListener("mouseover", () => (buttons[1].style.backgroundColor = "#1e7e34")); // Hover effect
  buttons[1].addEventListener("mouseout", () => (buttons[1].style.backgroundColor = "#28a745"));

  // Hide the Download button (if shown previously)
  document.getElementById("downloadBtn").style.display = "none";

  // Hide form and show failure options
  document.getElementById("purchaseFormSection").style.display = "none";
  document.getElementById("transactionResult").style.display = "block";
}


function retryPayment() {
  document.getElementById("payNowButton").click(); // Trigger the Pay Now button again
}

function openForm() {
  // Show the modal
  document.getElementById("popupModal").style.display = "flex"; // Show the modal

  // Show the purchase form section and hide the transaction result section
  document.getElementById("purchaseFormSection").style.display = "block";
  document.getElementById("transactionResult").style.display = "none"; // Hide the transaction result section

  // Pre-fill the form with previously entered values
  document.getElementById("fullName").value = document.getElementById("fullName").value;
  document.getElementById("address").value = document.getElementById("address").value;
  document.getElementById("pinCode").value = document.getElementById("pinCode").value;
  document.getElementById("mobileNumber").value = document.getElementById("mobileNumber").value;

  // Apply blur effect to the main content
  const mainContent = document.querySelector("#mainContent"); // Use '#' for an ID or '.' for a class
  mainContent.classList.add("blur-background");
}


//REORDER FROM ORDER PAGE 
// Check if popup should be opened
if (localStorage.getItem("showPopup") === "true") {
	    payNowButton.disabled = false;
    // Show popup immediately before page fully loads
    document.addEventListener("DOMContentLoaded", function() {
        let orderData = localStorage.getItem("orderData");

        if (orderData) {
            let order = JSON.parse(orderData);

            // Fill the form fields
            document.getElementById("fullName").value = order.name || "";
            document.getElementById("address").value = order.address || "";
            document.getElementById("pinCode").value = order.pincode || "";
            document.getElementById("mobileNumber").value = order.mobile || "";

            // Open the purchase form modal
            openForm();

            // Clear stored data after use
            localStorage.removeItem("orderData");
            localStorage.removeItem("showPopup");
        }
    });
}

//REORDER FROM ORDER PAGE 



//REDIRECT FROM REVIEW PAGE TO HOME PAGE , IF MOBILE NUMBER PRESENT THEN DIRECTLY ORDER PAGE 
// Ensure openPopup is defined before use
function openPopup(title, contentHTML, actionURL) {
    const Xpopup = document.getElementById('Xpopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupFormContent = document.getElementById('popupFormContent');
    const popupForm = document.getElementById('popupForm');

    Xpopup.classList.add('active');
    popupTitle.textContent = title;
    popupFormContent.innerHTML = contentHTML;
    popupForm.setAttribute('data-action-url', actionURL);
}

document.addEventListener('DOMContentLoaded', () => {
    const storedMobileNumber = localStorage.getItem('mobileNumber');

    // Check if the user is redirected from the Review Page
    if (localStorage.getItem('openOrdersPopup') === 'true') {
        localStorage.removeItem('openOrdersPopup'); // Remove flag to prevent repeated popups

        if (storedMobileNumber) {
            // If a number exists, redirect to My Orders immediately
            window.location.href = `/my-orders?mobileNumber=${encodeURIComponent(storedMobileNumber)}`;
        } else {
            // Otherwise, show the popup for mobile number entry
            const contentHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <label for="mobileNumber">Enter your contact number:</label>
                    <input type="text" id="mobileNumber" name="mobileNumber" required>
                </div>
            `;
            openPopup('My Orders', contentHTML, '/my-orders');
            setTimeout(() => showMessage('Please enter your mobile registered number:', 'blue'), 300);
        }
    }
});
//REDIRECT FROM REVIEW PAGE TO HOME PAGE , IF MOBILE NUMBER PRESENT THEN DIRECTLY ORDER PAGE 




function closeForm() {
  // Hide the modal
  document.getElementById("popupModal").style.display = "none";

  // Remove the blur effect from the main content
  const mainContent = document.querySelector("#mainContent"); // Use '#' for an ID or '.' for a class
  mainContent.classList.remove("blur-background");
}

function downloadDetails() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    console.error("jsPDF library is not loaded.");
    return;
  }

  // Use the global variables for order_id and payment_id
  const orderNumber = globalOrderID;  // Use global order ID
  const paymentID = globalPaymentID;  // Use global payment ID

  const name = document.getElementById("fullName").value;
  const address = document.getElementById("address").value;
  const pinCode = document.getElementById("pinCode").value;
  const mobileNumber = document.getElementById("mobileNumber").value;
  const shippingDate = getNextBusinessDay();
  const purchaseDate = new Date().toLocaleDateString();
  const purchaseTime = new Date().toLocaleTimeString();

  // Create PDF
  const doc = new jsPDF();
  doc.setFontSize(12);

  // Updated heading with Order and Payment IDs
  doc.setFont("helvetica", "normal");
  doc.text(`Dear ${name},`, 20, 20);
  doc.text(`Thank you for choosing us. Your order is confirmed. Below are your payment details:`, 20, 30);
  doc.text(`Txn ID is: ${paymentID}`, 20, 40);  // Use global paymentID as the transaction ID
  doc.text(`___________________________________________________________________`, 20, 50);  // Separator line

  // Add a blank line (adjust currentY for the next content)
  let currentY = 60; // Move down 10 units to add space for the blank line
  doc.text(` `, 20, currentY);  // Blank line

  // Bold the "Ship to:" text
  doc.setFont("helvetica", "bold");
  currentY += 10; // Add spacing before "Ship to:"
  doc.text(`Ship to:`, 20, currentY);

  // Reset to normal font and proceed with other text
  doc.setFont("helvetica", "normal");
  doc.text(`  Name: ${name}`, 25, currentY + 10);
  const addressLines = doc.splitTextToSize(`  Address: ${address}`, 170);
  currentY += 20;
  addressLines.forEach((line) => {
    doc.text(line, 25, currentY);
    currentY += 10;
  });
  doc.text(`  Pincode: ${pinCode}`, 25, currentY);
  currentY += 10;
  doc.text(`  Contact: ${mobileNumber}`, 25, currentY);

  // Bold the "Order Details:" text
  currentY += 20;
  doc.setFont("helvetica", "bold");
  doc.text(`Order Details:`, 20, currentY);

  // Reset to normal font for details
  doc.setFont("helvetica", "normal");
  currentY += 10;
  doc.text(`  Order Number: ${orderNumber}`, 25, currentY);  // Use global orderNumber
  currentY += 10;
  doc.text(`  Shipping Date: ${shippingDate}`, 25, currentY);
  currentY += 10;
  doc.text(`  Purchase Date & Time: ${purchaseDate}, ${purchaseTime}`, 25, currentY);

  // Highlight "Note -" in red with yellow background
  currentY += 20;
  doc.setTextColor(255, 0, 0);  // Set text color to red for "Note -"
  doc.setFont("helvetica", "bold"); // Make "Note -" bold
  const noteText = "Note - ";
  const pageWidth = doc.internal.pageSize.width; // Get the width of the page
  const noteWidth = doc.getStringUnitWidth(noteText) * doc.getFontSize(); // Get width of the "Note -" text
  const noteX = (pageWidth - noteWidth) / 2; // Calculate X position to center the text

  //doc.setFillColor(255, 255, 0);  // Set fill color to yellow for the background
  //doc.rect(noteX - 5, currentY - 3, noteWidth + 10, 10, "F"); // Create yellow background for "Note -"
  doc.text(noteText, noteX, currentY); // Center "Note -" text in red and bold

  // Highlight the WhatsApp message in yellow
  currentY += 5; // Add some space before the message
  doc.setTextColor(0, 0, 0);  // Set text color to black
  doc.setFillColor(255, 255, 0);  // Set fill color to yellow for the background
  doc.rect(20, currentY, 170, 12, "F"); // Create yellow background for WhatsApp message
  doc.text(
    `  Please immediately send this PDF to our WhatsApp number +91 8839623805 for         further processing.`,
    20,
    currentY + 5,  // Position the message in the yellow box with some padding
    { maxWidth: 170 }
  );

  // Save the PDF
  doc.save("order-confirmation.pdf");
}




// Helper function to get the next business day
function getNextBusinessDay() {
  const today = new Date();
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 2); // Add two days
  return nextDay.toLocaleDateString();
}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
    const adminButton = document.getElementById('adminButton');
    const Xpopup = document.getElementById('Xpopup');
    const closePopupButton = document.getElementById('closePopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupFormContent = document.getElementById('popupFormContent');
    const popupForm = document.getElementById('popupForm');
    const myOrdersButton = document.getElementById('myOrdersButton');
    
    // Check if a mobile number is already stored
    const storedMobileNumber = localStorage.getItem('mobileNumber');
    
    if (storedMobileNumber) {
        // If a number exists, directly redirect to My Orders page
        myOrdersButton.addEventListener('click', () => {
            window.location.href = `/my-orders?mobileNumber=${encodeURIComponent(storedMobileNumber)}`;
        });
    } else {
        // Otherwise, show the popup for mobile number entry
        myOrdersButton.addEventListener('click', () => {
            const contentHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <label for="mobileNumber">Enter your contact number:</label>
                    <input type="text" id="mobileNumber" name="mobileNumber" required>
                </div>
            `;
            openPopup('My Orders', contentHTML, '/my-orders');
            setTimeout(() => showMessage('Please enter your mobile registered number:', 'blue'), 300);
        });
    }	

	// Function to open the popup and populate the form dynamically
	function openPopup(title, contentHTML, actionURL) {
		Xpopup.classList.add('active'); // Show the popup
		popupTitle.textContent = title; // Set the title of the popup
		popupFormContent.innerHTML = contentHTML; // Add content inside the popup form
		popupForm.removeAttribute('action'); // Remove default action attribute of form
		popupForm.setAttribute('data-action-url', actionURL); // Add a custom data-action-url attribute
		document.body.classList.add('popup-active'); // Disable background when popup is active
	
		// Blur the page except the popup
		document.querySelector('header').classList.add('blur'); // Add blur to header
		document.querySelector('footer').classList.add('blur'); // Add blur to footer
		document.body.classList.add('blur'); // Add blur to the rest of the body
		document.querySelector('.Xpopup-container').classList.add('no-blur'); // Prevent blur on the popup
	}
	
	// Function to close the popup
	function closePopup() {
		Xpopup.classList.remove('active'); // Hide the popup
		document.body.classList.remove('popup-active'); // Re-enable background
	
		// Remove blur effect
		document.querySelector('header').classList.remove('blur'); 
		document.querySelector('footer').classList.remove('blur'); 
		document.body.classList.remove('blur'); 
	
		// Remove 'no-blur' to allow future blur if needed
		document.querySelector('.Xpopup-container').classList.remove('no-blur');
	}


    // Function to display messages
    function showMessage(message, color) {
        const existingMessage = popupFormContent.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        let messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.color = color;
        messageElement.style.marginTop = '10px';
        messageElement.style.fontWeight = 'bold';
        messageElement.style.textAlign = 'center';
        messageElement.classList.add('message');
        popupFormContent.appendChild(messageElement);
    }

    // Function to restrict input to numbers only
    function restrictToNumbers(input) {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // Validation for Admin Login form
    function validateAdminPassword(adminPassword) {
        if (!adminPassword) {
            showMessage('Please enter the admin password.', 'red');
            return false;
        }
        if (adminPassword.length <= 3) {
            showMessage('Password must be longer than 3 characters.', 'red');
            return false;
        }
        const passwordPattern = /^[0-9]+$/;
        if (!passwordPattern.test(adminPassword)) {
            showMessage('Password should contain only numbers.', 'red');
            return false;
        }
        return true;
    }

    // Async function to handle Admin Login
	// Async function to handle Admin Login
async function handleAdminLogin(event) {
    event.preventDefault();
    const adminPassword = document.getElementById("adminPassword").value.trim();

    if (!validateAdminPassword(adminPassword)) {
        return;
    }

    try {
        const response = await fetch('/admin/admin-login', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: adminPassword }),
            credentials: 'include',  // Ensure the session cookie is sent with the request
        });

        const result = await response.json();
        if (response.ok) {
            showMessage(result.message, 'green');
            window.location.href = "/admin";  // Redirect to /admin
        } else {
            showMessage(result.message, 'red');
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        showMessage("An error occurred while logging in. Please try again.", 'red');
    }
}

	

    // Validation for My Orders form
    function validateMobileNumber(mobileNumber) {
        if (!mobileNumber) {
            showMessage('Please enter your mobile number.', 'red');
            return false;
        }
        const mobileNumberPattern = /^[0-9]+$/;
        if (!mobileNumberPattern.test(mobileNumber)) {
            showMessage('Please enter a valid mobile number (only digits).', 'red');
            return false;
        }
        if (mobileNumber.length < 10 || mobileNumber.length > 15) {
            showMessage('Please enter a valid mobile number.', 'red');
            return false;
        }
        return true;
    }

	// Async function to handle My Orders
    // Function to handle My Orders with localStorage update
    async function handleMyOrders(event) {
        event.preventDefault();
        const mobileNumber = document.getElementById("mobileNumber").value.trim();

        if (!validateMobileNumber(mobileNumber)) {
            return;
        }

        try {
            const response = await fetch(popupForm.getAttribute('data-action-url'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mobileNumber }),
            });

            const data = await response.json();
            if (response.ok) {
                // Store the mobile number in localStorage
                localStorage.setItem('mobileNumber', mobileNumber);
                
                showMessage(data.message, 'green');
                closePopup();

                // Redirect to My Orders page
                window.location.href = `/my-orders?mobileNumber=${encodeURIComponent(mobileNumber)}`;
            } else {
                showMessage("This mobile number is not present in database. Please try again.", 'red');
            }
        } catch (error) {
            console.error("Error during fetching orders:", error);
            showMessage("This mobile number does not exist in our system.", 'red');
        }
    }
	

    // Admin button click handler
    adminButton.addEventListener('click', () => {
        const contentHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <label for="adminPassword">Please enter Admin password:</label>
                <input type="password" id="adminPassword" name="adminPassword" required>
            </div>
        `;
        openPopup('Admin Login', contentHTML, '/admin');
        setTimeout(() => showMessage('This is only for Administrator.', 'blue'), 300);
    });

    // My Orders button click handler
    myOrdersButton.addEventListener('click', () => {
        const contentHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <label for="mobileNumber">Enter your contact number:</label>
                <input type="text" id="mobileNumber" name="mobileNumber" required>
            </div>
        `;
        openPopup('My Orders', contentHTML, '/my-orders');
        setTimeout(() => showMessage('Please enter your mobile registered number:', 'blue'), 300);
    });

    // Close the popup when the close button is clicked
    closePopupButton.addEventListener('click', closePopup);

    // Restrict inputs to numbers for admin password and mobile number fields
    popupFormContent.addEventListener('input', (event) => {
        if (event.target.id === 'adminPassword' || event.target.id === 'mobileNumber') {
            restrictToNumbers(event.target);
        }
    });

    // Form submit handler to process the form submission based on the action URL
    popupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (popupForm.getAttribute('data-action-url') === '/admin') {
            handleAdminLogin(event);
        } else if (popupForm.getAttribute('data-action-url') === '/my-orders') {
            handleMyOrders(event);
        }
    });
});

