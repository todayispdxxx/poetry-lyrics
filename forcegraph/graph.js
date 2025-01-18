function processData(rawData) {
    if (!Array.isArray(rawData)) {
        console.error('输入数据格式错误:', rawData);
        return { nodes: [], links: [] };
    }

    // 用于存储节点和连接信息
    const nodes = new Map();
    const links = [];
    
    // 第一次遍历：收集所有节点和它们的连接信息
    rawData.forEach(item => {
        if (!item?.singer || !item?.poem_matches) return;
        
        const singer = item.singer;
        
        // 初始化或更新歌手节点
        if (!nodes.has(singer)) {
            nodes.set(singer, {
                id: singer,
                group: 1,
                type: 'singer',
                connectedPoems: new Set(), // 存储连接的诗词
                connections: 0
            });
        }
        
        // 处理诗词节点
        Object.entries(item.poem_matches).forEach(([_, poem]) => {
            if (!poem?.title || !poem?.writer) return;
            
            const poemId = `${poem.title}·${poem.writer}`;
            
            // 初始化或更新诗词节点
            if (!nodes.has(poemId)) {
                nodes.set(poemId, {
                    id: poemId,
                    group: 2,
                    type: 'poetry',
                    writer: poem.writer,
                    title: poem.title,
                    connectedSingers: new Set(), // 存储连接的歌手
                    connections: 0
                });
            }
            
            // 更新连接计数
            const singerNode = nodes.get(singer);
            const poemNode = nodes.get(poemId);
            
            singerNode.connectedPoems.add(poemId);
            poemNode.connectedSingers.add(singer);
            
            // 添加连接
            links.push({
                source: singer,
                target: poemId,
                matchingChars: poem.chars.join(''),
                songTitle: item.song
            });
        });
    });

    // 创建节点大小的比例尺
    let singerSizes = Array.from(nodes.values())
        .filter(n => n.group === 1)
        .map(n => n.connectedPoems.size);
    let poetrySizes = Array.from(nodes.values())
        .filter(n => n.group === 2)
        .map(n => n.connectedSingers.size);

    const singerScale = d3.scaleSqrt()
        .domain([Math.min(...singerSizes), Math.max(...singerSizes)])
        .range([CONFIG.radius.singer.min, CONFIG.radius.singer.max]);

    const poetryScale = d3.scaleSqrt()
        .domain([Math.min(...poetrySizes), Math.max(...poetrySizes)])
        .range([CONFIG.radius.poetry.min, CONFIG.radius.poetry.max]);

    // 转换为最终的节点数组
    const finalNodes = Array.from(nodes.values()).map(node => {
        if (node.group === 1) {
            // 歌手节点
            return {
                ...node,
                radius: singerScale(node.connectedPoems.size),
                poemCount: node.connectedPoems.size,
                displaySize: singerScale(node.connectedPoems.size).toFixed(1)
            };
        } else {
            // 诗词节点
            return {
                ...node,
                radius: poetryScale(node.connectedSingers.size),
                singerCount: node.connectedSingers.size,
                displaySize: poetryScale(node.connectedSingers.size).toFixed(1)
            };
        }
    });

    return {
        nodes: finalNodes,
        links: links
    };
}

function createForceGraph(data, config) {
    // 清除已有的图表和提示框
    d3.select("#graph").selectAll("*").remove();

    // 创建 SVG，设置为全屏
    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .style("position", "fixed")  // 固定位置
        .style("top", 0)
        .style("left", 0);

    // 创建提示框
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("z-index", 1000);

    // 设置缩放行为
    const g = svg.append("g");
    const zoom = d3.zoom()
        .scaleExtent([config.zoom.min, config.zoom.max])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom)
       .call(zoom.transform, d3.zoomIdentity
            .translate(config.width / 2, config.height / 2)
            .scale(0.5));

    // 创建力导向模拟
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(config.force.distance))
        .force("charge", d3.forceManyBody()
            .strength(config.force.nodeStrength)
            .distanceMax(500))
        .force("center", d3.forceCenter(config.width / 2, config.height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius * 1.2))
        .velocityDecay(0.6);

    // 绘制连接线
    const link = g.append("g")
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5);

    // 创建节点组
    const node = g.append("g")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
        .attr("class", "node")
        .call(drag(simulation));

    // 添加节点圆圈
    node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.group === 1 ? config.colors.singer : config.colors.poetry)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    // 添加节点文本
    node.append("text")
        .attr("dy", d => d.radius + 15)
        .text(d => d.id.length > 12 ? d.id.slice(0, 12) + '...' : d.id)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#2d3436");

   // 节点交互事件
node.on("mouseover", function(event, d) {
    // 高亮当前节点
    d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("stroke", config.colors.highlight)
        .attr("stroke-width", 3);

    // 构建提示框内容
    let content = '';
    if (d.group === 1) {
        // 歌手节点信息
        content = `
            <div class="tooltip-title">${d.id}</div>
            <div class="tooltip-content">
                <div class="tooltip-item">
                    <span class="tooltip-label">演唱诗词数量:</span>
                    <span class="tooltip-value">${d.poemCount} 首</span>
                </div>
                <div class="tooltip-item">
                    <span class="tooltip-label">节点大小:</span>
                    <span class="tooltip-value">${d.displaySize}</span>
                </div>
            </div>
        `;
    } else {
        // 诗词节点信息
        content = `
            <div class="tooltip-title">${d.title}</div>
            <div class="tooltip-content">
                <div class="tooltip-item">
                    <span class="tooltip-label">作者:</span>
                    <span class="tooltip-value">${d.writer}</span>
                </div>
                <div class="tooltip-item">
                    <span class="tooltip-label">演唱歌手数:</span>
                    <span class="tooltip-value">${d.singerCount} 位</span>
                </div>
                <div class="tooltip-item">
                    <span class="tooltip-label">节点大小:</span>
                    <span class="tooltip-value">${d.displaySize}</span>
                </div>
            </div>
        `;
    }

    tooltip.transition()
        .duration(200)
        .style("opacity", 1);  // 增加不透明度
        
    tooltip.html(content)
        .style("left", (event.pageX + 15) + "px")  // 稍微调整位置
        .style("top", (event.pageY - 15) + "px");
})
.on("mouseout", function() {
    // 恢复节点样式
    d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    tooltip.transition()
        .duration(300)  // 稍微加快消失速度
        .style("opacity", 0);
});

    // 更新力导向图位置
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // 拖拽函数
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.1).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

// 加载数据并初始化图表
async function initializeGraph() {
    try {
        const response = await d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/newdata.json");
        const graphData = processData(response);
        createForceGraph(graphData, CONFIG);
    } catch (error) {
        console.error('加载或处理数据时出错:', error);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeGraph);
