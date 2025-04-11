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

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 保留文件输入功能（可选）
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFile);
    }
    
    // 从GitHub加载JSON文件
    loadJsonFromGitHub();
});

// 从GitHub加载JSON文件
async function loadJsonFromGitHub() {
    try {
        const jsonUrl = 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/dot-data.json';
        const response = await fetch(jsonUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log("加载的JSON数据:", jsonData);
        
        if (!jsonData) {
            throw new Error('JSON文件为空');
        }
        
        // 确保我们使用正确的数据结构
        const dataToProcess = jsonData.data || jsonData;
        
        if (!dataToProcess || dataToProcess.length === 0) {
            throw new Error('没有找到有效的数据');
        }
        
        console.log("处理的数据条目数:", dataToProcess.length);
        
        // 检查前几个数据项的结构
        console.log("数据样本:", dataToProcess.slice(0, 3));
        
        const ranges = processData(dataToProcess);
        renderVisualization(ranges);
        
    } catch (error) {
        console.error('加载JSON文件失败:', error);
        // 出现错误时显示错误信息
        const container = document.getElementById('chartContainer');
        if (container) {
            container.innerHTML = `<div class="error-message">加载数据失败: ${error.message}</div>`;
        }
    }
}

// 处理文件上传
async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const jsonData = await readJsonFile(file);
        const dataToProcess = jsonData.data || jsonData;
        const ranges = processData(dataToProcess);
        renderVisualization(ranges);
    } catch (error) {
        alert(`处理文件时出错: ${error.message}`);
    }
}

// 读取JSON文件
function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

// 处理从JSON读取的数据 - 修复后的版本
function processData(jsonData) {
    if (!Array.isArray(jsonData)) {
        console.error("processData: 预期数据为数组，但收到:", typeof jsonData);
        return categorizeData([]);
    }
    
    // 从数据中提取必要的字段
    const rawData = jsonData.map(item => {
        // 直接使用字符串类型的cite_type和fragment_number
        let colorCode = null;
        let value = null;
        
        if (item) {
            // 将cite_type转换为数字
            if (item.cite_type !== undefined) {
                colorCode = parseInt(item.cite_type);
            }
            
            // 将fragment_number转换为数字
            if (item.fragment_number !== undefined) {
                value = parseInt(item.fragment_number);
            }
        }
        
        return { colorCode, value };
    }).filter(data => 
        data.colorCode !== null && 
        data.value !== null && 
        [1, 2, 3].includes(data.colorCode)
    );
    
    console.log("处理后的有效数据条目数:", rawData.length);
    if (rawData.length > 0) {
        console.log("处理后的数据样本:", rawData.slice(0, 3));
    }
    
    return categorizeData(rawData);
}

// 将数据分类到不同的范围
function categorizeData(rawData) {
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
        else if (value > 10 && value <= 20) key = '10-20';
        else if (value > 20 && value <= 30) key = '20-30';
        else if (value > 30 && value <= 50) key = '30-50';
        else if (value > 50 && value <= 100) key = '50-100';
        else if (value > 100) key = '100以上';
        else return;

        ranges[key].push(data);
    });

    // 输出分类后的数据数量
    Object.entries(ranges).forEach(([key, data]) => {
        console.log(`范围 ${key}: ${data.length} 条数据`);
    });

    Object.values(ranges).forEach(data => data.sort((a, b) => b.colorCode - a.colorCode));
    return ranges;
}

// 渲染可视化图表
function renderVisualization(ranges) {
    const container = document.getElementById('chartContainer');
    if (!container) {
        console.error("找不到chartContainer元素");
        return;
    }
    
    container.innerHTML = '';

    // 添加图例
    const legend = document.createElement('div');
    legend.className = 'legend';
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
        const dataPoints = ranges[labelKey] || [];
        console.log(`渲染 ${labelKey}: ${dataPoints.length} 个点`);
        
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
                    const dataPoint = dataPoints[dataIndex];
                    if (dataPoint && dataPoint.colorCode && COLOR_MAP[dataPoint.colorCode]) {
                        circle.style.backgroundColor = COLOR_MAP[dataPoint.colorCode];
                        circle.dataset.colorCode = dataPoint.colorCode;
                    } else {
                        circle.style.visibility = 'hidden';
                    }
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
