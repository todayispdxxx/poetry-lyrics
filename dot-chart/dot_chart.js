// 将脚本封装到一个立即执行函数中，避免全局变量污染
(function() {
    const CIRCLE_PER_ROW = 50;
    const COLOR_MAP = {
        3: '#1CCEAC',
        2: '#FFD363',
        1: '#FD8C90'
    };
    
    const LABEL_MAP = {
        '5': '5个字',
        '6': '6个字',
        '7': '7个字', 
        '8': '8个字',
        '9': '9个字',
        '10': '10个字',
        '10-20': '11~20个字',
        '20-30': '21~30个字',
        '30-50': '31~50个字',
        '50-100': '51~100个字',
        '100以上': '100个字以上'
    };
    
  
    // 页面加载完成后自动获取数据
    document.addEventListener('DOMContentLoaded', function() {
        console.log('文档加载完成，准备加载数据');
        
        // 确保存在图表容器
        if (!document.getElementById('chartContainer')) {
            console.log('创建图表容器');
            const container = document.createElement('div');
            container.id = 'chartContainer';
            document.body.appendChild(container);
        }
        
        // 直接加载远程数据
        loadDataFromURL();
    });
    
    // 从URL加载JSON数据
    async function loadDataFromURL() {
        console.log('开始从URL加载数据');
        const dataUrl = 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/dot-data.json';
        try {
            const response = await fetch(dataUrl);
            if (!response.ok) {
                throw new Error(`网络错误: ${response.status}`);
            }
            const jsonData = await response.json();
            console.log(`成功从URL加载数据，共有${jsonData.length}条记录`);
            
            // 处理并可视化数据
            const ranges = processData(jsonData);
            renderVisualization(ranges);
        } catch (error) {
            console.error('加载数据出错:', error);
            alert(`无法从URL加载数据: ${error.message}`);
        }
    }
    
    // 修改数据处理函数，保留更多原始数据
    function processData(jsonData) {
        let rawData;
        
        // 检查数据格式，处理新的JSON格式
        if (Array.isArray(jsonData) && jsonData.length > 0 && 'cite_type' in jsonData[0]) {
            console.log('处理新JSON格式数据');
            // 新的JSON格式，保留更多字段用于提示框
            rawData = jsonData.map(item => ({
                colorCode: item.cite_type,
                value: item.fragment_number,
                matchlyric_number: item.matchlyric_number || 0,
                actual_song: item.actual_song || '未知',
                actual_singer: item.actual_singer || '未知',
                note: item.note || '无',
                poemtitle: item.poemtitle || '未知',
                poemwriter: item.poemwriter || '未知'
            })).filter(data => 
                data.colorCode !== null && 
                data.value !== null && 
                [1, 2, 3].includes(data.colorCode) && 
                typeof data.value === 'number'
            );
        } else {
            console.log('处理Excel转换格式数据');
            // 原始Excel转换的格式
            rawData = jsonData
                .filter(row => row && row.length >= 14)
                .map(row => ({
                    colorCode: row[11] ?? null,
                    value: row[13] ?? null,
                    // 其他字段如果在旧格式中存在，也可以添加
                    matchlyric_number: 0,
                    actual_song: '未知',
                    actual_singer: '未知',
                    note: '无'
                }))
                .filter(data => 
                    data.colorCode !== null &&
                    data.value !== null &&
                    [1, 2, 3].includes(data.colorCode) && 
                    typeof data.value === 'number'
                );
        }
    
        console.log(`处理后的有效数据条数: ${rawData.length}`);
    
        // 对数据进行分类
        const ranges = {
            '5': [], '6': [], '7': [], '8': [], '9': [], '10': [], 
            '10-20': [],'20-30': [], '30-50': [], '50-100': [], '100以上': []
        };
    
        rawData.forEach(data => {
            const value = data.value;
            let key;
    
            if (value === 5) key = '5';
            else if (value === 6) key = '6';
            else if (value === 7) key = '7';
            else if (value === 8) key = '8';
            else if (value === 9) key = '9';
            else if (value === 10) key = '10';
            else if (value >= 11 && value <= 20) key = '10-20';
            else if (value >= 21 && value <= 30) key = '20-30';
            else if (value > 30 && value <= 50) key = '30-50';
            else if (value > 50 && value <= 100) key = '50-100';
            else if (value > 100) key = '100以上';
            else return;
    
            ranges[key].push(data);
        });
    
        // 对每个范围内的数据按照颜色代码排序
        Object.values(ranges).forEach(data => data.sort((a, b) => b.colorCode - a.colorCode));
        
        // 输出分类后的数据统计
        Object.entries(ranges).forEach(([key, value]) => {
            console.log(`${LABEL_MAP[key]}: ${value.length}条数据`);
        });
        
        return ranges;
    }
    
    // 修改渲染函数，添加提示框功能
    function renderVisualization(ranges) {
        console.log('开始渲染可视化图表');
        
        // 创建提示框元素
        let tooltip = document.createElement('div');
        tooltip.className = 'dot-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.visibility = 'hidden';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.zIndex = '99999'; // 更高的z-index确保在其他元素之上
        tooltip.style.pointerEvents = 'none';
        tooltip.style.maxWidth = '300px';
        tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(tooltip);
        
        const container = document.getElementById('chartContainer');
        if (!container) {
            console.error('找不到图表容器元素!');
            return;
        }
        
        container.innerHTML = '';
    
        // 添加图例
        const legend = document.createElement('div');
        legend.className = 'legend';
        legend.innerHTML = `
            <div class="legend-item" data-color-code="3">
                <span class="legend-color" style="background-color: ${COLOR_MAP[3]}"></span>碎片引用
            </div>
            <div class="legend-item" data-color-code="2">
                <span class="legend-color" style="background-color: ${COLOR_MAP[2]}"></span>金句镶嵌
            </div>
            <div class="legend-item" data-color-code="1">
                <span class="legend-color" style="background-color: ${COLOR_MAP[1]}"></span>整首复刻
            </div>
        `;
    
        // 图例交互逻辑
        legend.querySelectorAll('.legend-item').forEach(legendItem => {
            const colorCode = legendItem.dataset.colorCode;
            const legendColor = legendItem.querySelector('.legend-color');
    
            legendColor.addEventListener('mouseenter', () => {
                document.querySelectorAll('.circle').forEach(circle => {
                    if (circle.dataset.colorCode !== colorCode) {
                        circle.classList.add('dimmed');
                    }
                });
            });
    
    
            legendColor.addEventListener('mouseleave', function() {
                document.querySelectorAll('.circle').forEach(circle => {
                    circle.classList.remove('dimmed');
                });
            });
        });
    
        container.appendChild(legend);
    
        const order = ['5', '6', '7', '8', '9', '10', '10-20','20-30', '30-50', '50-100', '100以上'];
        
        order.forEach(labelKey => {
            // 修复问题：添加防御性编程，确保dataPoints是一个数组
            const dataPoints = ranges[labelKey] || [];
            console.log(`${labelKey} 类别的数据点数: ${dataPoints.length}`);
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
    
            // 添加标签
            const labelDiv = document.createElement('div');
            labelDiv.className = 'label';
            labelDiv.textContent = LABEL_MAP[labelKey] || labelKey;
            categoryDiv.appendChild(labelDiv);
    
            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = 'circles-wrapper';
    
            // 强制生成完整行
            const totalRows = Math.ceil(Math.max(dataPoints.length, 1) / CIRCLE_PER_ROW);
            
            for (let row = 0; row < totalRows; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'circle-row';
                
                // 始终生成50个位置
                for (let i = 0; i < CIRCLE_PER_ROW; i++) {
                    const dataIndex = row * CIRCLE_PER_ROW + i;
                    const circle = document.createElement('div');
                    circle.className = 'circle';
                    
                    // 明确设置圆点尺寸和样式，确保可见
                    circle.style.width = '12px';
                    circle.style.height = '12px';
                    circle.style.borderRadius = '50%';
                    circle.style.display = 'inline-block';
                    circle.style.margin = '0 3px 3px 0';
                   
                    if (dataIndex < dataPoints.length) {
                        const data = dataPoints[dataIndex];
                        circle.style.backgroundColor = COLOR_MAP[data.colorCode];
                        circle.dataset.colorCode = data.colorCode;
                        
                        // 添加数据属性用于提示框
                        circle.dataset.matchlyricNumber = data.matchlyric_number;
                        circle.dataset.actualSong = data.actual_song;
                        circle.dataset.actualSinger = data.actual_singer;
                        circle.dataset.note = data.note;
                        circle.dataset.poemtitle = data.poemtitle;
                        circle.dataset.poemwriter = data.poemwriter;
                        
                        // 添加鼠标悬浮事件
                        circle.addEventListener('mouseenter', (e) => {
                            const songInfo = data.actual_song && data.actual_song !== '未知' ? 
                                `<b>歌曲:</b> ${data.actual_song}` : '';
                            const singerInfo = data.actual_singer && data.actual_singer !== '未知' ? 
                                `<b>歌手:</b> ${data.actual_singer}` : '';
                            
                            // 使用fragment_number代替matchlyric_number
                            const fragmentInfo = data.value ? 
                                `<b>引用字数:</b> ${data.value}` : '';
                            
                            const noteInfo = data.note && data.note !== '无' ? 
                                `<b>备注:</b> ${data.note}` : '';
                            const poemInfo = data.poemtitle && data.poemtitle !== '未知' ? 
                                `<b>诗词:</b> ${data.poemtitle} ${data.poemwriter && data.poemwriter !== '未知' ? `(${data.poemwriter})` : ''}` : '';
                            
                            // 构建提示框内容
                            tooltip.innerHTML = [songInfo, singerInfo, fragmentInfo, poemInfo, noteInfo]
                                .filter(item => item !== '')
                                .join('<br>');
                                
                            // 优化的提示框定位 - 确保显示在数据点上方
                            const rect = e.target.getBoundingClientRect();
                            
                            // 首先设置为可见但位置远离，以便获取tooltip尺寸
                            tooltip.style.visibility = 'visible';
                            tooltip.style.left = '-9999px';
                            tooltip.style.top = '-9999px';
                            
                            // 等待浏览器渲染以获取实际尺寸
                            setTimeout(() => {
                                const tooltipHeight = tooltip.offsetHeight;
                                const spacing = 10; // 提示框与数据点之间的间距
                                
                                // 确保提示框在数据点正上方，且不遮挡它
                                tooltip.style.left = `${rect.left + rect.width/2}px`;
                                tooltip.style.top = `${rect.top - tooltipHeight - spacing}px`;
                                tooltip.style.transform = 'translateX(-50%)';
                                
                                // 添加小三角形指示器，指向数据点
                                tooltip.style.setProperty('--arrow-left', '50%');
                                tooltip.style.setProperty('--arrow-top', '100%');
                            }, 0);
                        });
                        
                        circle.addEventListener('mouseleave', () => {
                            tooltip.style.visibility = 'hidden';
                        });
                    } else {
                        circle.style.visibility = 'hidden'; // 空白占位
                    }
                    
                    rowDiv.appendChild(circle);
                }
                wrapperDiv.appendChild(rowDiv);
            }
       
            categoryDiv.appendChild(wrapperDiv);
            container.appendChild(categoryDiv);
        });
        
        console.log('图表渲染完成');
    }

    // 在文档中添加一次性CSS样式，为提示框添加箭头指示器
    if (!document.getElementById('tooltip-arrow-style')) {
        const arrowStyle = document.createElement('style');
        arrowStyle.id = 'tooltip-arrow-style';
        arrowStyle.textContent = `
            .dot-tooltip::after {
                content: '';
                position: absolute;
                left: var(--arrow-left, 50%);
                top: var(--arrow-top, 100%);
                transform: translateX(-50%);
                border-width: 5px;
                border-style: solid;
                border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
            }
        `;
        document.head.appendChild(arrowStyle);
    }
})();
