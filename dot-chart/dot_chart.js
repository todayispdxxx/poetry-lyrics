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
    // 直接加载远程数据，不需要文件上传功能
    loadDataFromURL();
});

// 从URL加载JSON数据
async function loadDataFromURL() {
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

// 修改后的数据处理函数，处理两种数据格式
function processData(jsonData) {
    let rawData;
    
    // 检查数据格式，处理新的JSON格式
    if (Array.isArray(jsonData) && jsonData.length > 0 && 'cite_type' in jsonData[0]) {
        console.log('处理新JSON格式数据');
        // 新的JSON格式
        rawData = jsonData.map(item => ({
            colorCode: item.cite_type,
            value: item.fragment_number
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
                value: row[13] ?? null
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

// 渲染函数保持不变
function renderVisualization(ranges) {
    const container = document.getElementById('chartContainer');
    if (!container) {
        console.error('找不到图表容器元素!');
        return;
    }
    
    container.innerHTML = '';

    // 添加图例
    const legend = document.createElement('div');
    legend.className = 'legend';
        // 修改图例生成逻辑
     legend.innerHTML = `
            <div class="legend-item" data-color-code="3">
                  <span class="legend-color" style="background-color: ${COLOR_MAP[3]}"></span>引用几个字
            </div>
            <div class="legend-item" data-color-code="2">
                  <span class="legend-color" style="background-color: ${COLOR_MAP[2]}"></span>引用完整句子
            </div>
            <div class="legend-item" data-color-code="1">
                   <span class="legend-color" style="background-color: ${COLOR_MAP[1]}"></span>引用整首古诗
            </div>
       `;

// 修改图例交互逻辑
legend.querySelectorAll('.legend-item').forEach(legendItem => {
const colorCode = legendItem.dataset.colorCode;
const legendColor = legendItem.querySelector('.legend-color');

legendColor.addEventListener('mouseenter', () => {
    document.querySelectorAll('.circle').forEach(circle => {
        // 使用dataset进行精确匹配
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
        const dataPoints = ranges[labelKey];
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';

        // 添加标签
        const labelDiv = document.createElement('div');
        labelDiv.className = 'label';
        labelDiv.textContent = LABEL_MAP[labelKey];
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
               
                
                if (dataIndex < dataPoints.length) {
                    circle.style.backgroundColor = COLOR_MAP[dataPoints[dataIndex].colorCode];
                    circle.dataset.colorCode = dataPoints[dataIndex].colorCode;
                    // 移除title属性，这样就不会显示tooltip
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
}
