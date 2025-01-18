function processData(rawData) {
    if (!Array.isArray(rawData)) {
        console.error('输入数据格式错误:', rawData);
        return { nodes: [], links: [] };
    }

    // 分别统计歌手和诗词的连接数
    const singerConnections = new Map();
    const poetryConnections = new Map();
    const nodes = new Set();
    const links = [];
    
    // 第一次遍历：统计连接数
    rawData.forEach(item => {
        if (!item?.singer || !item?.poem_matches) return;
        
        const singer = item.singer;
        const poemCount = Object.keys(item.poem_matches).length;
        singerConnections.set(singer, (singerConnections.get(singer) || 0) + poemCount);
        
        Object.values(item.poem_matches).forEach(poem => {
            if (!poem?.title || !poem?.writer) return;
            const poemId = `${poem.title}·${poem.writer}`;
            poetryConnections.set(poemId, (poetryConnections.get(poemId) || 0) + 1);
        });
    });

    // 创建两个独立的比例尺
    const singerScale = d3.scaleSqrt()  // 使用平方根比例尺使差异更明显
        .domain([
            Math.min(...singerConnections.values()),
            Math.max(...singerConnections.values())
        ])
        .range([CONFIG.radius.singer.min, CONFIG.radius.singer.max]);

    const poetryScale = d3.scaleSqrt()
        .domain([
            Math.min(...poetryConnections.values()),
            Math.max(...poetryConnections.values())
        ])
        .range([CONFIG.radius.poetry.min, CONFIG.radius.poetry.max]);

    // 第二次遍历：创建节点和连接
    rawData.forEach(item => {
        if (!item?.singer || !item?.poem_matches) return;

        // 添加歌手节点
        const singerConnCount = singerConnections.get(item.singer);
        nodes.add(JSON.stringify({
            id: item.singer,
            group: 1,
            type: 'singer',
            radius: singerScale(singerConnCount),
            connections: singerConnCount,
            displaySize: singerScale(singerConnCount).toFixed(1)  // 用于调试
        }));

        // 处理诗词匹配
        Object.entries(item.poem_matches).forEach(([_, poem]) => {
            if (!poem?.title || !poem?.writer) return;

            const poemId = `${poem.title}·${poem.writer}`;
            const poetryConnCount = poetryConnections.get(poemId);
            nodes.add(JSON.stringify({
                id: poemId,
                group: 2,
                type: 'poetry',
                writer: poem.writer,
                title: poem.title,
                radius: poetryScale(poetryConnCount),
                connections: poetryConnCount,
                displaySize: poetryScale(poetryConnCount).toFixed(1)  // 用于调试
            }));

            links.push({
                source: item.singer,
                target: poemId,
                matchingChars: poem.chars.join(''),
                songTitle: item.song
            });
        });
    });

    return {
        nodes: Array.from(nodes).map(node => JSON.parse(node)),
        links
    };
}

function createForceGraph(data, config) {
    d3.select("#graph").selectAll("*").remove();

    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", "100%")  // 使用百分比
        .attr("height", "100%") // 使用百分比
        .attr("viewBox", [0, 0, config.width, config.height]);

    // 添加缩放功能
    const g = svg.append("g");
    svg.call(d3.zoom()
        .scaleExtent([config.zoom.min, config.zoom.max])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));

    // 创建提示框
    const tooltip = d3.select("#graph")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // 创建力导向模拟
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(config.force.distance))
        .force("charge", d3.forceManyBody()
            .strength(config.force.charge))
        .force("center", d3.forceCenter(config.width / 2, config.height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius * 1.5)); // 增加碰撞半径

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
        .attr("fill", d => d.group === 1 ? config.colors.singer : config.colors.poetry);

    // 添加节点文本
    node.append("text")
        .attr("dy", d => d.radius + 15) // 调整文本位置
        .text(d => {
            if (d.id.length > 12) {
                return d.id.slice(0, 12) + '...';
            }
            return d.id;
        })
        .style("text-anchor", "middle")
        .style("font-size", "14px"); // 增大字体大小

    // 节点交互事件
   // 节点交互事件
node.on("mouseover", function(event, d) {
    const content = d.group === 1 
        ? `歌手: ${d.id}<br>连接数: ${d.connections}<br>节点大小: ${d.displaySize}`
        : `诗词: ${d.id}<br>作者: ${d.writer}<br>连接数: ${d.connections}<br>节点大小: ${d.displaySize}`;

    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip.html(content)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
})
.on("mouseout", function() {
    tooltip.transition()
        .duration(500)
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
            if (!event.active) simulation.alphaTarget(0.3).restart();
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