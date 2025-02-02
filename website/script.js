document.addEventListener('DOMContentLoaded', () => {
    // 获取元素并进行检查
    const disk1 = document.getElementById('disk1');
    const exploreBtn = document.getElementById('explore');
    const moveElement = document.getElementById('move');
    
    if (!disk1 || !exploreBtn || !moveElement) {
        console.error('Required elements not found:', { 
            disk1: !!disk1, 
            exploreBtn: !!exploreBtn,
            moveElement: !!moveElement 
        });
        return;
    }

    // 动画相关配置
    const config = {
        diskRotation: {
            speed: 1,
            current: 0
        },
        exploreButton: {
            hoverScale: 1,          // 取消悬停缩放
            clickScaleDown: 0.9,    // 点击缩小比例
            animationDuration: 400,  // 点击动画总时长
            glowColor: 'rgba(255, 255, 0, 0.8)'
        },
        moveElement: {
            rotationAngle: -10,     // 逆时针旋转30度（使用负值）
            isRotated: false        // 跟踪旋转状态
        }
    };

    // 磁盘旋转动画
    function animateDisk() {
        config.diskRotation.current += config.diskRotation.speed;
        disk1.style.transform = `rotate(${config.diskRotation.current % 360}deg)`;
        requestAnimationFrame(animateDisk);
    }

    class ExploreButtonAnimator {
        constructor(element, config) {
            this.element = element;
            this.config = config;
            this.isAnimating = false;
            this.originalTransform = '';
            this.setupEventListeners();
        }

        setupEventListeners() {
            this.element.style.transformOrigin = 'center center';
            this.element.style.transition = 'all 0.3s ease';
            
            this.element.addEventListener('mouseover', () => this.handleHover(true));
            this.element.addEventListener('mouseout', () => this.handleHover(false));
            this.element.addEventListener('click', () => this.handleClick());
        }

        handleHover(isHover) {
            if (this.isAnimating) return;
            
            this.element.style.filter = isHover 
                ? `brightness(1.2) drop-shadow(0 0 10px ${this.config.glowColor})`
                : 'brightness(1) drop-shadow(0 0 0 transparent)';
        }

        async handleClick() {
            if (this.isAnimating) return;
            this.isAnimating = true;
            
            try {
                await this.animateClick();
                // 触发 move 元素的旋转
                this.toggleMoveRotation();
            } finally {
                this.isAnimating = false;
            }
        }

        toggleMoveRotation() {
            // 切换旋转状态
            config.moveElement.isRotated = !config.moveElement.isRotated;
            
            // 应用旋转
            moveElement.style.transform = config.moveElement.isRotated
                ? `translateX(var(--move-translateX)) rotate(${config.moveElement.rotationAngle}deg)`
                : 'translateX(var(--move-translateX))';
        }

        animateClick() {
            return new Promise(resolve => {
                const duration = this.config.animationDuration;
                const targetScale = this.config.clickScaleDown;
                
                // 保存当前的 transform 值
                this.originalTransform = window.getComputedStyle(this.element).transform;
                const currentMatrix = new DOMMatrix(this.originalTransform);
                
                // 设置精确的过渡时间
                this.element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                
                // 第一阶段：在保持当前位置的基础上应用缩放
                const scaleMatrix = new DOMMatrix().scale(targetScale, targetScale);
                const combinedMatrix = currentMatrix.multiply(scaleMatrix);
                this.element.style.transform = combinedMatrix.toString();
                
                // 监听过渡结束事件
                const completeHandler = () => {
                    this.element.removeEventListener('transitionend', completeHandler);
                    
                    // 第二阶段：恢复原始变换
                    const originalMatrix = new DOMMatrix(this.originalTransform);
                    this.element.style.transform = originalMatrix.toString();
                    
                    // 恢复原始过渡设置并解析 Promise
                    setTimeout(() => {
                        this.element.style.transition = 'all 0.3s ease';
                        resolve();
                    }, duration);
                };
                
                this.element.addEventListener('transitionend', completeHandler);
            });
        }
    }

    // 启动动画
    animateDisk();
    new ExploreButtonAnimator(exploreBtn, config.exploreButton);
});