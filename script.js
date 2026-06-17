document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     PAGE LOADER
     ========================================================================== */
  const loader = document.getElementById('loader');
  
  // Hide loader once everything (including styles, fonts, etc.) is fully loaded
  window.addEventListener('load', () => {
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        document.body.classList.remove('loading');
      }, 600); // Matches the CSS transition duration
    }
  });

  // Fallback: hide loader after 3 seconds in case window load event doesn't fire
  setTimeout(() => {
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      document.body.classList.remove('loading');
    }
  }, 3000);

  /* ==========================================================================
     THEME TOGGLE
     ========================================================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // Retrieve previous preference, default to dark
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark-theme';
  body.className = savedTheme + (body.classList.contains('loading') ? ' loading' : '');

  themeToggleBtn.addEventListener('click', () => {
    const isLoading = body.classList.contains('loading');
    
    if (body.classList.contains('dark-theme')) {
      body.className = 'light-theme' + (isLoading ? ' loading' : '');
      localStorage.setItem('portfolio-theme', 'light-theme');
    } else {
      body.className = 'dark-theme' + (isLoading ? ' loading' : '');
      localStorage.setItem('portfolio-theme', 'dark-theme');
    }
  });

  /* ==========================================================================
     INTERACTIVE TYPOGRAPHY (NAME INTRO CHAR SPLITTING)
     ========================================================================== */
  const nameHeadline = document.getElementById('hero-name-headline');
  if (nameHeadline) {
    const originalText = nameHeadline.textContent.trim();
    nameHeadline.textContent = ''; // Clear original text
    
    // Split into words first to maintain word wrapping
    const words = originalText.split(' ');
    
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      
      // Split word into characters
      const chars = word.split('');
      chars.forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = char;
        wordSpan.appendChild(charSpan);
      });
      
      nameHeadline.appendChild(wordSpan);
      
      // Add a space between words
      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'char-space';
        spaceSpan.textContent = ' ';
        nameHeadline.appendChild(spaceSpan);
      }
    });
  }

  /* ==========================================================================
     ANTIGRAVITY INTERACTIVE CANVAS BACKGROUND
     ========================================================================== */
  const canvas = document.getElementById('antigravity-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    
    let dots = []; // Will store 2D array of grid points for easy line drawing
    const spacing = 50; // Grid spacing in pixels
    let mouse = { x: -1000, y: -1000, active: false };
    let ripples = []; // Store active click ripples
    
    // Track mouse coordinates
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });
    
    // Reset mouse when it leaves window
    document.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    });

    // Create interactive ripple on click
    window.addEventListener('click', (e) => {
      // Don't trigger ripples on interactive links/buttons/inputs
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.8,
        speed: 12,
        force: 32, // Maximum repulsion offset
        width: 100 // Width of wave ring
      });
    });
    
    // Grid Point Class
    class GridPoint {
      constructor(baseX, baseY) {
        this.baseX = baseX;
        this.baseY = baseY;
        this.x = baseX;
        this.y = baseY;
        this.radius = 1.5;
      }
      
      update() {
        let targetX = this.baseX;
        let targetY = this.baseY;
        let totalDisplacementX = 0;
        let totalDisplacementY = 0;
        
        // 1. Mouse Repulsion Physics
        if (mouse.active) {
          const dx = mouse.x - this.baseX;
          const dy = mouse.y - this.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180; // Expanded active cursor radius
          
          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            const repelDistance = force * 35; // Increased push distance
            const angle = Math.atan2(dy, dx);
            
            totalDisplacementX -= Math.cos(angle) * repelDistance;
            totalDisplacementY -= Math.sin(angle) * repelDistance;
          }
        }

        // 2. Ripple Expansion Wave Physics
        ripples.forEach(ripple => {
          const dx = this.baseX - ripple.x;
          const dy = this.baseY - ripple.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Check if point is inside the active ripple wave range
          const diff = Math.abs(dist - ripple.radius);
          if (diff < ripple.width) {
            const factor = (ripple.width - diff) / ripple.width; // 0 to 1
            const pulseForce = Math.sin(factor * Math.PI) * ripple.force * (1 - ripple.radius / ripple.maxRadius);
            const angle = Math.atan2(dy, dx);
            
            totalDisplacementX += Math.cos(angle) * pulseForce;
            totalDisplacementY += Math.sin(angle) * pulseForce;
          }
        });

        // Set ultimate target coordinate
        targetX += totalDisplacementX;
        targetY += totalDisplacementY;
        
        // Elastic/Spring Easing back to target position
        this.x += (targetX - this.x) * 0.12;
        this.y += (targetY - this.y) * 0.12;
      }
    }
    
    let cols = 0;
    let rows = 0;

    // Set up canvas size and generate grid
    function initCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      
      dots = [];
      cols = Math.ceil(window.innerWidth / spacing) + 1;
      rows = Math.ceil(window.innerHeight / spacing) + 1;
      
      for (let i = 0; i < cols; i++) {
        dots[i] = [];
        for (let j = 0; j < rows; j++) {
          dots[i][j] = new GridPoint(i * spacing, j * spacing);
        }
      }
    }
    
    // Retrieve CSS theme values dynamically
    function getThemeColors() {
      const isDark = body.classList.contains('dark-theme');
      return {
        dotBase: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        lineBase: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.012)',
        activeColor: 'rgba(16, 185, 129, alpha)' // Dynamic opacity accent
      };
    }
    
    // Animation Loop
    function animate() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      const themeColors = getThemeColors();

      // Update ripples
      ripples.forEach((ripple, index) => {
        ripple.radius += ripple.speed;
        if (ripple.radius > ripple.maxRadius) {
          ripples.splice(index, 1);
        }
      });
      
      // Update all grid point positions first
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots[i][j].update();
        }
      }

      // Draw Grid Mesh Lines (Horizontal and Vertical connections)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const current = dots[i][j];
          
          // Draw horizontal connection
          if (i < cols - 1) {
            const right = dots[i + 1][j];
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(right.x, right.y);
            
            // Adjust line color dynamically if close to cursor
            let opacity = 0;
            if (mouse.active) {
              const mx = (current.x + right.x) / 2;
              const my = (current.y + right.y) / 2;
              const dist = Math.sqrt((mouse.x - mx) ** 2 + (mouse.y - my) ** 2);
              if (dist < 140) {
                opacity = (140 - dist) / 140;
              }
            }
            
            if (opacity > 0) {
              ctx.strokeStyle = themeColors.activeColor.replace('alpha', (opacity * 0.12).toFixed(3));
            } else {
              ctx.strokeStyle = themeColors.lineBase;
            }
            ctx.stroke();
          }

          // Draw vertical connection
          if (j < rows - 1) {
            const bottom = dots[i][j + 1];
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(bottom.x, bottom.y);
            
            let opacity = 0;
            if (mouse.active) {
              const mx = (current.x + bottom.x) / 2;
              const my = (current.y + bottom.y) / 2;
              const dist = Math.sqrt((mouse.x - mx) ** 2 + (mouse.y - my) ** 2);
              if (dist < 140) {
                opacity = (140 - dist) / 140;
              }
            }
            
            if (opacity > 0) {
              ctx.strokeStyle = themeColors.activeColor.replace('alpha', (opacity * 0.12).toFixed(3));
            } else {
              ctx.strokeStyle = themeColors.lineBase;
            }
            ctx.stroke();
          }
        }
      }

      // Draw Grid Dots
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const current = dots[i][j];
          ctx.beginPath();
          ctx.arc(current.x, current.y, current.radius, 0, Math.PI * 2);
          
          if (mouse.active) {
            const dx = mouse.x - current.x;
            const dy = mouse.y - current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 140) {
              const opacity = (140 - dist) / 140;
              ctx.beginPath();
              // Make dot slightly larger as it glows
              ctx.arc(current.x, current.y, current.radius * (1 + opacity * 0.4), 0, Math.PI * 2);
              ctx.fillStyle = themeColors.activeColor.replace('alpha', opacity.toFixed(2));
              ctx.fill();
              continue;
            }
          }
          
          ctx.fillStyle = themeColors.dotBase;
          ctx.fill();
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    // Initialize and run
    initCanvas();
    animate();
    window.addEventListener('resize', initCanvas);
  }

  /* ==========================================================================
     BENTO GRID MOUSE-TRACKING EFFECT
     ========================================================================== */
  const bentoCards = document.querySelectorAll('.bento-card');

  bentoCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update custom properties on the specific card being hovered
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* ==========================================================================
     COPY EMAIL TO CLIPBOARD
     ========================================================================== */
  const copyEmailBlock = document.getElementById('copy-email-trigger');
  const tooltip = document.getElementById('copy-tooltip');
  const emailAddress = 'sanglikarsharanaprasas@gmail.com'; // Updated Gmail address

  if (copyEmailBlock && tooltip) {
    copyEmailBlock.addEventListener('click', () => {
      navigator.clipboard.writeText(emailAddress)
        .then(() => {
          // Show tooltip
          tooltip.classList.add('show');

          // Reset tooltip after 2.5 seconds
          setTimeout(() => {
            tooltip.classList.remove('show');
          }, 2500);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    });
  }

  /* ==========================================================================
     INTERSECTION OBSERVER FOR SCROLL REVEALS
     ========================================================================== */
  const revealElements = document.querySelectorAll('.scroll-reveal');

  const revealObserverOptions = {
    root: null,
    threshold: 0.05,
    rootMargin: '0px 0px -60px 0px' // Reveal slightly before crossing top
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Keep visible once active
      }
    });
  }, revealObserverOptions);

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================================================
     SCROLL ACTIVE LINK HIGHLIGHTING
     ========================================================================== */
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let currentSectionId = '';
    const scrollPos = window.scrollY + 250; // Offset for header height and spacing

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }

  // Bind to scroll and call once on load
  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink();

  /* ==========================================================================
     CONTACT FORM SUBMISSION LOGIC
     ========================================================================== */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Show sending feedback
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const submitBtnText = submitBtn.querySelector('span');
      const originalText = submitBtnText.textContent;
      
      submitBtn.disabled = true;
      submitBtnText.textContent = 'Sending Message...';
      formStatus.className = 'form-status-msg font-mono';
      formStatus.textContent = '';

      // Simulate network request latency
      setTimeout(() => {
        // Success scenario
        formStatus.textContent = 'MESSAGE DELIVERED SUCCESSFULLY.';
        formStatus.classList.add('success');
        
        // Clear fields
        contactForm.reset();

        // Restore button state
        submitBtn.disabled = false;
        submitBtnText.textContent = originalText;

        // Fade out message after 5 seconds
        setTimeout(() => {
          formStatus.classList.remove('success');
          formStatus.textContent = '';
        }, 5000);
      }, 1500);
    });
  }
});
