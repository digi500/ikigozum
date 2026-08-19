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
            const currentCountry = data.country_code;
            if (!currentCountry) return;
            
            // Base list of countries to show
            let displayCountries = ['TR', 'US', 'DE', 'GB'];
            
            // If visitor's country isn't in the list, add it to the front
            if (!displayCountries.includes(currentCountry)) {
                displayCountries.unshift(currentCountry);
                if (displayCountries.length > 5) displayCountries.pop();
            }
            
            const counterContainer = document.getElementById('country-counter');
            counterContainer.innerHTML = '';
            
            displayCountries.forEach(code => {
                const isCurrent = (code === currentCountry);
                const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
                
                // Deterministic base count
                let baseCount = (code.charCodeAt(0) * 173) + (code.charCodeAt(1) * 31);
                if (code === 'TR') baseCount += 24000;
                else if (code === 'US') baseCount += 8500;
                else if (code === 'DE') baseCount += 4200;
                else if (code === 'GB') baseCount += 3100;
                else baseCount += 1500;
                
                let totalCount = baseCount;
                if (isCurrent) {
                    let myVisits = parseInt(localStorage.getItem('visits_' + code) || '0');
                    // Only increment once per session to simulate unique visitors
                    if (!sessionStorage.getItem('counted_' + code)) {
                        myVisits++;
                        localStorage.setItem('visits_' + code, myVisits);
                        sessionStorage.setItem('counted_' + code, 'true');
                    }
                    totalCount += myVisits;
                }
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'country-item';
                itemDiv.innerHTML = `
                    <img src="${flagUrl}" alt="${code}" title="${code}">
                    <span class="count-number">${totalCount.toLocaleString()}</span>
                `;
                counterContainer.appendChild(itemDiv);
            });
            
            counterContainer.style.display = 'flex';
        })
        .catch(err => console.log('Counter fetch error:', err));
});
