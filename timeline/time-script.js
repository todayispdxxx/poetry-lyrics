// 使用IIFE隔离作用域，防止全局变量泄漏
(function() {
    // 创建命名空间
    const TIME_NS = {
        svgId: "timeline-svg",
        dotClass: "timeline-dot", 
        tooltipClass: "timeline-tooltip",
        containerClass: "timeline",
        lineClass: "timeline-tooltip-line",
        highlightClass: "timeline-highlight"
    };
    
    // 创建隔离的CSS
    function createIsolatedStyles() {
        // 检查是否已经添加
        if (document.getElementById('timeline-isolated-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'timeline-isolated-styles';
        styleElement.textContent = `
            /* 将原始样式完全复制，只是更改类名 */
            .${TIME_NS.containerClass} {
                width: 100%;
                height: 800px;
                margin: 50px auto;
                position: relative; /* 添加相对定位 */
            }
            
            .${TIME_NS.dotClass} {
                fill: #8994DC;
                stroke: transparent;
            }
            
            .${TIME_NS.highlightClass} {
                stroke: black;
                stroke-width: 3px;
            }
            
            .${TIME_NS.tooltipClass} {
                position: absolute;
                width: auto;
                background: #FFFFFF;
                border-radius: 11px;
                pointer-events: none;
                opacity: 0; /* 初始透明度为0 */
                /* 移除transition属性，实现立即显示和隐藏 */
                padding: 10px;
                box-sizing: border-box;
            }
            
            .${TIME_NS.tooltipClass} .singer,
            .${TIME_NS.tooltipClass} .song,
            .${TIME_NS.tooltipClass} .year,
            .${TIME_NS.tooltipClass} .comments {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .${TIME_NS.tooltipClass} .singer {
                font-family: "S12";
                font-style: normal;
                font-weight: 400;
                font-size: 25px;
                line-height: 25px;
                letter-spacing: 0.06em;
                color: #000000;
                transform: translateY(1.6px); /* 向下移动1.6px */
            }
            
            .${TIME_NS.tooltipClass} .song {
                font-family: "S7";
                font-style: normal;
                font-weight: 400;
                font-size: 18px;
                line-height: 18px;
                letter-spacing: 0.06em;
                color: #000000;
            }
            
            .${TIME_NS.tooltipClass} .year {
                font-family: "S12";
                font-style: normal;
                font-weight: 400;
                font-size: 27px;
                line-height: 27px;
                letter-spacing: 0.01em;
                color: #E86138;
                margin-top: 11px; /* 增加顶部外边距 */
                transform: translateY(2.25px); /* 向下移动2.25px */
            }
            
            .${TIME_NS.tooltipClass} .comments {
                font-family: "S12";
                font-style: normal;
                font-weight: 400;
                font-size: 18px;
                line-height: 18px;
                letter-spacing: 0.01em;
                color: #484848;
                transform: translateY(1.4px); /* 向下移动1.4px */
            }
            
            .${TIME_NS.tooltipClass} .image {
                position: absolute;
                width: 73px;
                height: 56px;
                left: 12px;
                top: 9px;
                border-radius: 3px;
            }
            
            .${TIME_NS.tooltipClass} .row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end; /* 对齐到行底部 */
            }
            
            .${TIME_NS.tooltipClass} .comment-icon {
                width: 13px;
                height: 13px;
                margin-left: 23px;
                transform: translateY(1.2px); /* 向下1.2px */
            }
            
            .decade-text {
                font-family: "S12";
                font-style: normal;
                font-weight: 400;
                font-size: 20px;
                line-height: 20px;
                letter-spacing: 0.01em;
                color: #000000;
            }
            
            .circle {
                fill: #7C7C7C;
            }
            
            .dashed-line {
                stroke: #7C7C7C;
                stroke-width: 1px;
                stroke-dasharray: 5, 5;
                fill: none;
            }
            
            .${TIME_NS.lineClass} {
                stroke: #555;
                stroke-width: 1.5;
                stroke-opacity: 0;
                pointer-events: none;
                /* 同样移除线条的过渡效果 */
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // 在脚本初始化时创建样式
    createIsolatedStyles();
    
    // 隔离的变量
    let timelineData = [];
    let timelineSvg = null;
    let timelineTooltip = null;
    
    // 修改tooltip创建代码:
    function createTooltip() {
        // 先移除现有的timeline tooltip
        d3.selectAll(`.${TIME_NS.tooltipClass}`).remove();
        
        return d3.select("body").append("div")
            .attr("class", TIME_NS.tooltipClass)
            .style("opacity", 0); // 初始透明度为0，但没有过渡效果
    }
    
    // 定义fetchTimelineData函数
    async function fetchTimelineData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/time-data.json');
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const jsonResponse = await response.json();
            const jsonData = jsonResponse.data || [];
            
            timelineData = jsonData
                .filter(d => d.date) // 确保有日期
                .map(d => ({
                    date: new Date(d.date),
                    comments: parseInt(d.comment) || 0,
                    song: d.actual_song || '',
                    singer: d.actual_singer || ''
                }));
            
            // 使用 Map 去重
            const uniqueData = new Map();
            timelineData.forEach(item => {
                const key = `${item.date.getTime()}-${item.comments}-${item.song}-${item.singer}`;
                if (!uniqueData.has(key)) {
                    uniqueData.set(key, item);
                }
            });
            timelineData = Array.from(uniqueData.values());
            
            // 生成图表
            drawTimelineChart(timelineData);
        } catch (error) {
            console.error('Timeline: 获取或解析数据时出错:', error);
        }
    }
    
    // 修改绘图函数，重命名为drawTimelineChart避免冲突
    function drawTimelineChart(data) {
        // 确保我们使用命名空间中的容器类名
        const container = d3.select(`.${TIME_NS.containerClass}`);
        if (container.empty()) {
            console.error(`Timeline: 找不到.${TIME_NS.containerClass}容器`);
            return;
        }
        
        // 在容器中查找或创建SVG
        let svg = container.select("svg");
        if (svg.empty()) {
            console.log(`Timeline: 在.${TIME_NS.containerClass}容器中创建新的SVG元素`);
            svg = container.append("svg")
                .attr("width", 1000)
                .attr("height", 800);
        }
        
        timelineSvg = svg;
        
        const width = +svg.attr("width"),
              height = +svg.attr("height"),
              margin = { left: 50 };

        // 清空SVG内容
        svg.selectAll("*").remove();
        
        // 相应调整g元素的平移
        const mainG = svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`);

        // 过滤数据，确保年份在1975到2024之间
        const filteredData = data.filter(d => d.date.getFullYear() >= 1975 && d.date.getFullYear() <= 2024);
        
        // 如果没有数据，显示提示信息
        if (filteredData.length === 0) {
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .text("没有可显示的数据");
            return;
        }

        // 修改比例尺设置，扩大x轴范围
        const x = d3.scaleTime()
                    .domain([new Date(1975, 0, 1), new Date(2024, 11, 31)])
                    .range([0, width * 1 - margin.left]); 

        const y = d3.scaleLinear()
                    .domain([0, d3.max(filteredData, d => d.comments)])
                    .range([height, 0]);

        const r = d3.scaleSqrt()
                    .domain([0, d3.max(filteredData, d => d.comments)])
                    .range([3, 30]);

        // 创建/更新tooltip
        if (!timelineTooltip) {
            timelineTooltip = createTooltip();
        }

        // D3 v7中的力布局用法基本相同，保持原始参数
        const simulation = d3.forceSimulation(filteredData)
            .force("x", d3.forceX(d => x(d.date)).strength(7))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force("collide", d3.forceCollide().radius(d => r(d.comments) + 2))
            .stop();

        for (let i = 0; i < 300; ++i) simulation.tick();

        // 使用命名空间中的类名
        mainG.selectAll(`.${TIME_NS.dotClass}`)
           .data(filteredData)
           .join("circle") // D3 v7的方法
           .attr("class", TIME_NS.dotClass)
           .attr("cx", d => d.x)
           .attr("cy", d => d.y)
           .attr("r", d => r(d.comments))
           .on("mouseover", function(event, d) {
                d3.select(this).classed(TIME_NS.highlightClass, true);
                
                // 使用与原始代码完全相同的结构
                timelineTooltip.html(`
                    <div class="image"></div>
                    <div class="row">
                        <div class="singer">${d.singer}</div>
                        <div class="song">《${d.song}》</div>
                    </div>
                    <div class="row bottom-align">
                        <div class="year">${d.date.getFullYear()}</div>
                        <div class="comments">
                            <img src="./timeline/comment.png" onerror="this.src='./comment.png'" alt="评论图标" class="comment-icon">
                            ${d.comments}
                        </div>
                    </div>
                `);
                
                // 先将tooltip放在一个临时位置以获取其尺寸，但不显示
                timelineTooltip
                    .style("left", "0px")
                    .style("top", "0px")
                    .style("visibility", "hidden") // 临时隐藏但保留空间
                    .style("opacity", 0);
                
                // 获取tooltip尺寸
                const tooltipRect = timelineTooltip.node().getBoundingClientRect();
                const tooltipHeight = tooltipRect.height;
                const tooltipWidth = tooltipRect.width;
                
                // 决定tooltip位置 - 优先在节点上方显示
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // 计算节点在视口中的位置
                const nodeRect = this.getBoundingClientRect();
                const nodeViewportX = nodeRect.x + nodeRect.width/2;
                const nodeViewportY = nodeRect.y + nodeRect.height/2;
                
                // 默认在节点上方显示tooltip，但距离更远（原来距离的两倍）
                let isAbove = true;
                let tooltipX = nodeViewportX + window.pageXOffset - tooltipWidth/2;
                
                // 将tooltip放置在距离节点更远的位置（原来距离的2.5倍）
                // 替换掉未定义的circleRadius
                const nodeRadius = r(d.comments); // 使用当前节点的实际半径
                const originalOffset = 15 + nodeRadius;
                const extendedOffset = originalOffset * 2.5; // 2.5倍距离
                
                let tooltipY = nodeViewportY + window.pageYOffset - tooltipHeight - extendedOffset;
                
                // 检查是否有足够的空间在上方显示
                if (nodeViewportY - tooltipHeight - extendedOffset < 0) {
                    // 如果上方空间不足，显示在下方，同样是2.5倍距离
                    isAbove = false;
                    tooltipY = nodeViewportY + window.pageYOffset + extendedOffset;
                }
                
                // 确保tooltip不超出视口左右边界
                tooltipX = Math.max(10, Math.min(viewportWidth - tooltipWidth - 10, tooltipX));
                
                // 应用最终位置 - 直接设置为可见，不使用过渡效果
                timelineTooltip
                    .style("visibility", "visible")
                    .style("left", tooltipX + "px")
                    .style("top", tooltipY + "px")
                    .style("opacity", 1); // 直接设置为完全不透明
                
                // 重新绘制连接线 - 首先清除旧的线
                svg.selectAll(`.${TIME_NS.lineClass}`).remove();
                
                // 计算连接线的起点和终点
                const nodeX = d.x + margin.left;
                const nodeY = d.y;
                const lineStartY = isAbove ? nodeY - r(d.comments) : nodeY + r(d.comments);
                
                // 计算tooltip相对于SVG的位置，用于连接线
                const svgRect = svg.node().getBoundingClientRect();
                const tooltipRelativeY = isAbove 
                    ? tooltipY + tooltipHeight - (svgRect.top + window.pageYOffset)
                    : tooltipY - (svgRect.top + window.pageYOffset);
                
                // 创建连接线元素并立即显示，不使用过渡效果
                const connectionLine = svg.append("line")
                    .attr("class", TIME_NS.lineClass)
                    .attr("x1", nodeX)
                    .attr("y1", lineStartY)
                    .attr("x2", nodeX)
                    .attr("y2", tooltipRelativeY)
                    .style("stroke", "black") // 确保线是黑色的
                    .style("stroke-width", "2.5px") // 线宽适中
                    .style("stroke-opacity", 1); // 直接设置为可见
                
                // 移除setTimeout，因为我们不再需要延迟显示
            })
            .on("mouseout", function() {
                // 移除高亮样式
                d3.select(this).classed(TIME_NS.highlightClass, false);
                
                // 立即隐藏tooltip和连接线，不使用过渡效果
                timelineTooltip.style("opacity", 0);
                
                // 立即移除连接线，不等待过渡结束
                svg.selectAll(`.${TIME_NS.lineClass}`).remove();
                
                // 移除setTimeout，因为我们立即移除连接线
            });

        // 添加时间标注
        const decades = d3.range(1980, 2030, 10);
        mainG.selectAll(".decade-text")
           .data(decades)
           .join("text")
           .attr("class", "decade-text")
           .attr("x", d => x(new Date(d, 0, 1)))
           .attr("y", height - 10)
           .attr("text-anchor", "middle")
           .text(d => `${d}s`);

        // 添加小圈和虚线
        mainG.selectAll(".circle")
           .data(decades)
           .join("circle")
           .attr("class", "circle")
           .attr("cx", d => x(new Date(d, 0, 1)))
           .attr("cy", height - 50)
           .attr("r", 5);

        mainG.selectAll(".dashed-line")
           .data(decades)
           .join("line")
           .attr("class", "dashed-line")
           .attr("x1", d => x(new Date(d, 0, 1)))
           .attr("y1", 0)
           .attr("x2", d => x(new Date(d, 0, 1)))
           .attr("y2", height - 50)
           .attr("stroke", "black")
           .attr("stroke-dasharray", "4 2");

        // 添加图片
        const midPoints = decades.slice(0, -1).map((d, i) => (x(new Date(d, 0, 1)) + x(new Date(decades[i + 1], 0, 1))) / 2);
        
        mainG.selectAll(".mid-image")
           .data(midPoints)
           .join("image")
           .attr("class", "mid-image")
           .attr("xlink:href", "./timeline/array.png")
           .attr("x", d => d - 15)
           .attr("y", height - 40)
           .attr("width", 30)
           .attr("height", 30);
    }
    
    // 初始化函数
    function initTimeline() {
        // 检查是否已初始化
        const container = document.querySelector(`.${TIME_NS.containerClass}`);
        if (!container) {
            console.error(`Timeline: 找不到.${TIME_NS.containerClass}容器`);
            return;
        }
        
        // 检查SVG是否存在
        let svg = container.querySelector('svg');
        if (!svg) {
            console.log(`Timeline: 在.${TIME_NS.containerClass}容器中创建新的SVG元素`);
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "1000");
            svg.setAttribute("height", "800");
            container.appendChild(svg);
        }
        
        timelineSvg = d3.select(svg);
        timelineTooltip = createTooltip();
        
        // 加载数据并绘制图表
        fetchTimelineData();
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimeline);
    } else {
        // 如果DOM已加载，直接初始化
        initTimeline();
    }
})();

// 移除下面的全局代码，因为已经在IIFE中处理了
// let parsedData = [];
// fetch(...).then(...).catch(...);
// function drawChart(data) { ... }
// document.addEventListener('DOMContentLoaded', function() { ... });