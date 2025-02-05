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
            speed: 0.6
        },
        exploreButton: {
            clickScale: 0.9,
            animationDuration: 250,
            scrollDuration: 1000,
            hoverGlowColor: 'rgba(255, 255, 0, 0.8)',
            glowDuration: 200,
            // New scroll configuration
            scrollConfig: {
                baseMultiplier: 1.1,    // Base multiplier for viewport height
                extraPixels: 10        // Additional pixels to add
            }
        },
        moveElement: {
            rotationAngle: -10,     // 逆时针旋转10度
            isRotated: false        // 跟踪旋转状态
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

    // Function to toggle move element rotation
    function toggleMoveRotation() {
        config.moveElement.isRotated = !config.moveElement.isRotated;
        
        // Apply rotation to moveElement
        moveElement.style.transition = 'transform 0.6s ease'; // Apply a smooth transition for the rotation
        moveElement.style.transform = config.moveElement.isRotated
            ? `translateX(var(--move-translateX)) rotate(${config.moveElement.rotationAngle}deg)`
            : 'translateX(var(--move-translateX))';
    }

    exploreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Disable scrolling
        document.body.classList.add('scroll-lock');

        try {
            // Button click animation (first)
            exploreBtn.style.transform = `scale(${config.exploreButton.clickScale})`;

            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Wait for button scale animation to complete before rotating the move element
            exploreBtn.style.transform = ''; // Reset button scale

            // Trigger move element rotation after button scale animation
            toggleMoveRotation();

            // Wait for rotation animation to complete before starting scroll
            await new Promise(resolve => setTimeout(resolve, 800)); // Wait for 600ms (same as move rotation duration)

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
