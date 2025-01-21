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
  return value.length >= 15 && (value.split(' ').length - 1) >= 3 && value.replace(/ /g, '').length >= 15;
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






///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("payNowButton").addEventListener("click", async () => {
    try {
      let amount = 1; // Base price of the product
      const collectGatewayCharges = "Y";
      const gatewayChargePercentage = 1.0218; // Razorpay charges ~2.18%
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
