// Main JavaScript for The Blacksmith Market

// DOM Elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.querySelector('header');
const cookieConsent = document.querySelector('.cookie-consent');
const acceptCookiesBtn = document.getElementById('accept-cookies');
const declineCookiesBtn = document.getElementById('decline-cookies');
const contactForm = document.getElementById('contact-form');

// Mobile Menu Toggle
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
    }
  });
}

// Sticky Header on Scroll
let lastScrollPosition = 0;
window.addEventListener('scroll', () => {
  const currentScrollPosition = window.pageYOffset;
  
  if (currentScrollPosition > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  
  lastScrollPosition = currentScrollPosition;
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerHeight = header.offsetHeight;
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      // Close mobile menu if open
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
      }
    }
  });
});

// Animation on Scroll
const animateElements = document.querySelectorAll('.animate-on-scroll');

const checkInView = () => {
  const windowHeight = window.innerHeight;
  const windowTopPosition = window.pageYOffset;
  const windowBottomPosition = windowTopPosition + windowHeight;

  animateElements.forEach(element => {
    const elementHeight = element.offsetHeight;
    const elementTopPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const elementBottomPosition = elementTopPosition + elementHeight;

    // Check if element is in viewport
    if (
      (elementBottomPosition >= windowTopPosition && elementTopPosition <= windowBottomPosition) ||
      (elementTopPosition <= windowBottomPosition && elementBottomPosition >= windowTopPosition)
    ) {
      element.classList.add('animate-fade-in');
    }
  });
};

window.addEventListener('scroll', checkInView);
window.addEventListener('resize', checkInView);
window.addEventListener('load', checkInView);

// Cookie Consent
const showCookieConsent = () => {
  if (localStorage.getItem('cookieConsent') !== 'true' && cookieConsent) {
    setTimeout(() => {
      cookieConsent.classList.add('show');
    }, 2000);
  }
};

if (acceptCookiesBtn) {
  acceptCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'true');
    cookieConsent.classList.remove('show');
  });
}

if (declineCookiesBtn) {
  declineCookiesBtn.addEventListener('click', () => {
    cookieConsent.classList.remove('show');
  });
}

// Form Submission
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const formValues = Object.fromEntries(formData.entries());
    
    // Here you would typically send the data to your server
    // This is just a placeholder for demonstration
    console.log('Form submitted with values:', formValues);
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'form-success';
    successMessage.textContent = 'Thank you for your inquiry! We will review your information and contact you shortly.';
    
    contactForm.innerHTML = '';
    contactForm.appendChild(successMessage);
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showCookieConsent();
});

// Blog Search Functionality
const blogSearchForm = document.getElementById('blog-search-form');
if (blogSearchForm) {
  blogSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchInput = blogSearchForm.querySelector('input').value.toLowerCase();
    
    // In a real implementation, this would redirect to search results
    alert(`Search results for: ${searchInput}`);
  });
}

// Testimonial Slider (if needed)
class TestimonialSlider {
  constructor(sliderSelector) {
    this.slider = document.querySelector(sliderSelector);
    if (!this.slider) return;
    
    this.slides = this.slider.querySelectorAll('.testimonial-card');
    this.currentSlide = 0;
    this.slideCount = this.slides.length;
    this.slideInterval = null;
    
    this.init();
  }
  
  init() {
    if (this.slideCount <= 1) return;
    
    // Create navigation dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    
    for (let i = 0; i < this.slideCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goToSlide(i));
      dotsContainer.appendChild(dot);
    }
    
    this.slider.appendChild(dotsContainer);
    this.dots = dotsContainer.querySelectorAll('.slider-dot');
    
    // Show first slide
    this.goToSlide(0);
    
    // Auto-rotate slides
    this.startSlideInterval();
    
    // Pause on hover
    this.slider.addEventListener('mouseenter', () => this.stopSlideInterval());
    this.slider.addEventListener('mouseleave', () => this.startSlideInterval());
  }
  
  goToSlide(index) {
    // Hide all slides
    this.slides.forEach(slide => {
      slide.classList.remove('active');
    });
    
    // Remove active class from all dots
    this.dots.forEach(dot => {
      dot.classList.remove('active');
    });
    
    // Show current slide and activate dot
    this.slides[index].classList.add('active');
    this.dots[index].classList.add('active');
    
    this.currentSlide = index;
  }
  
  nextSlide() {
    const next = (this.currentSlide + 1) % this.slideCount;
    this.goToSlide(next);
  }
  
  prevSlide() {
    const prev = (this.currentSlide - 1 + this.slideCount) % this.slideCount;
    this.goToSlide(prev);
  }
  
  startSlideInterval() {
    this.stopSlideInterval();
    this.slideInterval = setInterval(() => this.nextSlide(), 5000);
  }
  
  stopSlideInterval() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }
}

// Initialize testimonial slider if exists
document.addEventListener('DOMContentLoaded', () => {
  new TestimonialSlider('.testimonials-slider');
});