document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const homepage = document.getElementById('homepage');

    // Animation timing (loader duration)
    const animationTarget = 3000;

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.site-header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    // Run loader animation logic if elements exist
    if (loader && homepage) {
        setTimeout(() => {
            loader.classList.add('fade-out');
            homepage.classList.add('visible');
            document.body.style.overflow = 'auto';

            // Trigger counter animation after fade-in
            setTimeout(animateCounters, 1000);

            setTimeout(() => {
                loader.style.display = 'none';
            }, 1000);
        }, animationTarget);
    } else {
        // Direct transition for pages without loader
        if (homepage) {
            homepage.classList.add('visible');
            setTimeout(animateCounters, 500);
        }
    }

    // Simulation of counter animation (Endurer style)
    function animateCounters() {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const valText = stat.innerText.replace(/[^0-9]/g, '');
            const target = parseInt(valText);
            if (isNaN(target)) return;

            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.innerText = target + (stat.innerText.includes('M') ? 'M' : '');
                    clearInterval(timer);
                } else {
                    stat.innerText = Math.floor(current) + (stat.innerText.includes('M') ? 'M' : '');
                }
            }, 30);
        });
    }

    // Modal logic for Home page elements (legacy compatibility)
    const modal = document.getElementById('register-modal');
    if (modal) {
        const openBtns = document.querySelectorAll('.hero-cta a[href="#register"], .race-card .btn');
        const closeBtn = document.querySelector('.close-modal');
        const raceSelect = document.getElementById('race-select');
        const akField = document.getElementById('ak-member-field');

        const openModal = (e) => {
            if (e) e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        openBtns.forEach(btn => btn.addEventListener('click', openModal));

        if (closeBtn) closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        if (raceSelect) raceSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === '21k' || val === '5k-elite') {
                akField.style.display = 'block';
                akField.querySelector('input').required = true;
            } else {
                akField.style.display = 'none';
                akField.querySelector('input').required = false;
            }
        });

        const form = document.getElementById('marathon-form');
        if (form) form.addEventListener('submit', (e) => {
            e.preventDefault();
            const race = raceSelect.value;
            const name = form.querySelector('input[type="text"]').value;
            alert(`Payment successful! Welcome, ${name}. Your Marathon Number for the ${race} is: ${Math.floor(1000 + Math.random() * 9000)}`);
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
});
