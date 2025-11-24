document.addEventListener("DOMContentLoaded", () => {
  const popup = document.querySelector(".newsletter-popup");
  const openBtn = document.querySelector(".newsletter-popup__open-btn");
  const closeBtn = document.querySelector(".newsletter-popup__close-btn");
  const overlay = document.querySelector(".newsletter-popup__overlay");
  const form = document.querySelector(".newsletter-popup__form");
  const emailInput = document.getElementById("email-input");
  const emailError = document.getElementById("email-error");
  const nameInput = document.getElementById('name-input');
  const nameError = document.getElementById('name-error');
  const categorySelect = document.getElementById('category-select');
  const categoryError = document.getElementById('category-error');


  const showPopup = () => {
    popup.hidden = false;
    requestAnimationFrame(() => {
      popup.classList.add("newsletter-popup--visible");
      // input.focus();
      if (nameInput) nameInput.focus();
    });
  };

  const hidePopup = () => {
    popup.classList.remove("newsletter-popup--visible");
    popup.addEventListener(
      "transitionend",
      () => {
        popup.hidden = true;
        emailError.textContent = "";
        form.reset();
        openBtn.focus();
      },
      { once: true }
    );
  };

  const validateEmail = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  openBtn.addEventListener("click", showPopup);
  closeBtn.addEventListener("click", hidePopup);
  overlay.addEventListener("click", hidePopup);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Clear previous errors
    [nameError, categoryError, emailError].forEach(span => { if (span) span.textContent = ''; });
    [nameInput, categorySelect, emailInput].forEach(el => { if (el) el.removeAttribute('aria-invalid'); });
    
    // const email = input.value.trim();
    // Basic validation
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    // const categoryVal = categorySelect.value;

    if (!nameVal) {
      nameError.textContent = 'Please enter your name.';
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      return;
    }
    
    if (!emailVal || !validateEmail(emailVal)) {
      emailError.textContent = 'Please enter a valid email address.';
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.focus();
      return;
    }

    // Building payload
    // const payload = {
    //   name: nameVal,
    //   email: emailVal,
    //   category: categoryVal || null
    // };

    // Send payload
    // fetch('/newsletter-signup-endpoint', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    //   }).then(res => {
      
    //   }).catch(err => {
      
    //   });
    // });

    // input.removeAttribute("aria-invalid");
    emailError.textContent = "✅ Thank you for subscribing!";
    setTimeout(() => hidePopup(), 1500);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("newsletter-popup--visible")) {
      hidePopup();
    }
  });
});
