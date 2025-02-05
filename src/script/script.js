document.addEventListener('DOMContentLoaded', () => {
    // Create and insert CSS styles
    const style = document.createElement('style');
    style.textContent = `
        #explore {
            transition: filter 0.3s ease, transform 0.3s ease;
            will-change: transform, filter;
        }
        #explore:hover {
            filter: brightness(1.2) drop-shadow(0 0 15px rgba(255, 255, 0, 0.8));
        }
        .scroll-lock {
            overflow: hidden;
            overscroll-behavior: none;
        }
    `;
    document.head.appendChild(style);

    // Get elements and perform checks
    const disk1 = document.getElementById('disk1');
    const exploreBtn = document.getElementById('explore');
    const moveElement = document.getElementById('move');

    if (!disk1 || !exploreBtn || !moveElement) {
        console.error('Required elements not found');
        return;
    }

    // Animation configuration
    const config = {
        diskRotation: {
            speed: 1
        },
        exploreButton: {
            clickScale: 0.9,
            animationDuration: 400,
            scrollDuration: 800,
            hoverGlowColor: 'rgba(255, 255, 0, 0.8)',
            glowDuration: 300,
            // New scroll configuration
            scrollConfig: {
                baseMultiplier: 1.1,    // Base multiplier for viewport height
                extraPixels: 0        // Additional pixels to add
            }
        }
    };

    // Disk rotation animation
    function animateDisk() {
        disk1.style.transform = `rotate(${(Date.now() * config.diskRotation.speed / 30) % 360}deg)`;
        requestAnimationFrame(animateDisk);
    }

    // Enhanced smooth scroll function
    function smoothScrollTo(target) {
        return new Promise((resolve) => {
            const start = window.pageYOffset;
            const distance = target - start;
            const startTime = Date.now();

            function scrollStep() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / config.exploreButton.scrollDuration, 1);
                const ease = easeInOutCubic(progress);
                window.scrollTo(0, start + distance * ease);

                if (progress < 1) {
                    requestAnimationFrame(scrollStep);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(scrollStep);
        });
    }

    // Cubic easing function for smoother scrolling
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // Calculate next scroll position with enhanced control
    function calculateNextScrollPosition() {
        const viewportHeight = window.innerHeight;
        const currentScroll = window.pageYOffset;
        const { baseMultiplier, extraPixels } = config.exploreButton.scrollConfig;
        
        // Calculate base scroll distance using viewport height and multiplier
        const baseScrollDistance = viewportHeight * baseMultiplier;
        
        // Add extra pixels for fine-tuning
        const totalScrollDistance = baseScrollDistance + extraPixels;
        
        return currentScroll + totalScrollDistance;
    }

    exploreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Disable scrolling
        document.body.classList.add('scroll-lock');

        try {
            // Button click animation
            exploreBtn.style.transform = `scale(${config.exploreButton.clickScale})`;
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, config.exploreButton.animationDuration));
            exploreBtn.style.transform = '';

            // Calculate and perform scroll
            const targetScroll = calculateNextScrollPosition();
            await smoothScrollTo(targetScroll);
        } finally {
            // Re-enable scrolling
            document.body.classList.remove('scroll-lock');
        }
    });

    // Start disk animation
    animateDisk();
});