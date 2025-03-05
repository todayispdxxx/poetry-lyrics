let parsedData = [];

// 使用fetch API获取JSON数据
fetch('https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/time-data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        return response.json();
    })
    .then(jsonResponse => {
        // 解析JSON数据
        const jsonData = jsonResponse.data || [];
        
        parsedData = jsonData
            .filter(d => d.date) // 确保有日期
            .map(d => ({
                date: new Date(d.date),
                comments: parseInt(d.comment) || 0,
                song: d.actual_song || '',
                singer: d.actual_singer || ''
            }));
        
        // 使用 Map 去重
        const uniqueData = new Map();
        parsedData.forEach(item => {
            const key = `${item.date.getTime()}-${item.comments}-${item.song}-${item.singer}`;
            if (!uniqueData.has(key)) {
                uniqueData.set(key, item);
            }
        });
        parsedData = Array.from(uniqueData.values());

        // 生成图表
        drawChart(parsedData);
    })
    .catch(error => {
        console.error('获取或解析数据时出错:', error);
    });

function drawChart(data) {
    // 首先检查.timeline容器是否存在
    const container = d3.select(".timeline");
    if (container.empty()) {
        console.error("找不到.timeline容器");
        return;
    }
    
    // 在容器中查找或创建SVG
    let svg = container.select("svg");
    if (svg.empty()) {
        console.log("在.timeline容器中创建新的SVG元素");
        svg = container.append("svg")
            .attr("width", 1000)
            .attr("height", 800);
    }
    
    const width = +svg.attr("width"),
          height = +svg.attr("height"),
          margin = { left: 80 }; // 从100减小到50，减少左侧空白

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

    // 移除之前的tooltip
    d3.selectAll(".tooltip").remove();
    
    // 修改tooltip样式，确保总是完整显示文本
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "12px")
        .style("padding", "12px")
        .style("min-width", "250px")
        .style("max-width", "500px") // 较大的最大宽度
        .style("opacity", 0)
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
        .style("pointer-events", "none")
        .style("z-index", 1000);

    // D3 v7中的力布局用法基本相同，保持原始参数
    const simulation = d3.forceSimulation(filteredData)
        .force("x", d3.forceX(d => x(d.date)).strength(7))
        .force("y", d3.forceY(height / 2).strength(0.1))
        .force("collide", d3.forceCollide().radius(d => r(d.comments) + 2))
        .stop();

    for (let i = 0; i < 300; ++i) simulation.tick();

    // 在D3 v7中使用join()方法替代enter().append()
    mainG.selectAll(".dot")
       .data(filteredData)
       .join("circle") // 这是v7的变化
       .attr("class", "dot")
       .attr("cx", d => d.x)
       .attr("cy", d => d.y)
       .attr("r", d => r(d.comments))
       .on("mouseover", function(event, d) { // D3 v7中事件参数为(event, d)
            d3.select(this).classed("highlight", true);
            
            // 修改HTML结构，使用word-wrap而不是text-overflow:ellipsis
            tooltip.html(`
                <div class="image"></div>
                <div class="row" style="margin-bottom:4px;">
                    <div class="singer" style="word-wrap:break-word; word-break:break-word; white-space:normal; display:block; width:100%; max-width:480px;">
                        ${d.singer}
                    </div>
                    <div class="song" style="word-wrap:break-word; word-break:break-word; white-space:normal; display:block; width:100%; max-width:480px;">
                        《${d.song}》
                    </div>
                </div>
                <div class="row bottom-align" style="margin-top:6px; display:flex; justify-content:space-between;">
                    <div class="year" style="min-width:40px;">${d.date.getFullYear()}</div>
                    <div class="comments" style="display:flex; align-items:center;">
                        <img src="./timeline/comment.png" onerror="this.src='./comment.png'" alt="评论图标" 
                             class="comment-icon" style="width:16px; height:16px; margin-right:3px;">
                        <span>${d.comments}</span>
                    </div>
                </div>
            `);
            
            // 设置tooltip可见
            tooltip.style("opacity", 1);
            
            // 检查tooltip是否会超出视口
            const tooltipHeight = tooltip.node().offsetHeight;
            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipX = event.pageX - tooltipWidth / 2;
            const offset = 150;
            const tooltipY = event.pageY - tooltipHeight - offset;
            
            // 是否在上方显示
            const isAbove = tooltipY > 20;
            const finalTooltipY = isAbove ? tooltipY : event.pageY + offset;
            
            // 调整X位置，确保不超出视口
            const viewportWidth = window.innerWidth;
            let adjustedTooltipX = Math.max(10, Math.min(viewportWidth - tooltipWidth - 10, tooltipX));
            
            // 优化：只有当tooltip超出视口才应用宽度调整
            const willExceedViewport = tooltipWidth > viewportWidth - 20;
            
            // 如果宽度超出视口，进行宽度调整
            if (willExceedViewport) {
                // 先调整tooltip宽度，确保适应视口
                tooltip.style("max-width", (viewportWidth - 40) + "px");
                
                // 重新计算位置
                adjustedTooltipX = 20;
            }
            
            // 应用位置
            tooltip.style("left", adjustedTooltipX + "px")
                   .style("top", finalTooltipY + "px");
            
            // 计算连接线
            const nodeX = d.x + margin.left; // 考虑g元素的平移
            const nodeY = d.y;
            
            // 根据tooltip方向计算连接点
            const lineStartY = isAbove ? nodeY - r(d.comments) : nodeY + r(d.comments);
            const lineEndY = isAbove ? finalTooltipY : finalTooltipY + tooltipHeight;
            
            // 清除旧的线条
            svg.selectAll(".tooltip-line").remove();
            
            // 绘制更美观的连接线
            svg.append("line")
                .attr("class", "tooltip-line")
                .attr("x1", nodeX)
                .attr("y1", lineStartY)
                .attr("x2", nodeX)
                .attr("y2", lineEndY)
                .attr("stroke", "#555") // 稍微柔和的黑色
                .attr("stroke-width", 1.5) // 稍细一点的线
                .attr("stroke-opacity", 0.8); // 轻微的透明度
        })
        .on("mouseout", function() {
            d3.select(this).classed("highlight", false);
            tooltip.style("opacity", 0);
            svg.selectAll(".tooltip-line, .tooltip-triangle").remove();  // 保留这行以确保清除所有元素
        });

    // 添加时间标注 - 使用join方法而不是enter().append()
    const decades = d3.range(1980, 2030, 10);
    mainG.selectAll(".decade-text")
       .data(decades)
       .join("text") // v7变化
       .attr("class", "decade-text")
       .attr("x", d => x(new Date(d, 0, 1)))
       .attr("y", height - 10)
       .attr("text-anchor", "middle")
       .text(d => `${d}s`);

    // 添加小圈和虚线 - 使用join方法
    mainG.selectAll(".circle")
       .data(decades)
       .join("circle") // v7变化
       .attr("class", "circle")
       .attr("cx", d => x(new Date(d, 0, 1)))
       .attr("cy", height - 50)
       .attr("r", 5);

    mainG.selectAll(".dashed-line")
       .data(decades)
       .join("line") // v7变化
       .attr("class", "dashed-line")
       .attr("x1", d => x(new Date(d, 0, 1)))
       .attr("y1", 0)
       .attr("x2", d => x(new Date(d, 0, 1)))
       .attr("y2", height - 50)
       .attr("stroke", "black")
       .attr("stroke-dasharray", "4 2");

    // 添加图片 - 使用join方法并添加错误处理
    const midPoints = decades.slice(0, -1).map((d, i) => (x(new Date(d, 0, 1)) + x(new Date(decades[i + 1], 0, 1))) / 2);
    
    mainG.selectAll(".mid-image")
       .data(midPoints)
       .join("image") // v7变化
       .attr("class", "mid-image")
       .attr("xlink:href", "./timeline/array.png")
       .attr("x", d => d - 15)
       .attr("y", height - 40)
       .attr("width", 30)
       .attr("height", 30)
}

// DOM加载完成后检查SVG元素
document.addEventListener('DOMContentLoaded', function() {
    // 检查SVG容器是否存在
    const timeline = document.querySelector('.timeline');
    if (timeline && !timeline.querySelector('svg')) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "1000");
        svg.setAttribute("height", "800");
        timeline.appendChild(svg);
    }
});