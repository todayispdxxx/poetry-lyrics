// 定义图表配置数组
const singers = [
    {
        id: "singer1",
        name: "邓丽君",
        width: 450,
        height: 450,
        image: "./src/image/denglijun.png",
        position: {
            x: 100,
            y: 0
        }
    },
    {
        id: "singer2",
        name: "谷建芬",
        width: 450,
        height: 450,
        image: "./src/image/gujianfen.png",
        position: {
            x: 480,
            y: 350
        }
    },
    {
        id: "singer3",
        name: "费玉清",
        width: 450,
        height: 450,
        image: "./src/image/feiyuqing.png",
        position: {
            x: 920,
            y: 800
        }
    },
    {
        id: "singer4",
        name: "戴荃",
        width: 450,
        height: 500,
        image: "./src/image/daiquan.png",
        position: {
            x: 760,
            y: 1150
        }
    },
    {
        id: "singer5",
        name: "蒋明",
        width: 450,
        height: 420,
        image: "./src/image/jiangming.png",
        position: {
            x: 450,
            y: 920
        }
    },
    {
        id: "singer6",
        name: "王菲",
        width: 450,
        height: 480,
        image: "./src/image/wangfei.png",
        position: {
            x: 150,
            y: 1620
        }
    },
    {
        id: "singer7",
        name: "莫文蔚",
        width: 450,
        height: 400,
        image: "./src/image/mowenwei.png",
        position: {
            x: 100,
            y: 2050
        }
    },
    {
        id: "singer8",
        name: "凤凰传奇",
        width: 450,
        height: 450,
        image: "./src/image/fenghuangchuanqi.png",
        position: {
            x: 490,
            y: 1850
        }
    },
    {
        id: "singer9",
        name: "洛天依",
        width: 450,
        height: 450,
        image: "./src/image/luotianyi.png",
        position: {
            x: 820,
            y: 2430
        }
    },
    {
        id: "singer10",
        name: "清响",
        width: 450,
        height: 450,
        image: "./src/image/qingxiang.png",
        position: {
            x: 430,
            y: 2690
        }
    }
];


// 修改图表生成函数,接收尺寸参数
function createSingerGraph(singerId, singerName, width = 800, height = 600, position, centerImage) {
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
        .style("opacity", 0)
        .style("position", "absolute")
        .style("text-align", "center")
        .style("padding", "12px 15px")  // 增加内边距
        .style("font-family", "S7")
        .style("font-size", "14px")     // 增加基础字体
        .style("background", "rgba(255, 255, 255, 0.95)")
        .style("border", "1px solid #ddd")
        .style("border-radius", "6px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 3px 8px rgba(0,0,0,0.12)")
        .style("max-width", "280px")    // 增加最大宽度
        .style("color", "#333")
        .style("text-align", "left")
        .style("line-height", "1.5");

    fetch("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/singer2.json")
        .then(response => response.json())
        .then(data => {
            const singerData = data.find(d => d.singer === singerName);
            if (!singerData) throw new Error(`未找到${singerName}的数据`);

            const maxMatchLyric = Math.max(...singerData.songs.map(s => s.matchlyric_number || 0));
            const minMatchLyric = Math.min(...singerData.songs.map(s => s.matchlyric_number || 0));

            const linkDistanceScale = d3.scaleLinear()
                .domain([minMatchLyric, maxMatchLyric])
                .range([100, 200]);

            const defaultLinkColor = "#8B8386";
            const centerNodeSize = 42;
            const surroundingNodeSize = 25;

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
                        return centerImage;  // 使用传入的中心节点图片
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
                    if (d.group === 1) {
                        // 中心节点交互
                        d3.select(event.currentTarget)
                            .select("image")
                            .transition()
                            .duration(300)
                            .attr("transform", "scale(1.1)")
                            .style("filter", "drop-shadow(0 0 8px rgba(255, 217, 102, 0.8))");  // 添加发光效果
                            
                        tooltip.html(`
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px; text-align: left;">
                                ${d.singer}
                            </div>
                            <div style="height: 1px; background: #ddd; margin: 8px 0"></div>
                            <div style="font-size: 14px; color: #666; text-align: left;">
                                歌曲数量: ${d.songCount}
                            </div>
                        `)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 35) + "px")
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                    } else {
                        // 周边节点交互
                        link
                            .style("stroke", l => 
                                (l.source === d || l.target === d) ? "#FF0000" : defaultLinkColor)
                            .style("stroke-opacity", l => 
                                (l.source === d || l.target === d) ? 1 : 0.6);
                                
                        d3.select(event.currentTarget)
                            .select("image")
                            .transition()
                            .duration(300)
                            .attr("transform", "scale(1.1)")
                            .style("filter", "drop-shadow(0 0 8px rgba(255, 217, 102, 0.8))");
                            
                        tooltip.html(`
                            <div style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 8px; text-align: left">
                                《${d.id}》
                            </div>
                            <div style="height: 1px; background: #ddd; margin: 8px 0"></div>
                            <div style="font-size: 14px; color: #666"; text-align: left;>
                                古诗词引用: ${d.matchlyric_number}
                            </div>
                        `)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 35) + "px")
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                    }
                })
                .on("mouseout", (event, d) => {
                    d3.select(event.currentTarget)
                        .select("image")
                        .transition()
                        .duration(300)
                        .attr("transform", "scale(1)")
                        .style("filter", "none");  // 移除发光效果
                        
                    link
                        .style("stroke", defaultLinkColor)
                        .style("stroke-opacity", 0.6);
                        
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        });
}

// 修改hover事件和样式
const layoutStyles = `
.singer-graph {
    position: absolute;
    padding: 15px;
    overflow: hidden;
}

.node-image {
    transition: transform 0.3s ease;
}

.node-image:hover {
    transform: scale(1.1);
}
`;

// 添加样式到页面
const styleSheet = document.createElement("style");
styleSheet.textContent = layoutStyles;
document.head.appendChild(styleSheet);

// 初始化所有图表
window.onload = function() {
    const container = d3.select("#my_dataviz")
        .style("width", "100vw")
        .style("height", "3500px")
        .style("position", "relative");

    // 使用singers配置初始化图表
    singers.forEach(singer => {
        createSingerGraph(
            singer.id,
            singer.name,
            singer.width,
            singer.height,
            singer.position,
            singer.image  // 传入图片路径
        );
    });
};
