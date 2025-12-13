// navigation control
const navLinks = document.querySelectorAll('header nav a');
const logoLink = document.querySelector('.logo');
const sections = document.querySelectorAll('section');
const menuIcon = document.querySelector('#menu-icon');
const Navbar = document.querySelector('header nav');

menuIcon.addEventListener('click', () => {
  menuIcon.classList.toggle('bx-x');
  Navbar.classList.toggle('active');
});

const activePage = () => {
  const header = document .querySelector('header');
  const barsBox = document .querySelector('.bars-box');

   header.classList.remove('active');
  setTimeout(() => {
    header.classList.add('active');
  }, 350);


  navLinks.forEach(link => {
    link.classList.remove('active');
   });


   barsBox.classList.remove('active');
  setTimeout(() => {
    barsBox.classList.add('active');
  }, 350);

  
  sections.forEach(section => {
    section.classList.remove('active');
   });


     menuIcon.classList.remove('bx-x');
  Navbar.classList.remove('active');
}

navLinks.forEach((link, idx) => {
  link.addEventListener('click',() => {
  if (!link.classList.contains('active')) {
    activePage();

    link.classList.add('active');

    setTimeout(() => {
      sections[idx].classList.add('active');
    }, 350);
  }
  });
});

logoLink.addEventListener('click', () => {
  if (!navLinks[0].classList.contains('active')) {
    activePage();

    navLinks[0].classList.add('active');

    setTimeout(() => {
      sections[0].classList.add('active');
    }, 350);
  }
});

// Resume section
const resumeBtns = document.querySelectorAll(".resume-btn");

resumeBtns.forEach((btn, idx) => {
  btn.addEventListener("click", () => {
    const resumedetails = document.querySelectorAll(".resume-detail");

    resumeBtns.forEach((btn) => {
      btn.classList.remove("active");
    });
    btn.classList.add("active");

    resumedetails.forEach((detail) => {
      detail.classList.remove("active");
    });
    resumedetails[idx].classList.add("active");
  });
});

// portfolio section
document.querySelectorAll(".portfolio-box").forEach((box) => {
  const slide = box.querySelector(".img-slide");
  const imgs = box.querySelectorAll(".img-item");
  const prev = box.querySelector(".arrow-left");
  const next = box.querySelector(".arrow-right");
  let index = 0;

  // Update carousel position
  const updateCarousel = () => {
    slide.style.transform = `translateX(-${index * 100}%)`;
    slide.style.transition = "transform 0.5s ease";
    

    // Enable/disable buttons
    prev.classList.toggle("disabled", index === 0);
    next.classList.toggle("disabled", index === imgs.length - 1);
  };

  // Event listeners
  next.addEventListener("click", () => {
    if (index < imgs.length - 1) {
      index++;
      updateCarousel();
    }
  });

  prev.addEventListener("click", () => {
    if (index > 0) {
      index--;
      updateCarousel();
    }
  });

  // Initial setup
  updateCarousel();
});
