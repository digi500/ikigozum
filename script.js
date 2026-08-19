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

    // Real Country-based Visitor Counter using Vercel KV
    const shouldIncrement = !sessionStorage.getItem('counted_real_db');
    if (shouldIncrement) {
        sessionStorage.setItem('counted_real_db', 'true');
    }

    // Try to get accurate location from ipapi, fallback to Vercel headers if it fails
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => data.country_code)
        .catch(() => '') // ignore error, pass empty
        .then(countryCode => {
            const query = new URLSearchParams({ increment: shouldIncrement });
            if (countryCode) query.append('country', countryCode);
            
            return fetch(`/api/counter?${query.toString()}`);
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                console.log('Counter API error:', data.error);
                return;
            }
            
            const countriesData = data.countries || {};
            
            // Convert to array and sort by count descending
            let sortedCountries = Object.entries(countriesData)
                .sort((a, b) => b[1] - a[1]);
                
            // Always ensure current country is displayed, even if count is low
            const currentCountry = data.currentCountry;
            const currentIndex = sortedCountries.findIndex(c => c[0] === currentCountry);
            
            // If the user's country is not in the top 4, ensure it is injected into the visible list
            if (currentIndex > 4) {
                const myCountryData = sortedCountries.splice(currentIndex, 1)[0];
                sortedCountries.splice(4, 0, myCountryData);
            }
            
            // Show top 5 countries
            sortedCountries = sortedCountries.slice(0, 5);
            
            const counterContainer = document.getElementById('country-counter');
            counterContainer.innerHTML = '';
            
            sortedCountries.forEach(([code, count]) => {
                const flagUrl = `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'country-item';
                itemDiv.innerHTML = `
                    <img src="${flagUrl}" alt="${code}" title="${code}">
                    <span class="count-number">${count.toLocaleString()}</span>
                `;
                counterContainer.appendChild(itemDiv);
            });
            
            if (sortedCountries.length > 0) {
                counterContainer.style.display = 'flex';
            }
        })
        .catch(err => console.log('Real Counter fetch error:', err));
});
