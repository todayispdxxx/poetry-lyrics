// 使用IIFE隔离作用域，防止全局变量泄漏
(function() {
    // 创建更具体的命名空间，避免类名冲突
    const BEE_NS = {
        svgId: "bee-chart-svg",
        dotClass: "bee-dot", 
        tooltipClass: "bee-tooltip", 
        containerClass: "bee-chart", 
        lineClass: "bee-tooltip-line", 
        highlightClass: "bee-highlight" 
    };

    // 将函数变量都限定在IIFE内部
    let beeChartData = [];
    let beeChartSvg = null;
    let beeTooltip = null;

    // 重写fetchAndProcessData函数，确保它不会影响其他脚本
    async function fetchAndProcessData(url) {
        try {
            const response = await fetch(url);
            const responseData = await response.json();
            
            // 确保使用正确的数据数组
            const jsonData = responseData.data || [];
            console.log('Bee chart: Processing data array length:', jsonData.length);
            
            if (!Array.isArray(jsonData)) {
                throw new Error('Bee chart: Data is not an array');
            }
            
            // 转换数据，注意避免与time-script.js中的转换冲突
            beeChartData = jsonData
                .filter(row => row && row.comment) 
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

            // 使用Map进行数据去重
            const uniqueData = new Map();
            beeChartData.forEach(item => {
                // 使用更特定的键来避免与time-script.js中的去重冲突
                const key = `bee-${item.poemtitle}-${item.poemwriter}-${item.col5}-${item.col6}`;
                if (!uniqueData.has(key)) {
                    uniqueData.set(key, item);
                }
            });
            beeChartData = Array.from(uniqueData.values());
            
            // 数据验证
            if (beeChartData.length === 0) {
                throw new Error('Bee chart: No valid data after processing');
            }

            // 特定于蜂群图的数据分组
            const clusteredData = d3.groups(beeChartData, d => `${d.poemtitle}-${d.poemwriter}`)
                .map(([key, values]) => ({
                    key: key,
                    values: values,
                    totalComments: d3.sum(values, d => d.comments)
                }))
                .sort((a, b) => b.totalComments - a.totalComments);

            // 绘制图表
            drawBeeChart(clusteredData);
            return clusteredData;
        } catch (error) {
            console.error('Bee chart error:', {
                message: error.message,
                stack: error.stack,
                data: beeChartData
            });
            return [];
        }
    }

    // 重命名函数以避免命名冲突
    function drawBeeChart(data) {
        if (!data || data.length === 0) {
            console.error('Bee chart: No data available for visualization');
            return;
        }

        // 特定选择SVG元素，避免与time-script.js冲突
        const beeChartContainer = document.querySelector('.bee-chart');
        if (!beeChartContainer) {
            console.error('Bee chart: Container not found');
            return;
        }
        
        // 确保我们操作正确的SVG
        const svg = d3.select(beeChartContainer).select("svg");
        if (svg.empty()) {
            console.error('Bee chart: SVG element not found');
            return;
        }
        
        const height = +svg.attr("height");
        if (!height) {
            console.error('Bee chart: SVG height not set');
            return;
        }

        // 清除之前的图表
        svg.selectAll("*").remove();

        // 设置坐标轴
        const x = d3.scaleLinear()
                    .domain([0, data.length])
                    .range([140, data.length * 350 + 140]);

        svg.attr("width", data.length * 350 + 140);

        // 创建特定于蜂群图的tooltip，避免与time-script.js冲突
        // 首先检查是否已存在
        d3.selectAll(".bee-tooltip").remove(); // 移除旧的tooltip
        
        const tooltip = d3.select("body").append("div")
            .attr("class", "bee-tooltip") // 使用特定的类名
            .style("opacity", 0);
        
        beeTooltip = tooltip; // 保存引用以便后续使用

        // 创建比例尺
        const r = d3.scaleSqrt()
                    .domain([0, d3.max(data, d => d.totalComments) || 1])
                    .range([6, 38]);

        data.forEach((cluster, i) => {
            if (!cluster || !Array.isArray(cluster.values) || cluster.values.length === 0) {
                console.warn(`Bee chart: Invalid cluster at index ${i}`, cluster);
                return;
            }

            let clusterRadius = r(cluster.totalComments);
            const clusterGroup = svg.append("g")
                .attr("transform", `translate(${x(i) + clusterRadius}, ${height / 2})`);

            // 设置力模拟
            const simulation = d3.forceSimulation(cluster.values)
                .force("x", d3.forceX(0).strength(0.1))
                .force("y", d3.forceY(0).strength(0.1))
                .force("collide", d3.forceCollide(d => r(d.comments) + 2))
                .force("center", d3.forceCenter(0, 0))
                .stop();

            for (let j = 0; j < 300; ++j) simulation.tick();

            // 绘制气泡点
            clusterGroup.selectAll(".bee-dot") 
                .data(cluster.values)
                .enter().append("circle")
                .attr("class", "bee-dot") 
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => r(d.comments))
                .attr("fill", "#8994DC")
                .attr("opacity", 1)
                .on("mouseover", function(event, d) {
                    d3.select(this).classed("bee-highlight", true) 
                                  .attr("fill", "#ff6600")
                                  .attr("opacity", 1);
                    
                    beeTooltip.style("opacity", 1)
                        .html(`
                            <div class="singer-song">${d.col6} <span class="song">《${d.col5}》</span></div>
                            <div class="quote">${d.quote}</div>
                        `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");

                    svg.append("line")
                        .attr("class", "bee-tooltip-line") 
                        .attr("x1", event.pageX - x(i) - clusterRadius + d.x)
                        .attr("y1", d.y)
                        .attr("x2", event.pageX - x(i) - clusterRadius + d.x)
                        .attr("y2", d.y < height / 2 ? d.y - r(d.comments) - 10 : d.y + r(d.comments) + 10)
                        .attr("stroke", "black")
                        .attr("stroke-width", 1);
                })
                .on("mouseout", function() {
                    d3.select(this).classed("bee-highlight", false) 
                                  .attr("fill", "#8994DC")
                                  .attr("opacity", 1);
                    
                    beeTooltip.style("opacity", 0);
                    svg.selectAll(".bee-tooltip-line").remove(); 
                });

            // 添加集群标签
            clusterGroup.append("text")
                .attr("class", "bee-cluster-label") 
                .attr("x", 0)
                .attr("y", 160)
                .style("text-anchor", "middle")
                .selectAll("tspan")
                .data([
                    { text: `《${cluster.values[0].poemtitle}》`, type: 'title' },
                    { text: cluster.values[0].poemwriter, type: 'author' }
                ])
                .join("tspan")
                .attr("x", 0)
                .attr("dy", (d, i) => i === 0 ? 0 : "1.5em")
                .attr("class", d => `bee-${d.type}`) 
                .text(d => d.text);
        });

        // 样式已移至bee-style.css，此函数不再需要添加样式
    }

    // 修改键盘和触摸控制功能
    function addBeeChartControls() {
        const chart = document.querySelector('.bee-chart');
        if (!chart) return;
        
        // 移除之前可能存在的事件监听器，避免重复
        document.removeEventListener('keydown', handleBeeChartKeyDown);
        chart.removeEventListener('touchstart', handleTouchStart);
        chart.removeEventListener('touchmove', handleTouchMove);
        chart.removeEventListener('touchend', handleTouchEnd);
        chart.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // 添加键盘事件监听器
        document.addEventListener('keydown', handleBeeChartKeyDown);
        
        // 添加触摸事件监听器
        chart.addEventListener('touchstart', handleTouchStart, { passive: false });
        chart.addEventListener('touchmove', handleTouchMove, { passive: false });
        chart.addEventListener('touchend', handleTouchEnd);
        
        // 添加鼠标拖动事件监听器
        chart.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // 触摸相关变量
        let touchStartX = 0;
        let touchStartScrollLeft = 0;
        
        // 鼠标拖动相关变量
        let isDragging = false;
        let mouseStartX = 0;
        let mouseStartScrollLeft = 0;
        
        // 触摸开始事件处理
        function handleTouchStart(e) {
            touchStartX = e.touches[0].clientX;
            touchStartScrollLeft = chart.scrollLeft;
            e.preventDefault(); // 防止页面滚动
        }
        
        // 触摸移动事件处理
        function handleTouchMove(e) {
            if (!touchStartX) return;
            
            const touchCurrentX = e.touches[0].clientX;
            const touchDiff = touchStartX - touchCurrentX;
            
            // 设置滚动位置
            chart.scrollLeft = touchStartScrollLeft + touchDiff;
            e.preventDefault(); // 防止页面滚动
        }
        
        // 触摸结束事件处理
        function handleTouchEnd() {
            touchStartX = 0;
        }
        
        // 鼠标按下事件处理
        function handleMouseDown(e) {
            isDragging = true;
            mouseStartX = e.clientX;
            mouseStartScrollLeft = chart.scrollLeft;
            
            // 更改光标样式以指示拖动
            chart.style.cursor = 'grabbing';
            chart.style.userSelect = 'none';
            
            // 防止默认行为，如文本选择
            e.preventDefault();
        }
        
        // 鼠标移动事件处理
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            const mouseDiff = mouseStartX - e.clientX;
            chart.scrollLeft = mouseStartScrollLeft + mouseDiff;
            
            // 防止默认行为，如文本选择
            e.preventDefault();
        }
        
        // 鼠标释放事件处理
        function handleMouseUp() {
            isDragging = false;
            
            // 恢复光标样式
            const chart = document.querySelector('.bee-chart');
            if (chart) {
                chart.style.cursor = 'grab';
                chart.style.userSelect = '';
            }
        }
    }

    // 键盘事件处理函数保持不变
    function handleBeeChartKeyDown(e) {
        const chart = document.querySelector('.bee-chart');
        if (!chart) return;
        
        const scrollStep = 50;
        
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
    }

    // 修改初始化函数，确保容器可滚动
    function initBeeChart() {
        // 处理HTML容器和SVG
        const container = document.querySelector('.chart');
        if (!container) {
            console.error('Bee chart: Container not found');
            return;
        }
        
        // 修改container类名以避免冲突
        container.classList.add('bee-chart');
        
        // 强制设置高度并确保容器可以水平滚动
        container.style.height = "450px";
        container.style.overflowY = "hidden"; // 禁用垂直滚动
        container.style.webkitOverflowScrolling = "touch"; // 为iOS设备提供平滑滚动
        container.style.cursor = "grab"; // 添加抓取光标，表明可拖动
        
        // 检查SVG
        let svg = container.querySelector('svg');
        if (!svg) {
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "1000");
            svg.setAttribute("height", "400"); // 与容器相同高度
            container.appendChild(svg);
        }
        
        // 设置标识，避免重复初始化
        svg.setAttribute('data-bee-initialized', 'true');
        
        // 启动数据获取和可视化
        fetchAndProcessData('https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/bee-data.json');
        
        // 添加键盘和触摸控制
        addBeeChartControls();
    }

    // 在DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBeeChart);
    } else {
        // 如果DOM已加载，直接初始化
        initBeeChart();
    }
})();
