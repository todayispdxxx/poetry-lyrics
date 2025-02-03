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