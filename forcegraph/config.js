const CONFIG = {
    // 容器配置
    container: {
        width: 1200,          // 固定容器宽度
        height: 800,          // 固定容器高度
        padding: 20,          // 容器内边距
        style: {
            background: '#f8f9fa',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            margin: '40px auto',  // 上下间距40px，左右自动居中
            position: 'relative'
        }
    },
    
    // 原有配置
    width: window.innerWidth,     // 使用整个窗口宽度
    height: window.innerHeight,   // 使用整个窗口高度
    colors: {
        singer: '#ff6b6b',
        poetry: '#4ecdc4',
        highlight: '#ffd93d'
    },
    radius: {
        singer: {
            min: 10,             // 增大最小半径
            max: 35              // 增大最大半径
        },
        poetry: {
            min: 10,
            max: 40
        }
    },
    force: {
        nodeStrength: -300,
        linkStrength: 0.3,
        distance: 200,
        charge: -100
    },
    zoom: {
        min: 0.1,
        max: 10
    }
};