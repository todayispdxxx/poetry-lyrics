// 设置画布尺寸和边距
const margin = {top: 10, right: 30, bottom: 30, left: 40};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// 创建SVG容器
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 创建tooltip div
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "d3-tooltip")
    .style("opacity", 0);

// 加载数据
d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/singer_2.json", function(error, data) {
    if (error) throw error;

    // 找到邓丽君的数据
    const teresaData = data.find(d => d.singer === "邓丽君");
    if (!teresaData) throw new Error('未找到邓丽君的数据');

    // 计算匹配度的范围
    const maxMatchLyric = Math.max(...teresaData.songs.map(s => s.matchlyric_number || 0));
    const minMatchLyric = Math.min(...teresaData.songs.map(s => s.matchlyric_number || 0));

    // 创建比例尺
    const linkDistanceScale = d3.scaleLinear()
        .domain([minMatchLyric, maxMatchLyric])
        .range([100, 250]);  // 增加最大连线长度，调整连线变长

    const linkColorScale = d3.scaleLinear()
        .domain([minMatchLyric, maxMatchLyric])
        .range(["#e0e0e0", "#2196f3"]);

    // 中心节点和四周节点的大小
    const centerNodeSize = 30;  // 中心节点
    const surroundingNodeSize = 16; // 四周节点

    // 构建节点和连接数据
    const nodes = [
        { 
            id: "邓丽君", 
            group: 1,
            singer: teresaData.singer,
            songCount: teresaData.song_count
        }
    ];

    const uniqueSongs = Array.from(new Set(teresaData.songs.map(song => song.song)));
    uniqueSongs.forEach((songName) => {
        const songData = teresaData.songs.find(s => s.song === songName);
        nodes.push({ 
            id: songName,
            songId: songData.id,
            group: 2,
            matchlyric_number: songData.matchlyric_number || 0
        });
    });

    const links = teresaData.songs.map(song => ({
        source: "邓丽君",
        target: song.song,
        matchlyric_number: song.matchlyric_number || 0
    }));

    // 初始化连接线
    const link = svg
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .style("stroke", d => linkColorScale(d.matchlyric_number))
        .style("stroke-width", d => 1 + (d.matchlyric_number / maxMatchLyric) * 2)
        .style("stroke-opacity", 0.6);

    // 初始化节点
    const node = svg
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", d => d.group === 1 ? centerNodeSize : surroundingNodeSize) // 中心节点和四周节点大小
        .style("fill", d => d.group === 1 ? "#ff6b6b" : "#4a90e2")
        .style("stroke", "#fff")
        .style("stroke-width", "1.5px")
        .style("transition", "stroke-width 0.2s, stroke 0.2s")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // 只为中心节点添加文本标签
    const centerLabel = svg
        .selectAll(".center-label")
        .data(nodes.filter(d => d.group === 1))
        .enter()
        .append("g")
        .attr("class", "center-label");

    // 添加歌手名称
    centerLabel.append("text")
        .attr("class", "singer-name")
        .text(d => d.singer)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .attr("dy", "3.0em"); // 调整歌手名称的位置，放置在中心节点下方

    // 添加歌曲数量
    centerLabel.append("text")
        .attr("class", "song-count")
        .text(d => `歌曲数量: ${d.songCount}`)
        .style("text-anchor", "middle")
        .style("font-size", "12px")  // 字体略小
        .style("fill", "#003366")   // 深蓝色
        //.attr("dx", "50px")         // 歌曲数量文本并排显示，调整位置
        .attr("dy", "5.5em");       // 与歌手名称垂直对齐

    // 创建力导向图模拟
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink()
            .id(d => d.id)
            .links(links)
            .distance(d => linkDistanceScale(d.matchlyric_number))) // 使用更新后的连线距离比例尺
        .force("charge", d3.forceManyBody()
            .strength(d => d.group === 1 ? -500 : -200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => 
            (d.group === 1 ? centerNodeSize : surroundingNodeSize) + 5))
        .on("tick", ticked);

    // 拖拽相关函数
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        if (d.group !== 1) {
            d.fx = null;
            d.fy = null;
        }
    }

    // 更新函数
    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x = Math.max(40, Math.min(width - 40, d.x)))
            .attr("cy", d => d.y = Math.max(40, Math.min(height - 40, d.y)));

        // 更新中心标签位置
        centerLabel.attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

    // 固定中心节点位置
    nodes[0].fx = width / 2;
    nodes[0].fy = height / 2;

    // 添加节点悬停效果
    node.on("mouseover", function(d) {
        // 高亮当前节点
        d3.select(this)
            .style("stroke", "#ffd700")
            .style("stroke-width", "3px");
        
        // 只为非中心节点显示tooltip
        if (d.group === 2) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            
            tooltip.html(` 
                <div class="tooltip-title">歌曲名称：${d.id}</div>
                <div class="tooltip-content">引用古诗词字数：${d.matchlyric_number}</div>
            `)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px");
        }

        // 高亮相关连接
        link.style("stroke-opacity", l => 
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1);
    })
    .on("mouseout", function(d) {
        // 恢复节点样式
        d3.select(this)
            .style("stroke", "#fff")
            .style("stroke-width", "1.5px");
        
        // 隐藏tooltip
        tooltip.transition()
            .duration(100)
            .style("opacity", 0);

        // 恢复连接的默认状态
        link.style("stroke-opacity", 0.6);
    })
    .on("mousemove", function(d) {
        if (d.group === 2) {
            tooltip
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 10) + "px");
        }
    });
});
