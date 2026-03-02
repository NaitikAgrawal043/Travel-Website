'use strict';

/**
 * navbar toggle with accessibility
 */

const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const header = document.querySelector("[data-header]");

navToggleBtn.addEventListener("click", function () {
  const isActive = this.classList.toggle("active");
  header.classList.toggle("active");
  this.setAttribute("aria-expanded", isActive);
});

// Close navbar on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && header.classList.contains("active")) {
    navToggleBtn.classList.remove("active");
    header.classList.remove("active");
    navToggleBtn.setAttribute("aria-expanded", "false");
    navToggleBtn.focus();
  }
});



/**
 * show go top btn when scroll window to 500px
 */

const goTopBtn = document.querySelector("[data-go-top]");

window.addEventListener("scroll", function () {
  window.scrollY >= 500 ? goTopBtn.classList.add("active")
    : goTopBtn.classList.remove("active");
});



/**
 * Newsletter form validation
 */

const newsletterForm = document.getElementById("newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const emailInput = this.querySelector('input[type="email"]');
    const feedback = this.querySelector(".form-feedback");
    const email = emailInput.value.trim();

    if (!email) {
      feedback.textContent = "Please enter your email address.";
      feedback.className = "form-feedback error";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      feedback.textContent = "Please enter a valid email address.";
      feedback.className = "form-feedback error";
      return;
    }

    feedback.textContent = "Thank you for subscribing! 🎉";
    feedback.className = "form-feedback success";
    emailInput.value = "";

    setTimeout(() => {
      feedback.textContent = "";
      feedback.className = "form-feedback";
    }, 5000);
  });
}



/**
 * Smooth scroll for anchor links
 */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId === "#" || targetId === "#top") return;

    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});