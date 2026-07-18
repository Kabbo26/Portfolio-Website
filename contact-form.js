// contact-form.js — submits the contact form to Netlify Forms via fetch
// so the page doesn't reload (keeps your SPA section-switching intact).
(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  function encode(data) {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => { payload[key] = value; });

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent; //change here
    submitBtn.disabled = true;
    status.textContent = 'Sending...';
    status.textContent = '';  //change here
    status.style.color = '#ffffff';

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        status.textContent = "✅ Thanks! Your message has been sent — I'll get back to you soon.";
        status.style.color = '#4caf50';
        form.reset();
      })
      .catch((err) => {
        status.textContent = '❌ Something went wrong. Please try again or email me directly.';
        status.style.color = '#e05555';
        console.error('[contact-form] submission failed:', err);
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText; //change here
      });
  });
})();