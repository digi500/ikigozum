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

    // Real Country-based Visitor Counter using Supabase
    const supabaseUrl = 'https://cqideitoffdmzvktehnf.supabase.co';
    const supabaseKey = 'sb_publishable_hDh6SzEh1UBwl88AuGSeyg_-X1nES0B';
    // Initialize Supabase client (from CDN)
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    const shouldIncrement = !sessionStorage.getItem('counted_real_db');
    if (shouldIncrement) {
        sessionStorage.setItem('counted_real_db', 'true');
    }

    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => data.country_code || 'TR')
        .catch(() => 'TR')
        .then(async (countryCode) => {
            countryCode = countryCode.toUpperCase().substring(0, 2);

            try {
                if (shouldIncrement) {
                    // Call the RPC function to increment securely
                    await supabaseClient.rpc('increment_visitor', { p_country_code: countryCode });
                }

                // Fetch all global counts
                const { data, error } = await supabaseClient
                    .from('visitor_counts')
                    .select('*')
                    .order('count', { ascending: false });

                if (error) {
                    console.error('Supabase query error:', error);
                    return;
                }
                
                let sortedCountries = data || [];
                
                // Ensure current country is displayed even if count is low
                const currentIndex = sortedCountries.findIndex(c => c.country_code === countryCode);
                if (currentIndex > 4) {
                    const myCountryData = sortedCountries.splice(currentIndex, 1)[0];
                    sortedCountries.splice(4, 0, myCountryData);
                } else if (currentIndex === -1 && shouldIncrement) {
                    // Fallback in case of replication delay
                    sortedCountries.push({ country_code: countryCode, count: 1 });
                }
                
                // Show top 5 countries
                sortedCountries = sortedCountries.slice(0, 5);
                
                const counterContainer = document.getElementById('country-counter');
                counterContainer.innerHTML = '';
                
                sortedCountries.forEach(row => {
                    const code = row.country_code;
                    const count = row.count;
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
            } catch (err) {
                console.log('Real Counter fetch error:', err);
            }
        });
});
