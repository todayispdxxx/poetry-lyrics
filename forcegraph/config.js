const CONFIG = { 
    // 使用窗口尺寸的80%，并保持最小和最大限制
    width: 800,
    height: 600,
    
    
    // 添加容器配置
    svg: {
        width: 1500,      // 主容器宽度
        height: 3500,     // 主容器高度
        position: {
            left: 300,     // 主容器左边距
            top: 0       // 主容器上边距
        },
    },
    
    colors: {
        singer: '#ff6b6b',
        poetry: '#4ecdc4',
        highlight: '#ffd93d'
    },
    radius: {
        singer: {
            min: 10,             
            max: 35              
        },
        poetry: {
            min: 10,
            max: 40
        }
    },
    force: {
        nodeStrength: -300,
        linkStrength: 0.3,
        distance: 180,
        charge: -100
    },
    zoom: {
        min: 0.1,
        max: 10
    },
    // 添加初始位置偏移配置
    initialTransform: {
        x: window.innerWidth * 0.1,  // 左边留10%空间
        y: window.innerHeight * 0.1,  // 上边留10%空间
        scale: 0.8                    // 初始缩放比例
    }
}

// 初始化SVG的辅助函数
function initializeSVG(containerId) {
    const svg = d3.select(containerId)
        .append('svg')
        .attr('width', window.innerWidth)  // 使用整个窗口宽度
        .attr('height', window.innerHeight) // 使用整个窗口高度
        .style('position', 'absolute')
        .style('left', '0')
        .style('top', '0');

    // 创建一个包含所有元素的g元素
    const g = svg.append('g')
        .attr('transform', `translate(${CONFIG.initialTransform.x}, ${CONFIG.initialTransform.y}) scale(${CONFIG.initialTransform.scale})`);
        
    return { svg, g };
}

// 处理窗口大小改变
window.addEventListener('resize', () => {
    const svg = d3.select('svg')
        .attr('width', window.innerWidth)
        .attr('height', window.innerHeight);
        
    // 更新中心点位置
    const g = svg.select('g')
        .attr('transform', `translate(${CONFIG.initialTransform.x}, ${CONFIG.initialTransform.y}) scale(${CONFIG.initialTransform.scale})`);
});