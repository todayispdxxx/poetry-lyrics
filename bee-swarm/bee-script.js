let parsedData = [];

async function fetchAndProcessData(url) {
    try {
        const response = await fetch(url);
        const responseData = await response.json();
        
        // 确保我们使用正确的数据数组
        const jsonData = responseData.data || [];
        console.log('Processing data array length:', jsonData.length);
        
        if (!Array.isArray(jsonData)) {
            throw new Error('Data is not an array');
        }
        
        // Transform the data to match the required format
        parsedData = jsonData
            .filter(row => row && row.comment) // 确保行数据存在且有评论
            .map(row => ({
                comments: parseInt(row.comment) || 0,
                poemtitle: row.poemtitle || '',
                poemwriter: row.poemwriter || '',
                col3: row.cite_type || '',
                col4: row.comment || '',
                col5: row.actual_song || '',
                col6: row.actual_singer || '',
                quote: row.matching_fragments || ''
            }));

        console.log('Parsed data length:', parsedData.length);
        console.log('First parsed item:', parsedData[0]);

        // Use Map for deduplication
        const uniqueData = new Map();
        parsedData.forEach(item => {
            const key = `${item.poemtitle}-${item.poemwriter}-${item.col5}-${item.col6}`;
            if (!uniqueData.has(key)) {
                uniqueData.set(key, item);
            }
        });
        parsedData = Array.from(uniqueData.values());
        console.log('Unique data length:', parsedData.length);

        // 添加数据验证
        if (parsedData.length === 0) {
            throw new Error('No valid data after processing');
        }

        // Cluster the data
        const clusteredData = d3.groups(parsedData, d => `${d.poemtitle}-${d.poemwriter}`)
            .map(([key, values]) => ({
                key: key,
                values: values,
                totalComments: d3.sum(values, d => d.comments)
            }))
            .sort((a, b) => b.totalComments - a.totalComments);

        console.log('Clustered data length:', clusteredData.length);
        console.log('First cluster:', clusteredData[0]);

        parsedData = clusteredData;
        drawChart(clusteredData);
        return clusteredData;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            data: parsedData
        });
        return [];
    }
}

function drawChart(data) {
    if (!data || data.length === 0) {
        console.error('No data available for visualization');
        return;
    }

    const svg = d3.select("svg"),
          height = +svg.attr("height");

    if (!height) {
        console.error('SVG height not set');
        return;
    }

    svg.selectAll("*").remove(); // Clear previous chart

    const x = d3.scaleLinear()
                .domain([0, data.length])
                .range([140, data.length * 350 + 140]);

    svg.attr("width", data.length * 350 + 140);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    const r = d3.scaleSqrt()
                .domain([0, d3.max(data, d => d.totalComments) || 1])
                .range([6, 38]);

    data.forEach((cluster, i) => {
        if (!cluster || !cluster.values) {
            console.warn(`Invalid cluster at index ${i}`, cluster);
            return;
        }

        let clusterRadius = r(cluster.totalComments);
        const clusterGroup = svg.append("g")
            .attr("transform", `translate(${x(i) + clusterRadius}, ${height / 2})`);

        const simulation = d3.forceSimulation(cluster.values)
            .force("x", d3.forceX(0).strength(0.1))
            .force("y", d3.forceY(0).strength(0.1))
            .force("collide", d3.forceCollide(d => r(d.comments) + 2))
            .force("center", d3.forceCenter(0, 0))
            .stop();

        for (let j = 0; j < 300; ++j) simulation.tick();

        clusterGroup.selectAll(".dot")
            .data(cluster.values)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => r(d.comments))
            .on("mouseover", function(event, d) {
                d3.select(this).classed("highlight", true);
                tooltip.style("opacity", 1)
                    .html(`
                        <div class="singer-song">${d.col6} <span class="song">《${d.col5}》</span></div>
                        <div class="quote">${d.quote}</div>
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                svg.append("line")
                    .attr("class", "tooltip-line")
                    .attr("x1", d.x)
                    .attr("y1", d.y)
                    .attr("x2", d.x)
                    .attr("y2", d.y < height / 2 ? d.y - r(d.comments) - 10 : d.y + r(d.comments) + 10)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
            })
            .on("mouseout", function() {
                d3.select(this).classed("highlight", false);
                tooltip.style("opacity", 0);
                svg.selectAll(".tooltip-line").remove();
            });

        clusterGroup.append("text")
            .attr("class", "cluster-label")
            .attr("x", 0)
            .attr("y", 180)
            .text(`《${cluster.values[0].poemtitle}》- ${cluster.values[0].poemwriter}`);
    });

    addKeyboardControl();
}

// 在 drawChart 函数末尾添加键盘控制逻辑
function addKeyboardControl() {
    const chart = document.querySelector('.chart');
    const scrollStep = 50; // 每次滚动的像素数

    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                chart.scrollLeft -= scrollStep;
                e.preventDefault();
                break;
            case 'ArrowRight':
                chart.scrollLeft += scrollStep;
                e.preventDefault();
                break;
        }
    });
}

// 直接调用函数加载数据并生成可视化
fetchAndProcessData('https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/bee-data.json');

// 在初始化完成后调用
document.addEventListener('DOMContentLoaded', () => {
    addKeyboardControl();
});