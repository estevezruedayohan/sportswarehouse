document.addEventListener("DOMContentLoaded", () => {
  const popup = document.querySelector(".newsletter-popup");
  const openBtn = document.querySelector(".newsletter-popup__open-btn");
  const closeBtn = document.querySelector(".newsletter-popup__close-btn");
  const overlay = document.querySelector(".newsletter-popup__overlay");
  const form = document.querySelector(".newsletter-popup__form");
  const input = document.querySelector(".newsletter-popup__input");
  const errorMsg = document.querySelector(".newsletter-popup__error");

  const showPopup = () => {
    popup.hidden = false;
    requestAnimationFrame(() => {
      popup.classList.add("newsletter-popup--visible");
      input.focus();
    });
  };

  const hidePopup = () => {
    popup.classList.remove("newsletter-popup--visible");
    popup.addEventListener(
      "transitionend",
      () => {
        popup.hidden = true;
        errorMsg.textContent = "";
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
    const email = input.value.trim();

    if (!validateEmail(email)) {
      errorMsg.textContent = "Please enter a valid email address.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }

    input.removeAttribute("aria-invalid");
    errorMsg.textContent = "✅ Thank you for subscribing!";
    setTimeout(() => hidePopup(), 1500);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("newsletter-popup--visible")) {
      hidePopup();
    }
  });
});
