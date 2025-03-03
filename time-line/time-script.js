let parsedData = [];

    // 使用 XMLHttpRequest 获取表格文件
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/time-data.xlsx', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function() {
        if (xhr.status === 200) {
            const arrayBuffer = xhr.response;
            const workbook = XLSX.read(arrayBuffer, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
            parsedData = json.slice(1).map(row => ({
                date: new Date(row[2]), // 第三列是日期
                comments: +row[3], // 第四列是评论数量
                song: row[4], // 第五列是歌曲名
                singer: row[5] // 第六列是歌手名
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
        } else {
            console.error('无法获取表格文件');
        }
    };

    xhr.send();

function drawChart(data) {
    const svg = d3.select("svg"),
          width = +svg.attr("width") * 1.4, // 将宽度扩大 1.4 倍
          height = +svg.attr("height"),
          margin = { left: 100 }; // 设置右移的距离

    svg.attr("width", width); // 更新 SVG 的宽度
    svg.selectAll("*").remove(); // 清空之前的图表

    svg.attr("transform", `translate(${margin.left}, 0)`); // 应用右移

    // 过滤数据，确保年份在1975到2024之间
    const filteredData = data.filter(d => d.date.getFullYear() >= 1975 && d.date.getFullYear() <= 2024);

    const x = d3.scaleTime()
                .domain([new Date(1975, 0, 1), new Date(2024, 11, 31)])
                .range([0, (width - margin.left)]); // 将 x 轴范围扩大 1.4 倍

    const y = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.comments)])
                .range([height, 0]);

    const r = d3.scaleSqrt()
                .domain([0, d3.max(filteredData, d => d.comments)])
                .range([3, 30]);

    const simulation = d3.forceSimulation(filteredData)
        .force("x", d3.forceX(d => x(d.date)).strength(7)) // 确保数据点严格按照时间标注分布
        .force("y", d3.forceY(height / 2).strength(0.1))
        .force("collide", d3.forceCollide(d => r(d.comments) + 2))
        .stop();

    for (let i = 0; i < 300; ++i) simulation.tick();

    // 创建tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    const dots = svg.selectAll(".dot")
       .data(filteredData)
       .enter().append("circle")
       .attr("class", "dot")
       .attr("cx", width / 2) // 初始位置在图表中心
       .attr("cy", height / 2) // 初始位置在图表中心
       .attr("r", 0) // 初始半径为0
       .on("mouseover", function(event, d) {
            d3.select(this).classed("highlight", true);
            tooltip.style("opacity", 1)
                .html(`
                    <div class="image"></div>
                    <div class="row">
                        <div class="singer">${d.singer}</div>
                        <div class="song">《${d.song}》</div>
                    </div>
                    <div class="row bottom-align">
                        <div class="year">${d.date.getFullYear()}</div>
                        <div class="comments">
                            <img src="comment.png" alt="评论图标" class="comment-icon">
                            ${d.comments}
                        </div>
                    </div>
                `);

            const tooltipHeight = tooltip.node().offsetHeight;
            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipX = event.pageX - tooltipWidth / 2;
            const offset = 150; // 增加的距离
            const tooltipY = event.pageY - tooltipHeight - offset;

            tooltip.style("left", tooltipX + "px")
                   .style("top", tooltipY + "px");

            // 计算连接线的起点，使其从圆的顶端出发
            const lineStartY = d.y - r(d.comments);

            // 绘制竖直连接线
            svg.append("line")
                .attr("class", "tooltip-line")
                .attr("x1", d.x)
                .attr("y1", lineStartY)
                .attr("x2", d.x)
                .attr("y2", tooltipY)
                .attr("stroke", "black")
                .attr("stroke-width", 2); // 变粗

            // 绘制白色三角形
            svg.append("polygon")
                .attr("class", "tooltip-triangle")
                .attr("points", `${d.x - 5},${tooltipY} ${d.x + 5},${tooltipY} ${d.x},${tooltipY - 10}`)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        })
        .on("mouseout", function() {
            d3.select(this).classed("highlight", false);
            tooltip.style("opacity", 0);
            svg.selectAll(".tooltip-line").remove();
            svg.selectAll(".tooltip-triangle").remove();
        });

    // 添加过渡效果
    dots.transition()
        .duration(1000) // 动效持续时间
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => r(d.comments));

    // 添加时间标注
    const decades = d3.range(1980, 2030, 10);
    svg.selectAll(".decade")
       .data(decades)
       .enter().append("text")
       .attr("class", "decade-text")
       .attr("x", d => x(new Date(d, 0, 1)))
       .attr("y", height - 10)
       .attr("text-anchor", "middle")
       .text(d => `${d}s`);

    // 添加小圈和虚线
    svg.selectAll(".circle")
       .data(decades)
       .enter().append("circle")
       .attr("class", "circle")
       .attr("cx", d => x(new Date(d, 0, 1)))
       .attr("cy", height - 50)
       .attr("r", 5);

    svg.selectAll(".dashed-line")
       .data(decades)
       .enter().append("line")
       .attr("class", "dashed-line")
       .attr("x1", d => x(new Date(d, 0, 1)))
       .attr("y1", 0) // 从图表顶部开始
       .attr("x2", d => x(new Date(d, 0, 1)))
       .attr("y2", height - 50); // 延伸到圆圈

    // 添加图片
    const midPoints = decades.slice(0, -1).map((d, i) => (x(new Date(d, 0, 1)) + x(new Date(decades[i + 1], 0, 1))) / 2);
    svg.selectAll(".mid-image")
       .data(midPoints)
       .enter().append("image")
       .attr("class", "mid-image")
       .attr("xlink:href", "array.png")
       .attr("x", d => d - 15) // 图片宽度的一半
       .attr("y", height - 40) // 调整 y 值，使图片与年份对齐
       .attr("width", 30)
       .attr("height", 30);
}
