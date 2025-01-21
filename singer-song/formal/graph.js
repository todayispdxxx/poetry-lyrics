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

    // 优化连线距离比例尺，增加最小和最大距离
    const linkDistanceScale = d3.scaleLinear()
        .domain([minMatchLyric, maxMatchLyric])
        .range([150, 300]);

    // 使用更淡的灰色作为默认连线颜色
    const defaultLinkColor = "#d1d1d1";

    // 调整节点大小
    const centerNodeSize = 35;
    const surroundingNodeSize = 18;

    // 构建节点和连接数据
    const nodes = [
        { 
            id: "双笙", 
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
        source: "双笙",
        target: song.song,
        matchlyric_number: song.matchlyric_number || 0
    }));

    // 初始化连接线 - 添加渐变效果
    const link = svg
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .style("stroke", defaultLinkColor)
        .style("stroke-width", d => 1 + (d.matchlyric_number / maxMatchLyric) * 2)
        .style("stroke-opacity", 0.6)
        .attr("class", "graph-link")
        .attr("stroke-dasharray", function() {
            const length = this.getTotalLength();
            return `${length} ${length}`;
        })
        .attr("stroke-dashoffset", function() {
            return this.getTotalLength();
        });

    // 添加线条显示动画
    link.transition()
        .duration(1000)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);

    // 创建节点组，用于管理放大效果
    const nodeGroup = svg.selectAll(".node-group")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node-group");

    // 为每个节点创建一个额外的g元素用于缩放
    const nodeScaleGroup = nodeGroup
        .append("g")
        .attr("class", "node-scale-group");

    // 初始化节点
    const node = nodeScaleGroup
        .append("image")
        .attr("xlink:href", d => {
            if (d.group === 1) {
                return "denglijun.png";
            } else {
                const surroundingImages = [
                    "new-green.png",
                    "new-red.png",
                    "new-yellow.png"
                ];
                return surroundingImages[nodes.indexOf(d) % 3];
            }
        })
        .attr("width", d => d.group === 1 ? centerNodeSize * 2 : surroundingNodeSize * 2)
        .attr("height", d => d.group === 1 ? centerNodeSize * 2 : surroundingNodeSize * 2)
        .attr("x", d => d.group === 1 ? -centerNodeSize : -surroundingNodeSize)
        .attr("y", d => d.group === 1 ? -centerNodeSize : -surroundingNodeSize)
        .style("cursor", "pointer")
        .attr("class", "node-image");

    // 创建力导向图模拟器
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink()
            .id(d => d.id)
            .links(links)
            .distance(d => linkDistanceScale(d.matchlyric_number))
            .strength(0.7)) // 增加连接强度
        .force("charge", d3.forceManyBody()
            .strength(d => d.group === 1 ? -1200 : -600) // 增加斥力
            .distanceMax(450)
            .theta(0.8)) // 优化性能与精度的平衡
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide()
            .radius(d => (d.group === 1 ? centerNodeSize : surroundingNodeSize) + 15) // 增加碰撞半径
            .strength(0.5)
            .iterations(2)) // 增加迭代次数提高稳定性
        .force("radial", d3.forceRadial(
            d => d.group === 1 ? 0 : 250, // 增加半径使布局更加发散
            width / 2, 
            height / 2
        ).strength(0.3))
        .alphaDecay(0.02) // 减缓衰减速度
        .alphaMin(0.001) // 降低最小阈值使运动更流畅
        .velocityDecay(0.3) // 增加阻尼使运动更平滑
        .alpha(0.5) // 设置初始alpha值

    // 拖拽相关函数
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
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

    // 添加拖拽功能
    nodeGroup.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    function ticked() {
        nodes.forEach(d => {
            if (d.group !== 1) {
                d.x = Math.max(surroundingNodeSize, Math.min(width - surroundingNodeSize, d.x));
                d.y = Math.max(surroundingNodeSize, Math.min(height - surroundingNodeSize, d.y));
            }
        });

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // 更新节点位置
        nodeGroup
            .attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

    // 添加tick事件监听
    simulation.on("tick", ticked);

    // 固定中心节点位置
    nodes[0].fx = width / 2;
    nodes[0].fy = height / 2;

    // 节点悬停效果
    nodeGroup.on("mouseover", function(d) {
        // 创建一个共享的transition实例
        const t = d3.transition()
            .duration(150)
            .ease(d3.easeCubicOut);

        // 高亮当前节点
        const currentNode = d3.select(this);

        // 高亮节点和连线（同时进行）
        if (d.group !== 1) {
            // 同时更新相关和不相关的连线
            link.transition(t)
                .style("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "#ff4d4d" : defaultLinkColor)
                .style("stroke-opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1)
                .style("stroke-width", l => {
                    if (l.source.id === d.id || l.target.id === d.id) {
                        return 2 + (l.matchlyric_number / maxMatchLyric) * 3;
                    }
                    return 1 + (l.matchlyric_number / maxMatchLyric) * 2;
                });
        }

        // 节点动画
        currentNode.select("image")
            .transition(t)
            .style("stroke", "#ffd700")
            .style("stroke-width", "3px")
            .style("filter", "drop-shadow(0 4px 8px rgba(255,215,0,0.3))");

        currentNode.select(".node-scale-group")
            .transition(t)
            .attr("transform", "scale(1.15)");

        // 显示tooltip
        if (d.group === 1) {
            tooltip.html(`
                <div class="tooltip-title">歌手名称：${d.singer}</div>
                <div class="tooltip-content">歌曲数量：${d.songCount}</div>
            `);
        } else {
            tooltip.html(`
                <div class="tooltip-title">歌曲名称：${d.id}</div>
                <div class="tooltip-content">引用古诗词字数：${d.matchlyric_number}</div>
            `);
        }

        tooltip.style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px")
            .transition(t)
            .style("opacity", 1);

        // 显示tooltip
        if (d.group === 1) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            
            tooltip.html(`
                <div class="tooltip-title">歌手名称：${d.singer}</div>
                <div class="tooltip-content">歌曲数量：${d.songCount}</div>
            `)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px");
        } else {
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            
            tooltip.html(`
                <div class="tooltip-title">歌曲名称：${d.id}</div>
                <div class="tooltip-content">引用古诗词字数：${d.matchlyric_number}</div>
            `)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px");

            // 只有非中心节点才改变连线颜色
            link.style("stroke", l => 
                (l.source.id === d.id || l.target.id === d.id) ? "#ff4d4d" : defaultLinkColor)
                .style("stroke-opacity", l => 
                (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1);
        }
    })
    .on("mouseout", function(d) {
        // 创建一个共享的transition实例
        const t = d3.transition()
            .duration(200)
            .ease(d3.easeCubicOut);

        const currentNode = d3.select(this);

        // 同时恢复所有样式
        link.transition(t)
            .style("stroke", defaultLinkColor)
            .style("stroke-opacity", 0.6)
            .style("stroke-width", d => 1 + (d.matchlyric_number / maxMatchLyric) * 2);

        // 恢复节点样式 - 延迟移除阴影效果
        currentNode.select("image")
            .transition(t)
            .style("stroke", "#fff")
            .style("stroke-width", "1.5px")
            .on("end", function() {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
            });
            
        currentNode.select(".node-scale-group")
            .transition(t)
            .attr("transform", "scale(1)");

        // 隐藏tooltip
        tooltip.transition(t)
            .style("opacity", 0);
        
        // 隐藏tooltip
        tooltip.transition()
            .duration(100)
            .style("opacity", 0);

        // 恢复连线颜色（如果不是中心节点）
        if (d.group !== 1) {
            link.style("stroke", defaultLinkColor)
                .style("stroke-opacity", 0.6);
        }
    })
    .on("mousemove", function(d) {
        tooltip
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px");
    });
});