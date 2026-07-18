// ============================================================
// script.js — FIXED & MERGED VERSION
// Takes: barsBox transition logic from NEW JS ✅
// Takes: smooth section reveal timing from OLD JS ✅
// Fixes: all bugs found in both versions
// ============================================================

// ── 1. Element References ──────────────────────────────────
const navLinks  = document.querySelectorAll('header nav a');
const logoLink  = document.querySelector('.logo');
const sections  = document.querySelectorAll('section');
const menuIcon  = document.querySelector('#menu-icon');
const Navbar    = document.querySelector('header nav');
const barsBox   = document.querySelector('.bars-box');
const header    = document.querySelector('header');

// ── 2. Mobile Menu Toggle ──────────────────────────────────
menuIcon.addEventListener('click', () => {
  menuIcon.classList.toggle('bx-x');
  Navbar.classList.toggle('active');
});

// ── 3. Core Transition Function ────────────────────────────
/*
  MERGED LOGIC:
  - Bar DROP direction: from NEW JS ✅ (barsBox.add first)
  - Section swap timing: from NEW JS ✅ (inside setTimeout)
  - Header animation restart: from NEW JS ✅
  - scroll reset: added ✅
  - z-index control during transition: added ✅
*/
const triggerTransition = (targetIndex) => {

  // STEP 1 — Drop the curtain (bars fall DOWN to cover screen)
  // ✅ FROM NEW JS: add 'active' FIRST so bars animate downward
  barsBox.style.zIndex = '200';   // ensure bars are above everything
  barsBox.classList.add('active');
  header.classList.remove('active');

  // STEP 2 — While screen is hidden, safely swap content
  // ✅ 400ms = enough time for all 6 bars to finish dropping
  //    (bar delays: 0.045s × 6 = 270ms + 300ms animation = ~570ms total)
  //    We use 400ms so swap happens mid-cover, feels snappy
  setTimeout(() => {

    // Remove all active states
    navLinks.forEach(link  => link.classList.remove('active'));
    sections.forEach(section => {
      section.classList.remove('active');
      section.scrollTop = 0; // ✅ reset scroll position on every section
    });

    // Activate the target
    navLinks[targetIndex].classList.add('active');
    sections[targetIndex].classList.add('active');

    // Close mobile menu if open
    menuIcon.classList.remove('bx-x');
    Navbar.classList.remove('active');

    // Restart header fade-in animation
    // Force reflow so animation replays correctly
    void header.offsetWidth;            // ✅ triggers reflow
    header.classList.add('active');

    // STEP 3 — Lift the curtain (bars rise UP to reveal new section)
    // ✅ FROM NEW JS: remove 'active' AFTER swap so bars animate upward
    barsBox.classList.remove('active');

    // Reset z-index after bars finish lifting (~300ms animation)
    setTimeout(() => {
      barsBox.style.zIndex = '';
    }, 350);

  }, 400);
};

// ── 4. Nav Link Click Handlers ─────────────────────────────
navLinks.forEach((link, idx) => {
  link.addEventListener('click', (e) => {
    e.preventDefault(); // ✅ FROM NEW JS: prevents page jump

    // Only trigger if clicking a different section
    if (!link.classList.contains('active')) {
      triggerTransition(idx);
    }
  });
});

// ── 5. Logo Click Handler ──────────────────────────────────
logoLink.addEventListener('click', (e) => {
  e.preventDefault(); // ✅ FROM NEW JS: prevents page jump

  // Only trigger if Home is not already active
  if (!navLinks[0].classList.contains('active')) {
    triggerTransition(0);
  }
});

// ── 6. Initial Page Load Reveal ───────────────────────────
/*
  On first load, bars-box starts with class 'active' in HTML
  (bars are covering the screen).
  We remove it after a short delay to reveal the home section.
  ✅ FROM NEW JS: proper load reveal logic
*/
window.addEventListener('load', () => {
  // Small delay so user sees the smooth reveal from the start
  setTimeout(() => {
    barsBox.classList.remove('active');
    // Header is already .active in HTML, so it will animate in
  }, 300);
});

// ── 7. Resume Tab Switching ────────────────────────────────
// ✅ UNCHANGED — works correctly in both versions
const resumeBtns = document.querySelectorAll('.resume-btn');

resumeBtns.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    const resumeDetails = document.querySelectorAll('.resume-detail');

    // Remove active from all buttons and details
    resumeBtns.forEach(b    => b.classList.remove('active'));
    resumeDetails.forEach(d => d.classList.remove('active'));

    // Activate clicked button and matching detail
    btn.classList.add('active');
    resumeDetails[idx].classList.add('active');
  });
});

// ── 8. Portfolio Carousel ──────────────────────────────────
// ✅ UNCHANGED — works correctly in both versions
document.querySelectorAll('.portfolio-box').forEach((box) => {
  const slide = box.querySelector('.img-slide');
  const imgs  = box.querySelectorAll('.img-item');
  const prev  = box.querySelector('.arrow-left');
  const next  = box.querySelector('.arrow-right');
  let index   = 0;

  const updateCarousel = () => {
    slide.style.transform  = `translateX(-${index * 100}%)`;
    slide.style.transition = 'transform 0.5s ease';

    // Toggle disabled state on buttons
    prev.classList.toggle('disabled', index === 0);
    next.classList.toggle('disabled', index === imgs.length - 1);
  };

  next.addEventListener('click', () => {
    if (index < imgs.length - 1) {
      index++;
      updateCarousel();
    }
  });

  prev.addEventListener('click', () => {
    if (index > 0) {
      index--;
      updateCarousel();
    }
  });

  // Set initial state
  updateCarousel();
});