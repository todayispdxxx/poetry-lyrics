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
        minRadius: 245,
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
    // viz1保持不变
    {
        id: 'viz1',
        image: 'src/image/disk-dlj.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment1.json',
        position: { x: -150, y: 200 }
    },
    // 修改viz2配置，从底部开始顺时针排列
    {
        id: 'viz2',
        image: 'src/image/disk-ppx.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment2.json',
        position: { x: 450, y: 400 },
        textDirection: 'clockwise',        // 改为顺时针
        startAngle: Math.PI/2,             // 从底部开始(π/2)
        flipText: false,                   // 取消文字翻转
        // 文字配置保持不变
        textConfig: {
            minRadius: 265,
            layerSpacing: 18, 
            charSpacing: 14    
        }
    },
    // viz3保持不变
    {
        id: 'viz3',
        image: 'src/image/disk-fhcq.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment3.json',
        position: { x: -150, y: 750 }
    },
    // 修改viz4配置，从底部开始顺时针排列
    {
        id: 'viz4',
        image: 'src/image/disk-zqc.png',
        dataUrl: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/comment4.json',
        position: { x: 450, y: 950 },
        textDirection: 'clockwise',        // 改为顺时针
        startAngle: Math.PI/2,             // 从底部开始(π/2)
        flipText: false,                   // 取消文字翻转
        // 文字配置保持不变
        textConfig: {
            minRadius: 255,
            layerSpacing: 18,
            charSpacing: 14
        }
    },
    // viz5保持不变
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
        this.rotatingGroup = null; // 添加属性存储旋转组引用
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

    // 修改loadImage方法，将矩形的图层提高到唱片之上
    loadImage() {
        const imgContainer = this.svg.append("g")
            .classed("image-container", true);
        
        // 检查是否是唱片图像
        const isDiskImage = this.vizConfig.image && this.vizConfig.image.includes('disk-');
        
        // 如果是唱片图像，则添加旋转功能和装饰框
        if (isDiskImage) {
            // 创建固定位置的容器组
            const diskContainer = imgContainer.append("g")
                .attr("transform", `translate(${this.config.center.x}, ${this.config.center.y})`);

            // 先创建旋转组和唱片图片
            this.rotatingGroup = diskContainer.append("g") // 保存为实例属性
                .classed("rotating-disk", true);
            
            // 添加CSS旋转动画
            const diskId = this.vizConfig.id;
            const rotationDuration = 36; // 秒/圈
            const direction = ['viz2', 'viz4'].includes(diskId) ? 'reverse' : 'normal';
            
            if (!document.getElementById(`disk-style-${diskId}`)) {
                const styleEl = document.createElement('style');
                styleEl.id = `disk-style-${diskId}`;
                styleEl.textContent = `
                    @keyframes rotate-disk-${diskId} {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    #${diskId} .rotating-disk {
                        animation: rotate-disk-${diskId} ${rotationDuration}s linear infinite;
                        animation-direction: ${direction};
                        transform-origin: center center;
                        transform-box: fill-box;
                        will-change: transform;
                        backface-visibility: hidden;
                        perspective: 1000;
                        transform: translateZ(0);
                    }
                `;
                document.head.appendChild(styleEl);
            }
            
            // 添加唱片图像 - 居中定位
            this.rotatingGroup.append("image")
                .attr("xlink:href", this.vizConfig.image)
                .attr("width", this.config.imageSize)
                .attr("height", this.config.imageSize)
                .attr("x", -this.config.imageSize / 2)
                .attr("y", -this.config.imageSize / 2)
                .style("image-rendering", "high-quality")
                .style("pointer-events", "none");

            // 修改矩形样式和尺寸，适当缩小矩形
            const rectWidth = this.config.imageSize * 0.38;   // 从0.40减小到0.38
            const rectHeight = this.config.imageSize * 0.12;  // 从0.13减小到0.12
            const arcRadius = rectHeight / 2;                // 保持圆弧半径

            // 确定矩形的水平位置偏移
            let horizontalOffset;
            if(['viz1', 'viz3', 'viz5'].includes(this.vizConfig.id)) {
                horizontalOffset = this.config.imageSize * 0.28; // 从0.29减小到0.28
            } else {
                horizontalOffset = -this.config.imageSize * 0.28;
            }

            // 创建矩形容器，注意设置了水平偏移
            const rectContainer = diskContainer.append("g")
                .attr("class", `label-container label-${this.vizConfig.id}`)
                .attr("transform", `translate(${horizontalOffset}, 0)`);

            // 创建白色黑框矩形
            rectContainer.append("rect")
                .attr("id", `label-rect-${this.vizConfig.id}`)
                .attr("x", -rectWidth / 2)
                .attr("y", -rectHeight / 2)
                .attr("width", rectWidth)
                .attr("height", rectHeight)
                .attr("rx", arcRadius)
                .attr("ry", arcRadius)
                .style("fill", "white")
                .style("stroke", "black")
                .style("stroke-width", "1px");

            // 确定图标和文本的排列方向
            const isRightSide = ['viz1', 'viz3', 'viz5'].includes(this.vizConfig.id);

            // 调整图标位置 - 向外移动（viz1,3,5向右，viz2,4向左）
            const iconSize = rectHeight * 0.65;  // 从0.70减小到0.65
            const iconOffset = isRightSide ? 
                rectWidth * 0.35 :  // 保持比例不变
                rectWidth * 0.35;   // 保持比例不变

            // 调整文本偏移量 - viz2,4文字向左移动
            const textOffset = isRightSide ? 
                rectWidth * 0.10 :  // viz1,3,5文字偏移量保持不变
                rectWidth * 0.15;   // viz2,4文字向左移动（减小偏移量）

            // 添加矢量图标位置，向外移动
            rectContainer.append("image")
                .attr("xlink:href", "src/image/Vector.png")
                .attr("width", iconSize)
                .attr("height", iconSize)
                .attr("x", isRightSide ? 
                    iconOffset - iconSize/2 :  // viz1,3,5图标向右
                    -iconOffset - iconSize/2)  // viz2,4图标向左
                .attr("y", -iconSize / 2)
                .style("pointer-events", "none");

            // 设置文本对齐方式
            const textAnchor = isRightSide ? "start" : "end"; // viz1,3,5靠左对齐；viz2,4靠右对齐

            // 计算文本位置
            const textPosition = isRightSide ? 
                -rectWidth/2 + textOffset : // 左侧对齐时靠左
                rectWidth/2 - textOffset;   // 右侧对齐时靠右

            // 创建文本容器组
            const textGroup = rectContainer.append("g")
                .attr("class", "text-group")
                .attr("transform", `translate(${textPosition}, 0)`);

            // 保存第二行文字的y坐标，调整书名号的位置
            const secondLineY = rectHeight * 0.25;
            const bookmarkY = secondLineY + 4; // 书名号向下移动更多(从2改为4)

            // 设置不同的文本位置偏移，根据不同唱片ID调整
            let text1XOffset = 0;  // 第一行文字的X偏移
            let text2XOffset = 0;  // 第二行文字的X偏移

            // 设置viz1,3,5的第二行文字向右偏移更多，viz2,4的第一行文字向右移动
            if (isRightSide) {
                text2XOffset = 6;  // viz1,3,5第二行文字向右移动更多（从4增加到6）
            } else {
                text1XOffset = 8;  // viz2,4第一行文字保持不变
            }

            // 两行文本的垂直间距保持不变
            const textContainer1 = textGroup.append("text")
                .attr("id", `label-text1-${this.vizConfig.id}`)
                .attr("text-anchor", textAnchor)
                .attr("dominant-baseline", "middle")
                .attr("x", text1XOffset) // 应用第一行文字的水平偏移
                .attr("y", -rectHeight * 0.15)
                .style("font-size", "19px") // 从21px减小到19px
                .style("font-weight", "normal")
                .style("font-family", "S12, Arial, sans-serif")
                .style("pointer-events", "none");

            const textContainer2 = textGroup.append("text")
                .attr("id", `label-text2-${this.vizConfig.id}`)
                .attr("text-anchor", textAnchor)
                .attr("dominant-baseline", "middle")
                .attr("x", text2XOffset) // 应用第二行文字的水平偏移
                .attr("y", secondLineY) // 使用变量存储y坐标
                .style("font-size", "14px") // 从16px减小到14px
                .style("font-style", "normal")
                .style("font-family", "S7, serif")
                .style("pointer-events", "none");

            // 根据不同唱片ID添加不同的内容，确保纯文字对齐（不包括书名号）
            switch(this.vizConfig.id) {
                case 'viz1':
                    textContainer1.text("邓丽君");
                    textContainer2.text("但愿人长久"); // 移除书名号，确保文字对齐
                    break;
                case 'viz2':
                    textContainer1.text("奇然、沈谧仁");
                    textContainer2.text("琵琶行"); // 移除书名号，确保文字对齐
                    break;
                case 'viz3':
                    textContainer1.text("凤凰传奇");
                    textContainer2.text("中国喜事"); // 移除书名号，确保文字对齐
                    break;
                case 'viz4':
                    textContainer1.text("王菲");
                    textContainer2.text("致青春"); // 移除书名号，确保文字对齐
                    break;
                case 'viz5':
                    textContainer1.text("毛阿明");
                    textContainer2.text("相思"); // 移除书名号，确保文字对齐
                    break;
                default:
                    textContainer1.text("");
                    textContainer2.text("");
            }

            // 添加书名号的装饰元素，向左移动
            if (isRightSide) {
                // viz1,3,5左对齐，书名号在左边，减小向右偏移量
                const bookmarkOffset = 5; // 书名号向右偏移量（从8减小到5）
                
                textGroup.append("text")
                    .attr("text-anchor", "end")
                    .attr("x", -2 + bookmarkOffset) // 减小向右偏移，使其向左移动
                    .attr("y", bookmarkY)
                    .text("《")
                    .style("font-size", "14px"); // 从16px减小到14px
                    
                textGroup.append("text")
                    .attr("text-anchor", "start")
                    .attr("x", textContainer2.node().getComputedTextLength() + 2 + bookmarkOffset) // 减小向右偏移
                    .attr("y", bookmarkY)
                    .text("》")
                    .style("font-size", "14px"); // 从16px减小到14px
            } else {
                // viz2,4右对齐，书名号向左移动更多
                const textWidth = textContainer2.node().getComputedTextLength();
                
                textGroup.append("text")
                    .attr("text-anchor", "end")
                    .attr("x", -textWidth - 2) // 从-2改为-8，向左移动更多
                    .attr("y", bookmarkY)
                    .text("《")
                    .style("font-size", "14px");
                    
                textGroup.append("text")
                    .attr("text-anchor", "start")
                    .attr("x", 0) // 从2改为-2，向左移动更多
                    .attr("y", bookmarkY)
                    .text("》")
                    .style("font-size", "14px");
            }
        } else {
            // 非唱片图像代码保持不变
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
    }

    loadData() {
        d3.json(this.vizConfig.dataUrl)
            .then(data => this.processData(data))
            .catch(error => this.showError("数据加载失败: " + error.message));
    }

    // 修改processData方法，不反转层级值，确保外圈是大层级值
    processData(data) {
        if (!data || !Array.isArray(data)) {
            throw new Error("数据格式不符合要求");
        }
    
        // 将评论按顺序映射到层级，保持原始顺序
        const allComments = data.map((comment, i) => ({
            sentiment: comment.sentiment,
            content: comment.comment,
            layer: i  // 不再反转层级值，这样外圈是大层级值，内圈是小层级值
        }));
    
        // 按照层级排序，大层级（外圈）先渲染
        allComments.sort((a, b) => b.layer - a.layer);
        this.renderComments(allComments);
    }

    // 修改renderComments方法的速度计算
    renderComments(comments) {
        // 预先计算旋转参数
        const rotationParams = comments.map((comment, index) => {
            const layer = comment.layer;
            const isClockwise = layer % 2 === 0;
            
            // 修改速度计算公式：大幅降低旋转速度
            const baseDuration = 220; // 从250增加到480
            const speedFactor = Math.max(0.5, 1.0 + layer * 0.08); // 减小层级间的差异
            const rotationDuration = Math.round(baseDuration * (1 / speedFactor));
            
            return {
                layer,
                isClockwise,
                rotationDuration,
                delay: layer * 0.1 // 进一步减少延迟
            };
        });
        
        this.addBatchRotationStyles(this.vizConfig.id, rotationParams);
        
        // 减少setTimeout延迟时间
        comments.forEach((comment, index) => {
            setTimeout(() => {
                // 创建旋转组，但不再使用全局中心点
                // 而是使用相对定位，与碟片在同一位置
                const textRotatingGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                textRotatingGroup.classList.add("text-rotating-layer");
                textRotatingGroup.setAttribute("data-layer", comment.layer);
                
                // 关键修改：不再设置transform属性
                // 让旋转组直接添加到SVG，与碟片保持相同位置关系
                
                // 在旋转组中创建文字
                this.createTextArc(comment, d3.select(textRotatingGroup), false);
                
                // 添加到SVG中
                this.svg.node().appendChild(textRotatingGroup);
            }, index * 50); // 从100减少到50
        });
    }

    // 优化批量添加旋转样式方法
    addBatchRotationStyles(diskId, rotationParams) {
        // 创建单个样式元素，包含所有层级的动画
        const styleId = `rotate-text-${diskId}-styles`;
        if (document.getElementById(styleId)) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        
        let styleContent = "";
        // 创建基础动画，使用硬件加速优化
        styleContent += `
            @keyframes rotate-text-${diskId}-clockwise {
                from { transform: rotate(0deg) translateZ(0); }
                to { transform: rotate(360deg) translateZ(0); }
            }
            
            @keyframes rotate-text-${diskId}-counter-clockwise {
                from { transform: rotate(0deg) translateZ(0); }
                to { transform: rotate(-360deg) translateZ(0); }
            }
            
            /* 全局优化 */
            #${diskId} .text-rotating-layer {
                transform-style: preserve-3d;
                contain: style layout;
                pointer-events: none;
            }
            
            #${diskId} .char {
                text-rendering: geometricPrecision;
                shape-rendering: geometricPrecision;
            }
        `;
        
        // 为每个层级添加样式
        rotationParams.forEach((param) => {
            const animName = param.isClockwise ? 
                `rotate-text-${diskId}-clockwise` : `rotate-text-${diskId}-counter-clockwise`;
            styleContent += `
                #${diskId} .text-rotating-layer[data-layer="${param.layer}"] {
                    animation: ${animName} ${param.rotationDuration}s linear infinite ${param.delay}s;
                    animation-direction: ${param.isClockwise ? 'normal' : 'reverse'};
                    transform-origin: ${this.config.center.x}px ${this.config.center.y}px; /* 明确设置旋转原点 */
                    will-change: transform;
                    backface-visibility: hidden;
                    perspective: 1000;
                    transform: translateZ(0) scale(1.0); /* 改进的变换属性 */
                    filter: blur(0);
                    -webkit-font-smoothing: subpixel-antialiased;
                    contain: layout style paint;
                    transition: transform 0.1ms linear; /* 添加过渡效果提高流畅度 */
                }
            `;
        });
        
        styleEl.textContent = styleContent;
        document.head.appendChild(styleEl);
    }

    // 修改createTextArc方法，确保文字坐标计算正确
    createTextArc(comment, group, isInRotatingGroup) {
        const characters = comment.content.trim().split('');
        // 合并文字配置
        const textConfig = {
            ...this.config.text,
            ...(this.vizConfig.textConfig || {})
        };
        
        // 计算半径：现在layer值越大，半径越大
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
                
                // 关键修改：特殊字符位置调整
                let adjustedCharIndex = charIndex;
                if (specialChars.includes(d)) {
                    // 修改viz2和viz4的特殊字符位置偏移（顺时针方向）
                    if (['viz2', 'viz4'].includes(this.vizConfig.id) && direction === 'clockwise') {
                        // 书名号和括号向左偏移
                        adjustedCharIndex = charIndex ; // 从+1改为-2，大幅度向左移动
                    } else {
                        // 其他情况保持原有逻辑
                        adjustedCharIndex = direction === 'counter-clockwise' ? 
                            charIndex - 1 : charIndex + 1;
                    }
                }
                
                const baseAngle = this.vizConfig.startAngle || textConfig.startAngle;
                const adjustedAngle = baseAngle + angleStep * adjustedCharIndex;
                
                // 计算坐标，无论是否在旋转组中，都正确计算
                let x, y;
                if (isInRotatingGroup) {
                    // 在旋转组中时，坐标是相对于旋转中心的
                    x = radius * Math.cos(adjustedAngle);
                    y = radius * Math.sin(adjustedAngle);
                } else {
                    // 不在旋转组中时，需要加上中心点坐标
                    x = this.config.center.x + radius * Math.cos(adjustedAngle);
                    y = this.config.center.y + radius * Math.sin(adjustedAngle);
                }
                
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
            .style("opacity", 1) // 直接设置为可见，不使用过渡效果
            .style("text-rendering", "optimizeSpeed");
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