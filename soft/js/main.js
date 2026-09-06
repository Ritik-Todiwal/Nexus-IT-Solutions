/* ============================================
   NEXUS DIGITAL - Main JavaScript
   ============================================ */

function initializePage() {
  initLoader();
  initNavbar();
  initScrollAnimations();
  initCounters();
  initFAQ();
  initFormValidation();
  initContactForm();
  initPortfolioFilters();
  initTechTabs();
  initBackToTop();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage, { once: true });
} else {
  initializePage();
}

/* --- Loader --- */
function initLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 1600);
    });
  }
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const payload = await response.json();
      if (!response.ok) {
        window.alert(Object.values(payload.errors || {}).join('\n'));
        return;
      }
      form.style.display = 'none';
      document.getElementById('contactSuccess').style.display = 'block';
    } catch (_error) {
      window.alert('We could not send your message. Please try again.');
    } finally {
      submitButton.disabled = false;
    }
  });
}

/* --- Navbar --- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  if (!navbar) return;

  setActivePageLink(navLinksFor(menu));

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });

    // Close menu on link click
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menu.querySelectorAll('.nav-link').forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');
        toggle.classList.remove('active');
        menu.classList.remove('active');
      });
    });
  }

  // Active link based on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = navLinksFor(menu);

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    if (!current) return;

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

function navLinksFor(menu) {
  return menu ? menu.querySelectorAll('.nav-link') : document.querySelectorAll('.nav-link');
}

function setActivePageLink(navLinks) {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const pageLinks = Array.from(navLinks).filter(link => !link.getAttribute('href').startsWith('#'));
  const matchedLink = pageLinks.find(link => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/+$/, '') || '/';
    return linkPath === currentPath;
  });

  if (!matchedLink) return;
  pageLinks.forEach(link => link.classList.remove('active'));
  matchedLink.classList.add('active');
}

/* --- Scroll Animations --- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // Animate cards with stagger
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.service-card, .project-card, .testimonial-card, .value-card, .team-card, .solution-card, .portfolio-card, .service-full-card');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 100);
        });
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.services-grid, .projects-grid, .testimonials-slider, .about-values, .team-grid, .solutions-grid, .portfolio-grid, .services-full-grid').forEach(grid => {
    grid.querySelectorAll('.service-card, .project-card, .testimonial-card, .value-card, .team-card, .solution-card, .portfolio-card, .service-full-card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'all 0.5s ease';
    });
    cardObserver.observe(grid);
  });
}

/* --- Counter Animation --- */
function initCounters() {
  const counters = document.querySelectorAll('.hero-stat-number, .stat-number');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });
}

function animateCounter(element) {
  const text = element.textContent;
  const match = text.match(/(\d+)/);
  if (!match) return;

  const target = parseInt(match[1]);
  const prefix = text.slice(0, match.index);
  const suffix = text.slice((match.index || 0) + match[1].length);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = `${prefix}${Math.floor(current)}${suffix}`;
  }, 16);
}

/* --- FAQ Accordion --- */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
        faq.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked if wasn't active
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* --- Form Validation --- */
function initFormValidation() {
  const forms = document.querySelectorAll('.application-form');
  
  forms.forEach(form => {
    const nextBtns = form.querySelectorAll('.btn-next');
    const prevBtns = form.querySelectorAll('.btn-prev');
    const submitBtn = form.querySelector('.btn-submit');

    // Next button
    nextBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.closest('.form-step');
        if (validateStep(step)) {
          const nextStep = step.nextElementSibling;
          if (nextStep && nextStep.classList.contains('form-step')) {
            step.classList.remove('active');
            nextStep.classList.add('active');
            updateProgress(nextStep);
          }
        }
      });
    });

    // Previous button
    prevBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.closest('.form-step');
        const prevStep = step.previousElementSibling;
        if (prevStep && prevStep.classList.contains('form-step')) {
          step.classList.remove('active');
          prevStep.classList.add('active');
          updateProgress(prevStep);
        }
      });
    });

    // Submit button
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const step = submitBtn.closest('.form-step');
        if (validateStep(step)) {
          submitApplication(form, submitBtn);
        }
      });
    }

    // Real-time validation on blur
    form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
      input.addEventListener('blur', () => {
        validateField(input);
      });

      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          validateField(input);
        }
      });
    });
  });
}

async function submitApplication(form, submitBtn) {
  submitBtn.disabled = true;
  const originalLabel = submitBtn.innerHTML;
  submitBtn.textContent = 'Submitting...';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json();
    if (!response.ok) {
      Object.entries(payload.errors || {}).forEach(([name, message]) => {
        const field = form.elements.namedItem(name);
        if (field) {
          field.classList.add('error');
          const error = field.parentElement.querySelector('.form-error');
          if (error) {
            error.textContent = message;
            error.classList.add('visible');
          }
        }
      });
      return;
    }
    showSuccess(form);
  } catch (_error) {
    window.alert('We could not submit your request. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalLabel;
  }
}

function validateStep(step) {
  let isValid = true;
  const requiredFields = step.querySelectorAll('[required]');
  
  requiredFields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  return isValid;
}

function validateField(field) {
  const value = field.type === 'checkbox' ? (field.checked ? 'checked' : '') : field.value.trim();
  const errorEl = field.closest('.form-group')?.querySelector('.form-error');
  let errorMsg = '';

  if (field.hasAttribute('required') && !value) {
    errorMsg = 'This field is required';
  }

  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errorMsg = 'Please enter a valid email address';
    }
  }

  if (field.type === 'tel' && value) {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    if (!phoneRegex.test(value)) {
      errorMsg = 'Please enter a valid phone number';
    }
  }

  if (field.hasAttribute('minlength') && value.length < parseInt(field.minLength)) {
    errorMsg = `Minimum ${field.minLength} characters required`;
  }

  if (errorMsg) {
    field.classList.add('error');
    if (errorEl) {
      errorEl.textContent = errorMsg;
      errorEl.classList.add('visible');
    }
    return false;
  } else {
    field.classList.remove('error');
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
    return true;
  }
}

function updateProgress(currentStep) {
  const steps = document.querySelectorAll('.form-step');
  const stepIndex = Array.from(steps).indexOf(currentStep);
  const progressBars = document.querySelectorAll('.form-progress-bar');
  const progressSteps = document.querySelectorAll('.progress-step');

  progressSteps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index < stepIndex) {
      step.classList.add('completed');
    } else if (index === stepIndex) {
      step.classList.add('active');
    }
  });

  progressBars.forEach(bar => {
    const percentage = (stepIndex / (steps.length - 1)) * 80;
    bar.style.width = `${percentage}%`;
  });
}

function showSuccess(form) {
  const successEl = form.querySelector('.form-success');
  const formSteps = form.querySelector('.form-steps');
  
  if (formSteps) {
    formSteps.style.display = 'none';
  }
  if (successEl) {
    successEl.classList.add('visible');
  }

  // Scroll to success message
  successEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* --- Portfolio Filters --- */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      portfolioCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* --- Tech Tabs --- */
function initTechTabs() {
  const techBtns = document.querySelectorAll('.tech-category-btn');
  const techItems = document.querySelectorAll('.tech-item');

  techBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      techBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;

      techItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* --- Back to Top --- */
function initBackToTop() {
  const backToTop = document.querySelector('.back-to-top');
  
  if (!backToTop) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --- Smooth Scroll --- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
}

/* --- File Upload Drag & Drop --- */
document.querySelectorAll('.file-upload').forEach(upload => {
  ['dragenter', 'dragover'].forEach(event => {
    upload.addEventListener(event, (e) => {
      e.preventDefault();
      upload.style.borderColor = 'rgba(255, 77, 97, 0.5)';
      upload.style.background = 'rgba(255, 77, 97, 0.05)';
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    upload.addEventListener(event, (e) => {
      e.preventDefault();
      upload.style.borderColor = '';
      upload.style.background = '';
    });
  });

  upload.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = upload.querySelector('input[type="file"]');
      if (input) {
        input.files = files;
        const fileName = files[0].name;
        const textEl = upload.querySelector('.file-upload-text');
        if (textEl) {
          textEl.innerHTML = `<span>${fileName}</span> ready to upload`;
        }
      }
    }
  });
});

/* --- Parallax on mouse move (hero section) --- */
document.querySelectorAll('.hero').forEach(hero => {
  const shapes = hero.querySelectorAll('.hero-geo, .hero-circle, .hero-dots');
  
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    shapes.forEach((shape, index) => {
      const speed = (index + 1) * 10;
      shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
});