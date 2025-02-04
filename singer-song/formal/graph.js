// 定义图表配置数组
const singers = [
    {
        id: "singer1", 
        name: "邓丽君",
        width: 600,  // 自定义宽度
        height: 500, // 自定义高度
        position: {  // 自定义位置
            x: 0,
            y: 0
        }
    },
    {
        id: "singer2", 
        name: "谷建芬",
        width: 600,
        height: 550,
        position: {
            x: 280,
            y: 250
        }
    },
    {
        id: "singer3", 
        name: "费玉清",
        width: 600,
        height: 500,
        position: {
            x: 800,
            y: 790
        }
    },
    {
        id: "singer4", 
        name: "戴荃",
        width: 600,
        height: 500,
        position: {
            x: 700,
            y: 1200
        }

    },
    {
        id: "singer5",
        name: "蒋明",
        width: 600,
        height: 500,
        position: {
            x: 410,
            y: 940
        }    

    },
    {
        id: "singer6",
        name: "王菲",
        width: 600,
        height: 500,
        position: {
            x: 40,
            y: 1650
        }
    },
    {
        id: "singer7",
        name: "莫文蔚",
        width: 600,
        height: 500,
        position: {
            x: -90,
            y: 1970
        }
    },
    {
        id: "singer8",
        name: "凤凰传奇",
        width: 600,
        height: 500,
        position: {
            x: 270,
            y: 1930
        }
    },
    {
        id: "singer9",
        name: "洛天依",
        width: 600,
        height: 500,
        position: {
            x: 870,
            y: 2430
        }
    },
    {
        id: "singer10",
        name: "清响",
        width: 600,
        height: 500,
        position: {
            x: 480,
            y: 2690
        }
    }

];

// 配置容器参数
const containerConfig = {
    left: 50,    // 容器左边距
    top: 50,     // 容器上边距
    padding: 20  // 容器内边距
};

// 配置主容器参数
const mainContainerConfig = {
    width: 1500,      // 主容器宽度
    height: 3500,     // 主容器高度
    left: 50,         // 主容器左边距
    top: 5000,          // 主容器上边距
    padding: 20       // 主容器内边距
};

// 创建主容器函数
function createMainContainer() {
   return d3.select("#my_dataviz")  // 改为挂载到指定容器
        .append("div")
        .attr("class", "main-container")
        .style("position", "absolute")
        .style("left", `${mainContainerConfig.left}px`)
        .style("top", `${mainContainerConfig.top}px`)
        .style("width", `${mainContainerConfig.width}px`)
        .style("height", `${mainContainerConfig.height}px`)
        .style("padding", `${mainContainerConfig.padding}px`)
        .style("background", "rgba(255, 255, 255, 0.9)")
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 10px rgba(0,0,0,0.1)");
}

// 修改图表生成函数,接收尺寸参数
function createSingerGraph(container, singerId, singerName, width = 800, height = 600, position) {
    const margin = {top: 10, right: 30, bottom: 30, left: 40};
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // 在主容器内创建图表容器
    const graphContainer = container.append("div")
        .attr("id", singerId)
        .style("position", "absolute")
        .style("left", `${position.x}px`)
        .style("top", `${position.y}px`);

    // 创建SVG
    const svg = graphContainer.append("svg")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 创建tooltip div
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("opacity", 0);

    // 加载数据
    d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/singer2.json", function(error, data) {
        if (error) throw error;

        // 找到指定歌手的数据
        const singerData = data.find(d => d.singer === singerName);
        if (!singerData) throw new Error(`未找到${singerName}的数据`);

        // 计算匹配度的范围
        const maxMatchLyric = Math.max(...singerData.songs.map(s => s.matchlyric_number || 0));
        const minMatchLyric = Math.min(...singerData.songs.map(s => s.matchlyric_number || 0));

        // 优化连线距离比例尺，增加最小和最大距离
        const linkDistanceScale = d3.scaleLinear()
            .domain([minMatchLyric, maxMatchLyric])
            .range([100, 240]);  // 缩短连线的最小和最大距离

        // 使用更淡的灰色作为默认连线颜色
        const defaultLinkColor = "#8B8386";

        // 调整节点大小
        const centerNodeSize = 45;
        const surroundingNodeSize = 21;

        // 构建节点和连接数据
        const nodes = [
            { 
                id: singerName, 
                group: 1,
                singer: singerData.singer,
                songCount: singerData.song_count
            }
        ];

        const uniqueSongs = Array.from(new Set(singerData.songs.map(song => song.song)));
        uniqueSongs.forEach((songName) => {
            const songData = singerData.songs.find(s => s.song === songName);
            nodes.push({ 
                id: songName,
                songId: songData.id,
                group: 2,
                matchlyric_number: songData.matchlyric_number || 0
            });
        });

        const links = singerData.songs.map(song => ({
            source: singerName,
            target: song.song,
            matchlyric_number: song.matchlyric_number || 0
        }));

        // 初始化连接线
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
            .ease(d3.easeCubicOut) // 改为更柔和的过渡
            .attr("stroke-dashoffset", 0);

        // 创建节点组
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
            .style("filter", "none")
            .style("stroke", "#fff")
            .style("stroke-width", "1.5px")
            .attr("class", "node-image");

        // 创建力导向图模拟器
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink()
                .id(d => d.id)
                .links(links)
                .distance(d => linkDistanceScale(d.matchlyric_number))
                .strength(0.7))
            .force("charge", d3.forceManyBody()
                .strength(d => d.group === 1 ? -1200 : -600)
                .distanceMax(500)
                .theta(0.8))
            .force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
            .force("collision", d3.forceCollide()
                .radius(d => (d.group === 1 ? centerNodeSize : surroundingNodeSize) + 15)
                .strength(0.5)
                .iterations(4)) // 提高迭代次数
            .force("radial", d3.forceRadial(
                d => d.group === 1 ? 0 : 250,
                chartWidth / 2, 
                chartHeight / 2
            ).strength(0.3))
            .alphaDecay(0.1)  // 减慢衰减速度
            .alphaMin(0.01)    // 设置更小的alphaMin
            .velocityDecay(0.20) // 降低速度衰减
            .alpha(0.3);

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
                    d.x = Math.max(surroundingNodeSize, Math.min(chartWidth - surroundingNodeSize, d.x));
                    d.y = Math.max(surroundingNodeSize, Math.min(chartHeight - surroundingNodeSize, d.y));
                }
            });

            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeGroup.attr("transform", d => `translate(${d.x}, ${d.y})`);
        }

        simulation.on("tick", ticked);

        // 固定中心节点位置
        nodes[0].fx = chartWidth / 2;
        nodes[0].fy = chartHeight / 2;

        // 节点悬停效果
        nodeGroup
            .on("mouseover", function(d) {
                const t = d3.transition()
                    .duration(100) // 适当增加过渡时间
                    .ease(d3.easeCubicOut);  // 使用更平滑的过渡效果

                const currentNode = d3.select(this);

                // 高亮节点和连线的过渡
                link.transition(t)
                    .style("stroke", l => (l.source.id === d.id || l.target.id === d.id) && d.group !== 1 ? "#FF6A6A" : defaultLinkColor)
                    .style("stroke-opacity", l => (l.source.id === d.id || l.target.id === d.id) && d.group !== 1 ? 1 : 0.1)
                    .style("stroke-width", l => {
                        if (l.source.id === d.id || l.target.id === d.id) {
                            return 2 + (l.matchlyric_number / maxMatchLyric) * 3;
                        }
                        return 1 + (l.matchlyric_number / maxMatchLyric) * 2;
                    });

                // 高亮节点的过渡效果
                currentNode.select("image")
                    .transition(t)
                    .style("stroke", "#ffd700")
                    .style("stroke-width", "3px")
                    .style("filter", "drop-shadow(0 4px 8px rgba(255,215,0,0.3))");

                currentNode.select(".node-scale-group")
                    .transition(t)
                    .attr("transform", "scale(1.2)");

                // 显示tooltip
                tooltip.html(d.group === 1 
                    ? `<div class="tooltip-title">歌手名称：${d.singer}</div>
                       <div class="tooltip-content">歌曲数量：${d.songCount}</div>` 
                    : `<div class="tooltip-title">《${d.id}》</div>
                       <div class="tooltip-content">引用古诗词字数：${d.matchlyric_number}</div>`)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 10) + "px")
                    .transition(t)
                    .style("opacity", 1);
            })
            .on("mouseout", function(d) {
                const t = d3.transition()
                    .duration(100)
                    .ease(d3.easeCubicOut);

                const currentNode = d3.select(this);

                // 恢复连线的过渡效果
                link.transition(t)
                    .style("stroke", defaultLinkColor)
                    .style("stroke-opacity", 0.6)
                    .style("stroke-width", d => 1 + (d.matchlyric_number / maxMatchLyric) * 1.4);

                // 恢复节点的过渡效果
                currentNode.select("image")
                    .transition(t)
                    .style("stroke", "#fff")
                    .style("stroke-width", "1.5px")
                    .style("filter", "none");

                currentNode.select(".node-scale-group")
                    .transition(t)
                    .attr("transform", "scale(1)");

                // 隐藏tooltip
                tooltip.transition(t)
                    .style("opacity", 0);
            })
            .on("mousemove", function(d) {
                tooltip
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 10) + "px");
            });
    });
}

// 添加布局样式
const layoutStyles = `
.graph-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

#my_dataviz {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: auto;
}

.singer-graph {
    position: absolute;
    padding: 15px;
    overflow: hidden;
}
`;

// 添加样式到页面
const styleSheet = document.createElement("style");
styleSheet.textContent = layoutStyles;
document.head.appendChild(styleSheet);

// 初始化函数
function initializeGraphs() {
    const mainContainer = createMainContainer();
    
    // 遍历singers数组创建所有图表
    singers.forEach(singer => {
        createSingerGraph(
            mainContainer,
            singer.id,
            singer.name,
            singer.width,
            singer.height,
            singer.position
        );
    });
}

// 创建图表
initializeGraphs();
