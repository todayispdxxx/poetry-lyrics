// 定义图表配置数组
const singers = [
    {
        id: "singer1",
        name: "邓丽君",
        width: 380,
        height: 380,
        image: "./src/image/denglijun.png",
        position: {
            x: 180,
            y: 0
        }
    },
    {
        id: "singer2",
        name: "谷建芬",
        width: 380,
        height: 380,
        image: "./src/image/gujianfen.png",
        position: {
            x: 530,
            y: 50
        }
    },
    {
        id: "singer3",
        name: "费玉清",
        width: 380,
        height: 380,
        image: "./src/image/feiyuqing.png",
        position: {
            x: 950,
            y: 440
        }
    },
    {
        id: "singer4",
        name: "戴荃",
        width: 300,
        height: 400,
        image: "./src/image/daiquan.png",
        position: {
            x: 790,
            y: 600
        }
    },
    {
        id: "singer5",
        name: "蒋明",
        width: 350,
        height: 320,
        image: "./src/image/jiangming.png",
        position: {
            x: 450,
            y: 500
        }
    },
    {
        id: "singer7",
        name: "莫文蔚",
        width: 350,
        height: 350,
        image: "./src/image/mowenwei.png",
        position: {
            x: 600,
            y: 1060
        }
    },
    {
        id: "singer8",
        name: "凤凰传奇",
        width: 360,
        height: 380,
        image: "./src/image/fenghuangchuanqi.png",
        position: {
            x: 320,
            y: 1170
        }
    },
    {
        id: "singer6",
        name: "王菲",
        width: 360,
        height: 375,
        image: "./src/image/wangfei.png",
        position: {
            x: 60,
            y: 960
        }
    },
    {
        id: "singer9",
        name: "洛天依",
        width: 380,
        height: 380,
        image: "./src/image/luotianyi.png",
        position: {
            x: 850,
            y: 1600
        }
    },
    {
        id: "singer10",
        name: "清响",
        width: 380,
        height: 380,
        image: "./src/image/qingxiang.png",
        position: {
            x: 460,
            y: 1600
        }
    }
];

// 在全局作用域创建单个共享的tooltip
const globalTooltip = d3.select("body")
    .append("div")
    .attr("class", "d3-global-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("text-align", "left")
    .style("padding", "12px 15px")
    .style("font-family", "S7")
    .style("font-size", "14px")
    .style("background", "rgba(255, 255, 255, 0.98)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "6px")
    .style("pointer-events", "auto") // 允许鼠标与tooltip交互
    .style("box-shadow", "0 3px 12px rgba(0,0,0,0.15)")
    .style("max-width", "350px")
    .style("color", "#333")
    .style("line-height", "1.5")
    .style("z-index", "10000")
    .style("transform-origin", "top left")
    .style("transform", "scale(0.95)")
    .style("opacity", "0")
    .style("will-change", "opacity, transform") // 提高GPU加速
    .style("transition", "opacity 0.2s ease, transform 0.2s ease"); // 加快过渡时间

// 添加全局变量管理tooltip状态
let globalTooltipTimeout;
let isTooltipHovered = false;
let activeNode = null;

// 给全局tooltip添加鼠标事件
globalTooltip
    .on("mouseenter", function() {
        clearTimeout(globalTooltipTimeout);
        isTooltipHovered = true;
    })
    .on("mouseleave", function() {
        isTooltipHovered = false;
        hideGlobalTooltip(200); // 加快隐藏速度
    });

// 改进的全局显示tooltip函数，优化了边界处理
function showGlobalTooltip(event, content, width = 350) {
    // 清除隐藏计时器
    clearTimeout(globalTooltipTimeout);
    
    // 设置内容和宽度
    globalTooltip
        .html(content)
        .style("max-width", `${width}px`)
        .style("opacity", "0") // 先设为不可见以便计算尺寸
        .style("transform", "scale(0.95)"); // 起始缩放状态
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 获取滚动位置
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 计算鼠标相对于视口的位置
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // 计算鼠标相对于页面的位置（包括滚动）
    const pageX = mouseX + scrollX;
    const pageY = mouseY + scrollY;
    
    // 临时设置位置以计算tooltip尺寸
    globalTooltip
        .style("left", "0")
        .style("top", "0")
        .style("visibility", "visible"); // 使元素可见但透明，以便测量
    
    // 强制布局计算，获取tooltip尺寸
    const tooltipNode = globalTooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    
    // 确定最佳显示位置
    let left, top;
    
    // 水平位置计算 - 智能判断左右位置
    const rightSpace = viewportWidth - mouseX; // 鼠标右侧可用空间
    const leftSpace = mouseX; // 鼠标左侧可用空间
    
    if (rightSpace >= tooltipWidth + 20) {
        // 默认：右侧有足够空间，显示在右侧
        left = pageX + 15;
    } else if (leftSpace >= tooltipWidth + 20) {
        // 备选：左侧有足够空间，显示在左侧
        left = pageX - tooltipWidth - 15;
    } else {
        // 两侧都没有足够空间，选择较大的一侧并贴近边缘
        if (rightSpace > leftSpace) {
            left = scrollX + viewportWidth - tooltipWidth - 10;
        } else {
            left = scrollX + 10;
        }
    }
    
    // 垂直位置计算 - 智能判断上下位置
    const bottomSpace = viewportHeight - mouseY; // 鼠标下方可用空间
    const topSpace = mouseY; // 鼠标上方可用空间
    
    if (bottomSpace >= tooltipHeight + 20) {
        // 默认：下方有足够空间，显示在下方偏上
        top = pageY + 10;
    } else if (topSpace >= tooltipHeight + 20) {
        // 备选：上方有足够空间，显示在上方
        top = pageY - tooltipHeight - 10;
    } else {
        // 上下都没有足够空间，选择较大的一侧并调整
        if (bottomSpace > topSpace) {
            // 尽可能利用下方空间，但不超出视口
            top = pageY + 10;
            // 如果需要，设置最大高度来适应可用空间
            let maxHeight = Math.max(bottomSpace - 30, 100); // 至少保留100px高度
            globalTooltip.style("max-height", `${maxHeight}px`);
            globalTooltip.style("overflow-y", "auto");
        } else {
            // 尽可能利用上方空间，但不超出视口
            top = Math.max(scrollY + 10, pageY - tooltipHeight - 10);
            // 如果需要，设置最大高度来适应可用空间
            let maxHeight = Math.max(mouseY - 20, 100); // 至少保留100px高度
            globalTooltip.style("max-height", `${maxHeight}px`);
            globalTooltip.style("overflow-y", "auto");
        }
    }
    
    // 设置最终位置和可见性
    globalTooltip
        .style("left", `${left}px`)
        .style("top", `${top}px`);
    
    // 使用RAF平滑过渡到可见状态
    requestAnimationFrame(() => {
        globalTooltip
            .style("opacity", "1")
            .style("transform", "scale(1)");
    });
}

// 全局隐藏tooltip函数
function hideGlobalTooltip(delay = 200) {
    if (isTooltipHovered) return;
    
    globalTooltipTimeout = setTimeout(() => {
        if (!isTooltipHovered) {
            globalTooltip
                .style("opacity", "0")
                .style("transform", "scale(0.95)");
            activeNode = null;
        }
    }, delay);
}

// 修改图表生成函数，移除边框和背景
function createSingerGraph(singerId, singerName, width = 800, height = 100, position, centerImage) {
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // 移除边框和背景，保留其他样式
    const graphContainer = d3.select("#my_dataviz")
        .append("div")
        .attr("id", singerId)
        .attr("class", "singer-graph-container")
        .style("position", "absolute")
        .style("left", `${position.x}px`)
        .style("top", `${position.y}px`)
        .style("width", `${width}px`)
        .style("height", `${height}px`)
        // 移除了 border 样式
        // 移除了 background 样式
        .style("overflow", "hidden"); // 保留overflow属性以确保内容不溢出

    const svg = graphContainer.append("svg")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    fetch("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/new_singer.json")
        .then(response => response.json())
        .then(data => {
            const singerData = data.find(d => d.singer === singerName);
            if (!singerData) throw new Error(`未找到${singerName}的数据`);

            const maxMatchLyric = Math.max(...singerData.songs.map(s => s.matchlyric_number || 0));
            const minMatchLyric = Math.min(...singerData.songs.map(s => s.matchlyric_number || 0));

            const linkDistanceScale = d3.scaleLinear()
                .domain([minMatchLyric, maxMatchLyric])
                .range([65, 140]);

            const defaultLinkColor = "#8B8386";
            const centerNodeSize = 36;
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

            // 修改nodeGroup的事件处理部分，进一步优化性能和流畅度
            nodeGroup
                .on("mouseover", function(event, d) { 
                    event.stopPropagation();
                    activeNode = d;
                    
                    // 获取当前节点和图像
                    const currentNode = d3.select(this);
                    const nodeImage = currentNode.select("image");
                    
                    // 简化滤镜ID生成
                    const uniqueId = `filter-${singerId}-${d.id.replace(/\s+/g, '-')}`;
                    
                    // 优化滤镜处理
                    if (!svg.select(`#${uniqueId}`).empty()) {
                        // 如果滤镜已存在，直接使用
                        nodeImage.style("filter", `url(#${uniqueId})`);
                    } else {
                        // 如果滤镜不存在，才创建新滤镜
                        const defs = svg.append("defs");
                        const filter = defs.append("filter")
                            .attr("id", uniqueId)
                            .attr("x", "-40%")
                            .attr("y", "-40%")
                            .attr("width", "180%")
                            .attr("height", "180%");
                        
                        // 简化滤镜效果，使用更高性能的配置
                        filter.append("feDropShadow")
                            .attr("dx", "0")
                            .attr("dy", "0")
                            .attr("stdDeviation", "4") // 减小模糊半径，提高性能
                            .attr("flood-color", d.group === 1 ? "#FFD700" : "#FFEE58")
                            .attr("flood-opacity", "0.75"); // 略微降低不透明度
                            
                        nodeImage.style("filter", `url(#${uniqueId})`);
                    }
                    
                    // 适当推迟变换应用，确保GPU可以正确处理
                    requestAnimationFrame(() => {
                        nodeImage
                            .transition()
                            .duration(100) // 进一步缩短时间，减少感知延迟
                            .ease(d3.easeCubicOut)
                            .attr("transform", d.group === 1 ? "scale(1.08)" : "scale(1.16)");
                    });
                    
                    // 节点特定的交互
                    if (d.group !== 1) {
                        // 高亮连接线，改为纯红色 (#FF0000)
                        link
                            .style("stroke", l => 
                                (l.source === d || l.target === d) ? "#FF0000" : defaultLinkColor) // 改为纯红色
                            .style("stroke-opacity", l => 
                                (l.source === d || l.target === d) ? 0.85 : 0.5)
                            .style("stroke-width", l => 
                                (l.source === d || l.target === d) ? 
                                (1 + (l.matchlyric_number / maxMatchLyric) * 2.5) : 
                                (1 + (l.matchlyric_number / maxMatchLyric) * 2));
                        
                        // 优化连线过渡动画
                        link
                            .transition()
                            .duration(100) // 加快线条过渡
                            .ease(d3.easeQuadOut);
                    }
                    
                    // Tooltip内容处理不变
                    if (d.group === 1) {
                        const content = `
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px; text-align: left;">
                                ${d.singer}
                            </div>
                            <div style="height: 1px; background: #ddd; margin: 8px 0"></div>
                            <div style="display: flex; justify-content: space-between;">
                                <div style="font-size: 16px; color: #666; text-align: left;">
                                    歌曲数量: <b>${d.songCount}</b>
                                </div>
                            </div>
                        `;
                        
                        showGlobalTooltip(event, content, 280);
                    } else {
                        // 歌曲节点tooltip
                        const songData = singerData.songs.find(s => s.song === d.id);
                        if (!songData) return;
                        
                        // 构建tooltip内容
                        let tooltipContent = `
                            <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                <span>《${d.id}》</span>
                                <span style="font-size: 14px; font-weight: normal; color: #888; padding: 3px 8px; background: #f8f8f8; border-radius: 12px;">引用字数: ${d.matchlyric_number}</span>
                            </div>`;
                            
                        // 添加引用片段
                        if (songData.matching_fragments) {
                            tooltipContent += `
                                <div style="margin: 12px 0;">
                                    <div style="font-size: 14px; line-height: 1.6; color: #555; background: #f9f9f9; padding: 10px 12px; border-radius: 6px;">
                                        ${songData.matching_fragments}
                                    </div>
                                </div>`;
                        }
                        
                        // 古诗词引用
                        if (songData.poem_matches && songData.poem_matches.length > 0) {
                            tooltipContent += `
                                <div style="margin: 12px 0;">
                                    <div style="max-height: 180px; overflow-y: auto;">`;
                                    
                            songData.poem_matches.forEach((poem, index) => {
                                tooltipContent += `
                                    <div style="padding: 10px 0; ${index > 0 ? 'border-top: 1px dashed #eee;' : ''}">
                                        <div style="margin-bottom: 5px;">
                                            <span style="font-size: 15px; font-weight: 500; color: #333;">《${poem.title}》</span>
                                            <span style="font-size: 13px; color: #777; font-style: italic; margin-left: 5px;">
                                                ${poem.writer || '佚名'}
                                            </span>
                                        </div>
                                    </div>`;
                            });
                            
                            tooltipContent += `
                                    </div>
                                </div>`;
                        }
                        
                        showGlobalTooltip(event, tooltipContent, 350);
                    }
                })
                .on("mouseout", function(event, d) {
                    // 保留滤镜定义，仅清除应用
                    // svg.selectAll("defs").remove(); // 注释掉这一行，不再每次都删除滤镜
                    
                    // 恢复节点样式
                    d3.select(this)
                        .select("image")
                        .style("filter", null) // 移除滤镜引用
                        .transition()
                        .duration(150) // 稍微缩短退出动画
                        .ease(d3.easeCubicInOut)
                        .attr("transform", "scale(1)");
                    
                    // 恢复连接线样式，优化过渡
                    link
                        .transition()
                        .duration(150) // 缩短过渡时间
                        .ease(d3.easeQuadInOut)
                        .style("stroke", defaultLinkColor)
                        .style("stroke-opacity", 0.6)
                        .style("stroke-width", d => 1 + (d.matchlyric_number / maxMatchLyric) * 2);
                    
                    // 延迟隐藏tooltip
                    hideGlobalTooltip(150);
                });
        })
        .catch(error => console.error(`加载${singerName}数据失败:`, error));
}

// 在文档中添加点击事件，点击空白处关闭tooltip
document.addEventListener("click", function(event) {
    const tooltipNode = globalTooltip.node();
    
    // 如果点击的不是tooltip或当前活动节点
    if (tooltipNode && 
        !tooltipNode.contains(event.target) && 
        (!activeNode || !event.target.closest(".node-group"))) {
        
        globalTooltip
            .style("opacity", "0")
            .style("transform", "scale(0.95)");
        
        isTooltipHovered = false;
        activeNode = null;
    }
});

// 防抖函数，减少频繁事件的触发
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 在页面滚动时隐藏tooltip，避免tooltip位置错误
window.addEventListener("scroll", debounce(() => {
    if (globalTooltip) {
        globalTooltip
            .style("opacity", "0")
            .style("transform", "scale(0.95)");
        
        isTooltipHovered = false;
        activeNode = null;
    }
}, 100));

// 修改hover事件和样式，移除边框相关样式
const layoutStyles = `
.singer-graph {
    position: absolute;
    padding: 15px;
    overflow: hidden;
}

.singer-graph-container {
    transition: transform 0.3s ease; /* 只保留transform过渡效果 */
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
        .style("height", "2300px")
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
