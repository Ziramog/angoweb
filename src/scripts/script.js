// --- Sticky Header Logic ---
const header = document.getElementById('main-header');

if (header) {
    const handleScroll = () => {
        if (window.scrollY > (window.innerHeight * 0.1)) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check state immediately on load
}

// --- Mobile Menu Logic ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIcon = mobileMenuBtn ? mobileMenuBtn.querySelector('.menu-icon') : null;

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        
        if (mobileMenu.classList.contains('open')) {
            menuIcon.classList.remove('ph-list');
            menuIcon.classList.add('ph-x');
        } else {
            menuIcon.classList.remove('ph-x');
            menuIcon.classList.add('ph-list');
        }
    });

    // Close mobile menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('.nav-link, .btn');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            menuIcon.classList.remove('ph-x');
            menuIcon.classList.add('ph-list');
        });
    });
}

// --- Stats Counter Animation ---
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
let hasAnimatedStats = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimatedStats) {
            hasAnimatedStats = true;
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const prefix = stat.getAttribute('data-prefix') || '';
                const suffix = stat.getAttribute('data-suffix') || '';
                let start = 0;
                let startTime = null;

                function step(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    // Ease out quad
                    const easeProgress = progress * (2 - progress);
                    const current = Math.floor(easeProgress * target);
                    stat.innerText = prefix + current + suffix;
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    } else {
                        stat.innerText = prefix + target + suffix;
                    }
                }
                window.requestAnimationFrame(step);
            });
        }
    });
}, { threshold: 0.5 });

const statsBand = document.querySelector('.stats-band');
if (statsBand) {
    statsObserver.observe(statsBand);
}

// --- Scroll Reveal Animation Logic ---
const revealElements = document.querySelectorAll('[data-reveal]');

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('visible');
            // Optional: Stop observing once revealed
            // observer.unobserve(entry.target);
        }
    });
}, revealOptions);

revealElements.forEach(el => {
    revealOnScroll.observe(el);
});

// Trigger reveal immediately for elements already in viewport on load
setTimeout(() => {
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('visible');
        }
    });
}, 100);
