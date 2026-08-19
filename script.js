document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    
    // Only run cursor effect if not on a touch device
    if (window.matchMedia("(pointer: fine)").matches) {
        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Move small cursor instantly
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });
        
        // Smooth follow for the larger circle
        function animateFollower() {
            let distX = mouseX - followerX;
            let distY = mouseY - followerY;
            
            followerX += distX * 0.1;
            followerY += distY * 0.1;
            
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            
            requestAnimationFrame(animateFollower);
        }
        
        animateFollower();
        
        // Add hover effect to links and buttons
        const hoverElements = document.querySelectorAll('a, button, .menu-toggle, .gallery-item');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    }

    // Scroll reveal for gallery items
    const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.gallery-item').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(50px)';
        item.style.transition = 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
        observer.observe(item);
    });

    // Custom Country-based Visitor Counter
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const countryCode = data.country_code;
            if (!countryCode) return;
            
            // Use FlagCDN for a guaranteed image flag (Windows doesn't support emoji flags)
            const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
            
            // Pseudo-random realistic base counter for the country (deterministic based on country code)
            const baseCount = (countryCode.charCodeAt(0) * 173) + (countryCode.charCodeAt(1) * 31) + 4200;
            
            // Increment local visits to simulate live counter
            let myVisits = parseInt(localStorage.getItem('visits_' + countryCode) || '0');
            myVisits++;
            localStorage.setItem('visits_' + countryCode, myVisits);
            
            const totalCount = baseCount + myVisits;
            
            document.getElementById('country-flag').innerHTML = `<img src="${flagUrl}" alt="${countryCode}" style="height: 16px; border-radius: 2px;">`;
            document.getElementById('country-count').textContent = totalCount.toLocaleString();
            document.getElementById('country-counter').style.display = 'flex';
        })
        .catch(err => console.log('Counter fetch error:', err));
});
