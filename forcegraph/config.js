const CONFIG = {
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
            max: 50              // 增大最大半径
        },
        poetry: {
            min: 10,
            max: 65
        }
    },
    force: {
        nodeStrength: -3000,
        linkStrength: 0.3,
        distance: 250,
        charge: -1000
    },
    zoom: {
        min: 0.2,
        max: 10
    }
};
