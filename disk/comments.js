// 修改基础配置
const baseConfig = {
    imageSize: 500,
    center: { 
        x: 400,  // 中心点位置调整为新宽度一半
        y: 300,  // 中心点位置调整
        textOffsetX: 10,
        textOffsetY: 0
    },
    colors: {
        positive: '#FF5E5E',
        negative: '#4759D5'
    },
    text: {
        baseFontSize: 12,
        layerSpacing: 18,
        minRadius: 243,
        arcAngle: 300,
        charSpacing: 14,
        globalRotation: 0,
        startAngle: -Math.PI/2 - 0.4,
        // 添加文字方向配置
        direction: 'normal'
    }
};

// 修改visualizations配置
const visualizations = [
    {
        id: 'viz1',
        image: 'src/image/disk-dlj.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment1.json',
        position: { x: -150, y: 200 }
    },
    {
        id: 'viz2',
        image: 'src/image/disk-ppx.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment2.json',
        position: { x: 450, y: 400 },
        textDirection: 'counter-clockwise',
        startAngle: -Math.PI/2 + 0.26,  // 修改起始角度
        flipText: true,  // 添加文字翻转参数
        // 添加独立的文字配置
        textConfig: {
            minRadius: 255,  // 增加起始半径
            layerSpacing: 18,  // 调整层间距
            charSpacing: 14    // 调整字符间距
        }
    },
    {
        id: 'viz3',
        image: 'src/image/disk-fhcq.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment3.json',
        position: { x: -150, y: 750 }
    },
    {
        id: 'viz4',
        image: 'src/image/disk-zqc.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment4.json',
        position: { x: 450, y: 950 },
        textDirection: 'counter-clockwise',
        startAngle: -Math.PI/2+0.27,  // 修改起始角度
        flipText: true,  // 添加文字翻转参数
        // 添加独立的文字配置
        textConfig: {
            minRadius: 245,
            layerSpacing: 18,
            charSpacing: 14
        }
    },
    {
        id: 'viz5',
        image: 'src/image/disk-xs.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment5.json',
        position: { x: -150, y: 1300 }
    }
];

// 修改容器样式
const container = d3.select("#visualization")
    .style("position", "relative")
    .style("width", "100vw")  // 使用视口宽度
    .style("height", "3500px")     // 增加容器高度
    .style("overflow-x", "hidden")  // 禁用水平滚动
    .style("overflow-y", "auto")  // 启用垂直滚动
    .style("margin",0);

// 创建单个可视化的类9
class CircularTextVisualization {
    constructor(container, config, vizConfig) {
        this.container = container;
        this.config = { ...baseConfig, ...config };
        this.vizConfig = vizConfig;
        this.init();
    }

    init() {
        // 创建带有定位的容器div
        this.vizContainer = this.container.append("div")
            .attr("id", this.vizConfig.id)
            .style("position", "absolute")
            .style("left", `${this.vizConfig.position.x}px`)
            .style("top", `${this.vizConfig.position.y}px`)
            .style("width", `${this.config.width}px`)
            .style("height", `${this.config.height}px`)
            .style("overflow", "visible");

        // 创建SVG，调整viewBox确保完整显示
        this.svg = this.vizContainer.append("svg")
            .attr("width", this.config.width)
            .attr("height", this.config.height)
            .attr("viewBox", `0 0 ${this.config.width} ${this.config.height}`)
            .style("overflow", "visible");

        this.loadImage();
        this.loadData();
    }

    loadImage() {
        const imgContainer = this.svg.append("g").classed("image-container", true);
        imgContainer.append("image")
            .attr("xlink:href", this.vizConfig.image)
            .attr("width", this.config.imageSize)
            .attr("height", this.config.imageSize)
            .attr("x", this.config.center.x - this.config.imageSize / 2)
            .attr("y", this.config.center.y - this.config.imageSize / 2)
            .on("error", () => {
                imgContainer.append("circle")
                    .attr("cx", this.config.center.x)
                    .attr("cy", this.config.center.y)
                    .attr("r", this.config.imageSize / 2)
                    .style("fill", "#ecf0f1");
            });
    }

    loadData() {
        d3.json(this.vizConfig.dataUrl)
            .then(data => this.processData(data))
            .catch(error => this.showError("数据加载失败: " + error.message));
    }

    processData(data) {
        if (!data || !Array.isArray(data.positive) || !Array.isArray(data.negative)) {
            throw new Error("数据格式不符合要求");
        }

        const allComments = [
            ...data.positive.map((text, i) => ({ 
                sentiment: 'positive', 
                content: text,
                layer: i * 2
            })),
            ...data.negative.map((text, i) => ({ 
                sentiment: 'negative', 
                content: text,
                layer: i * 2 + 1
            }))
        ].sort((a, b) => a.layer - b.layer);

        this.renderComments(allComments);
    }

    renderComments(comments) {
        comments.forEach((comment, index) => {
            setTimeout(() => {
                const group = this.svg.append("g")
                    .classed("comment-layer", true)
                    .attr("data-layer", comment.layer);
                
                this.createTextArc(comment, group);
            }, index * 300);
        });
    }

    createTextArc(comment, group) {
        const characters = comment.content.trim().split('');
        // 合并文字配置
        const textConfig = {
            ...this.config.text,
            ...(this.vizConfig.textConfig || {})
        };
        
        const radius = textConfig.minRadius + comment.layer * textConfig.layerSpacing;
        const direction = this.vizConfig.textDirection || textConfig.direction;
        
        let angleStep = textConfig.charSpacing / radius;
        if (direction === 'counter-clockwise') {
            angleStep = -angleStep;
            characters.reverse();
        }

        group.selectAll("text")
            .data(characters)
            .enter()
            .append("text")
            .classed("char", true)
            .text(d => d)
            .style("fill", this.config.colors[comment.sentiment])
            .style("font-size", textConfig.baseFontSize + "px")
            .attr("transform", (d, i) => {
                const charIndex = direction === 'counter-clockwise' ? characters.length - 1 - i : i;
                const specialChars = ['《', '》', '（', '）', '(', ')'];
                
                // 为特殊字符添加位置偏移
                let adjustedCharIndex = charIndex;
                if (specialChars.includes(d)) {
                    adjustedCharIndex = direction === 'counter-clockwise' ? 
                        charIndex - 1 : charIndex + 1;  // 逆时针方向移动一个位置
                }
                
                const baseAngle = this.vizConfig.startAngle || textConfig.startAngle;
                const adjustedAngle = baseAngle + angleStep * adjustedCharIndex;
                
                const x = this.config.center.x + this.config.center.textOffsetX + 
                         radius * Math.cos(adjustedAngle);
                const y = this.config.center.y + radius * Math.sin(adjustedAngle);
                
                let charRotation = adjustedAngle * 180/Math.PI + 90;
                if (direction === 'counter-clockwise') {
                    charRotation += 180;
                }
                
                // 只翻转非特殊字符
                if (this.vizConfig.flipText && !specialChars.includes(d)) {
                    charRotation += 180;
                }
                
                return `translate(${x},${y}) rotate(${charRotation})`;
            })
            .attr("text-anchor", "start")
            .attr("dy", "0.3em")
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 1);
    }

    showError(message) {
        this.svg.append("text")
            .text(message)
            .attr("x", this.config.center.x)
            .attr("y", this.config.center.y)
            .attr("text-anchor", "middle")
            .style("fill", "red")
            .style("font-size", "16px");
    }
}

// 更新createVisualization函数
function createVisualization(config) {
    const viz = container.append("div")
        .attr("id", config.id)
        .style("position", "absolute")
        .style("left", `${config.position.x}px`)
        .style("top", `${config.position.y}px`)
        .style("width", "400px")
        .style("height", "400px");
    
    new CircularTextVisualization(viz, {}, config);
}

// 添加位置更新函数
function updatePosition(vizId, x, y) {
    d3.select(`#${vizId}`)
        .style("left", `${x}px`)
        .style("top", `${y}px`);
}

// 初始化所有可视化
visualizations.forEach(config => {
    createVisualization(config);
});