const faqQuestions = [
    // General
    { category: "General", question: "What is an Auto Clicker Mouse?", answer: "An Auto Clicker Mouse is a device designed to automatically perform mouse clicks at preset intervals, preventing the system from going idle or locking." },
    { category: "General", question: "How does the Auto Clicker Mouse work?", answer: "The Auto Clicker Mouse continuously simulates user activity by performing automatic clicks, ensuring that the system remains active and preventing screen lock." },
    { category: "General", question: "Who can benefit from using this Auto Clicker Mouse?", answer: "The Auto Clicker Mouse is ideal for IT professionals, gamers, developers, remote workers, and anyone who needs to keep their personal system active for specific tasks like long downloads, testing scripts, or simulating user activity during development. Note: This device is intended strictly for personal use. Using it to bypass company monitoring, simulate activity during work hours, or deceive employers is strongly discouraged and may be a violation of company policies or a punishable offense. We do not recommend or support such usage." },
    { category: "General", question: "Can this bypass time tracker software?", answer: "The Auto Clicker Mouse may simulate activity that could appear as user presence on some time tracking tools like WAM, ProHance, etc. However, we do not recommend using it to bypass company monitoring or policies. Misuse for professional time tracking manipulation can lead to disciplinary action and is considered unethical. This device is intended for personal, ethical use only." },

    // Technical Specifications
    { category: "General", question: "Does the Auto Clicker Mouse require software installation?", answer: "No software is required. It works as a plug-and-play device." },
    { category: "General", question: "What operating systems is it compatible with?", answer: "It works with Android, Windows, and Mac." },
    { category: "General", question: "Can the clicking speed or interval be adjusted?", answer: "The speed is fixed, but you can contact us before shipping to alter the speed." },

    // Usage & Setup
    { category: "General", question: "How do I set up the Auto Clicker Mouse?", answer: "No setup is needed, no software is required. Simply plug and play." },
    { category: "General", question: "Can I use it on multiple computers?", answer: "Yes, you can use it on multiple computers without any restrictions." },

    // Payment
    { category: "Payment", question: "What payment methods are available?", answer: "You can use UPI, credit card, debit card, net banking, and digital wallets like Airtel Money, Amazon Pay, and many more. No additional fee is charged for any payment method." },
    { category: "Payment", question: "Is there an additional charge for using a particular payment mode?", answer: "No, all payment methods are free of additional charges." },
    { category: "Payment", question: "How do I make a payment?", answer: "Simply click on 'Buy Now' on the home page, fill out the form, and proceed with payment. Once done, your order will be confirmed." },

    // Dispatch
    { category: "Dispatch", question: "How soon will my order be shipped?", answer: "We process and dispatch orders as soon as possible to ensure quick delivery." },
    { category: "Dispatch", question: "Which courier services do you use for shipping?", answer: "We use multiple courier services including India Post, Amazon Courier, Xpressbees, Ecom Express, and more." },

    // Delivery
    { category: "Delivery", question: "How can I track my order?", answer: "You can track your order by visiting the 'Order' page, entering your mobile number, and viewing your order details." },
    { category: "Delivery", question: "What if my order is delayed?", answer: "If your order is delayed beyond the expected delivery time, please contact our support team at +918839623805 for assistance." },

    // Ordering & Returns
    { category: "General", question: "How can I place an order?", answer: "You can order anytime from our website or by calling us directly." },
    { category: "General", question: "Can I cancel my order after placing it?", answer: "You can cancel it before shipping by calling us directly on our contact number." },
    { category: "General", question: "How long does it take to process a refund?", answer: "Refunds are processed within 24 hours of request." },
    { category: "General", question: "Do you offer international shipping?", answer: "Please contact us to get details about international shipping." },
    { category: "General", question: "What is your return policy?", answer: "You can return the product within 7 days for a full refund. If you claim warranty, we accept returns during that period as well." },

    // Warranty & Support
    { category: "Services", question: "How can I claim the free 1-month warranty?", answer: "You can claim your free 1-month warranty by leaving a review on your order. The review option is available on the order page." },
    { category: "Services", question: "What happens if my product stops working after the warranty period?", answer: "You can still get it repaired with a servicing fee." },
    { category: "Services", question: "What should I do if my Auto Clicker Mouse is not working?", answer: "If your device is not functioning correctly, contact us at +918839623805. If it doesn’t work for you, you can return it for a full refund within 7 days." },
    { category: "Services", question: "How do I return the product?", answer: "If you are unsatisfied, you can return the product within 7 days for a full refund." }
];


// Generate FAQ list
function generateFAQ() {
    const faqContainer = document.getElementById("faq-content");
    faqContainer.innerHTML = "";

    faqQuestions.forEach((faq, index) => {
        const faqItem = document.createElement("div");
        faqItem.classList.add("faq-item");
        faqItem.dataset.category = faq.category; // Add category as dataset

        faqItem.innerHTML = `
            <button class="accordion">${index + 1}. ${faq.question}</button>
            <div class="panel">
                <p>${faq.answer}</p>
                <div class="vote-section">
                    <span>Was this helpful?</span>
                    <button class="vote-btn" data-vote="yes">👍</button>
                    <button class="vote-btn" data-vote="no">👎</button>
                </div>
            </div>
        `;

        faqContainer.appendChild(faqItem);
    });

    setupAccordion();
    setupVoting();
}

// Accordion functionality
function setupAccordion() {
    document.querySelectorAll(".accordion").forEach(button => {
        button.addEventListener("click", function () {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        });
    });
}

// Search functionality with highlighting
function filterFAQ() {
    const searchInput = document.getElementById("faq-search").value.toLowerCase();
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const question = item.querySelector(".accordion").textContent.toLowerCase();
        const answer = item.querySelector(".panel").textContent.toLowerCase();

        if (question.includes(searchInput) || answer.includes(searchInput)) {
            item.style.display = "block";
            highlightText(item.querySelector(".accordion"), searchInput);
            highlightText(item.querySelector(".panel p"), searchInput);
        } else {
            item.style.display = "none";
        }
    });
}

// Function to highlight searched text
function highlightText(element, searchText) {
    if (!searchText) {
        element.innerHTML = element.textContent;
        return;
    }
    const regex = new RegExp(`(${searchText})`, "gi");
    element.innerHTML = element.textContent.replace(regex, `<mark>$1</mark>`);
}

// Expand/Collapse All
function toggleFAQ(expand) {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.style.display = expand ? "block" : "none";
    });
}

// FAQ Voting System
function setupVoting() {
    document.querySelectorAll(".vote-btn").forEach(button => {
        button.addEventListener("click", function () {
            const voteType = this.dataset.vote;
            alert(`Thanks for your feedback! You voted: ${voteType === "yes" ? "Helpful 👍" : "Not Helpful 👎"}`);
        });
    });
}

// Category Filter
function filterByCategory(category) {
    document.querySelectorAll(".faq-item").forEach(item => {
        if (category === "All" || item.dataset.category === category) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

// Call FAQ generation on page load
document.addEventListener("DOMContentLoaded", generateFAQ);
