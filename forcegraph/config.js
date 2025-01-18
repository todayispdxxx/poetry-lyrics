const CONFIG = {
    width: window.innerWidth,
    height: window.innerHeight,
    colors: {
        singer: '#ff6b6b',
        poetry: '#4ecdc4'
    },
    radius: {
        singer: {
            min: 8,      // 歌手节点最小半径
            max: 40      // 歌手节点最大半径
        },
        poetry: {
            min: 6,      // 诗词节点最小半径
            max: 35      // 诗词节点最大半径
        }
    },
    force: {
        nodeStrength: -2000,
        linkStrength: 0.3,
        distance: 200,
        charge: -800
    },
    zoom: {
        min: 0.2,
        max: 8
    }
};

window.addEventListener('resize', () => {
    CONFIG.width = window.innerWidth;
    CONFIG.height = window.innerHeight;
    if (typeof initializeGraph === 'function') {
        initializeGraph();
    }
});