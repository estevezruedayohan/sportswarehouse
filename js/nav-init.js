(function(){
    const navToggle = document.getElementById('nav-toggle');
    const mobileNav = document.getElementById('mobile-nav-list');
    if (navToggle && mobileNav) {
        function sync() { mobileNav.setAttribute('aria-hidden', (!navToggle.checked).toString()); }
        // initial
        sync();
        navToggle.addEventListener('change', sync);
    }
})();