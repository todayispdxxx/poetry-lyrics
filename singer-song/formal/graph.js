// 定义图表配置数组
const singers = [
    {
        id: "singer1",
        name: "邓丽君",
        width: 500,  // 自定义宽度
        height: 500, // 自定义高度
        position: {  // 自定义位置
            x: 50,
            y: 0
        }
    },
    {
        id: "singer2",
        name: "谷建芬",
        width: 500,
        height: 500,
        position: {
            x: 240,
            y: 380
        }
    },
    {
        id: "singer3",
        name: "费玉清",
        width: 500,
        height: 500,
        position: {
            x: 850,
            y: 800
        }
    },
    {
        id: "singer4",
        name: "戴荃",
        width: 500,
        height: 500,
        position: {
            x: 800,
            y: 1200
        }

    },
    {
        id: "singer5",
        name: "蒋明",
        width: 500,
        height: 500,
        position: {
            x: 450,
            y: 940
        }

    },
    {
        id: "singer6",
        name: "王菲",
        width: 500,
        height: 500,
        position: {
            x: 40,
            y: 1620
        }
    },
    {
        id: "singer7",
        name: "莫文蔚",
        width: 500,
        height: 500,
        position: {
            x: -50,
            y: 1970
        }
    },
    {
        id: "singer8",
        name: "凤凰传奇",
        width: 500,
        height: 500,
        position: {
            x: 350,
            y: 2000
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


// 修改图表生成函数,接收尺寸参数
function createSingerGraph(singerId, singerName, width = 800, height = 600, position) {
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const graphContainer = d3.select("#my_dataviz")
        .append("div")
        .attr("id", singerId)
        .style("position", "absolute")
        .style("left", `${position.x}px`)
        .style("top", `${position.y}px`)
        .style("width", `${width}px`)
        .style("height", `${height}px`);

    const svg = graphContainer.append("svg")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("opacity", 0);

    fetch("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/singer2.json")
        .then(response => response.json())
        .then(data => {
            const singerData = data.find(d => d.singer === singerName);
            if (!singerData) throw new Error(`未找到${singerName}的数据`);

            const maxMatchLyric = Math.max(...singerData.songs.map(s => s.matchlyric_number || 0));
            const minMatchLyric = Math.min(...singerData.songs.map(s => s.matchlyric_number || 0));

            const linkDistanceScale = d3.scaleLinear()
                .domain([minMatchLyric, maxMatchLyric])
                .range([60, 150]);

            const defaultLinkColor = "#8B8386";
            const centerNodeSize = 35;
            const surroundingNodeSize = 20;

            const nodes = [
                {
                    id: singerName,
                    group: 1,
                    singer: singerData.singer,
                    songCount: singerData.song_count,
                    image: singers.image  // 添加图片路径
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

            const link = svg
                .selectAll("line")
                .data(links)
                .join("line")
                .style("stroke", defaultLinkColor)
                .style("stroke-width", d => 1 + (d.matchlyric_number / maxMatchLyric) * 2)
                .style("stroke-opacity", 0.6)
                .attr("class", "graph-link");

            const nodeGroup = svg.selectAll(".node-group")
                .data(nodes)
                .join("g")
                .attr("class", "node-group");

            const nodeScaleGroup = nodeGroup
                .append("g")
                .attr("class", "node-scale-group");

            const node = nodeScaleGroup
                .append("image")
                .attr("xlink:href", d => {
                    if (d.group === 1) {
                        return "./src/image/denglijun.png";
                    } else {
                        const surroundingImages = [
                            "./src/image/new-green.png",
                            "./src/image/new-red.png",
                            "./src/image/new-yellow.png"
                        ];
                        return surroundingImages[nodes.indexOf(d) % 3];
                    }
                })
                .attr("width", d => d.group === 1 ? centerNodeSize * 2 : surroundingNodeSize * 2)
                .attr("height", d => d.group === 1 ? centerNodeSize * 2 : surroundingNodeSize * 2)
                .attr("x", d => d.group === 1 ? -centerNodeSize : -surroundingNodeSize)
                .attr("y", d => d.group === 1 ? -centerNodeSize : -surroundingNodeSize)
                .style("cursor", "pointer");

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links)
                    .id(d => d.id)
                    .distance(d => linkDistanceScale(d.matchlyric_number))
                    .strength(0.7))
                .force("charge", d3.forceManyBody()
                    .strength(d => d.group === 1 ? -1200 : -600))
                .force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
                .force("collision", d3.forceCollide()
                    .radius(d => (d.group === 1 ? centerNodeSize : surroundingNodeSize) + 15))
                .force("radial", d3.forceRadial(
                    d => d.group === 1 ? 0 : 180,
                    chartWidth / 2,
                    chartHeight / 2
                ).strength(0.3));

            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                if (d.group !== 1) {
                    d.fx = null;
                    d.fy = null;
                }
            }

            nodeGroup.call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                nodeGroup.attr("transform", d => `translate(${d.x}, ${d.y})`);
            });

            nodes[0].fx = chartWidth / 2;
            nodes[0].fy = chartHeight / 2;

            nodeGroup
                .on("mouseover", (event, d) => {
                    link
                        .style("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "#FF6A6A" : defaultLinkColor)
                        .style("stroke-opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1);

                    tooltip.html(d.group === 1
                        ? `<div class="tooltip-title">歌手名称：${d.singer}</div><div class="tooltip-content">歌曲数量：${d.songCount}</div>`
                        : `<div class="tooltip-title">《${d.id}》</div><div class="tooltip-content">引用古诗词字数：${d.matchlyric_number}</div>`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px")
                        .style("opacity", 1);
                })
                .on("mouseout", () => {
                    link
                        .style("stroke", defaultLinkColor)
                        .style("stroke-opacity", 0.6);

                    tooltip.style("opacity", 0);
                });
        });
}

// 添加布局样式
const layoutStyles = `

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

// 修改图表初始化代码
window.onload = function() {
    // 确保my_dataviz容器存在
    const container = d3.select("#my_dataviz")
        .style("width", "100vw")
        .style("height", "3500px")
        .style("position", "relative");

    // 初始化所有歌手图表
    singers.forEach(config => {
        createSingerGraph(
            config.id,
            config.name,
            config.width || 800,
            config.height || 600,
            config.position
        );
    });
};
