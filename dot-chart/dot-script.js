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

// 确保XLSX库已加载
function ensureXlsxLoaded() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve();
        } else {
            // 如果XLSX库未加载，动态加载它
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load XLSX library'));
            document.head.appendChild(script);
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 创建一个显示容器，如果不存在
    if (!document.getElementById('chartContainer')) {
        const container = document.createElement('div');
        container.id = 'chartContainer';
        document.body.appendChild(container);
    }
    
    // 保留文件输入功能（可选）
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFile);
    }
    
    // 从GitHub加载Excel文件
    loadExcelFromGitHub();
});

// 从GitHub加载Excel文件
async function loadExcelFromGitHub() {
    try {
        // 显示加载状态
        const container = document.getElementById('chartContainer');
        container.innerHTML = '<div class="loading">正在加载数据，请稍候...</div>';
        
        // 确保XLSX库已加载
        await ensureXlsxLoaded();
        
        // 使用代理服务来解决CORS问题
        const excelUrl = 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/dot-data.xlsx';
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        
        // 首先尝试直接获取
        try {
            const response = await fetch(excelUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            
            // 尝试读取Excel
            processExcelData(data);
            
        } catch (directError) {
            console.warn('直接获取失败，尝试使用CORS代理:', directError);
            
            // 如果直接获取失败，尝试使用CORS代理
            const proxyResponse = await fetch(corsProxy + excelUrl);
            
            if (!proxyResponse.ok) {
                throw new Error(`通过代理获取失败! 状态: ${proxyResponse.status}`);
            }
            
            const arrayBuffer = await proxyResponse.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            
            // 处理Excel数据
            processExcelData(data);
        }
        
    } catch (error) {
        console.error('加载Excel文件失败:', error);
        // 出现错误时显示错误信息
        const container = document.getElementById('chartContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>加载数据失败: ${error.message}</p>
                    <p>可能原因：</p>
                    <ul>
                        <li>CORS策略限制 - GitHub不允许跨域请求</li>
                        <li>文件路径不正确或文件不存在</li>
                        <li>Excel文件格式问题</li>
                    </ul>
                    <p>建议添加文件上传功能作为备选方案</p>
                </div>
            `;
            
            // 添加文件上传控件，如果不存在
            if (!document.getElementById('fileInput')) {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.id = 'fileInput';
                fileInput.accept = '.xlsx, .xls';
                fileInput.addEventListener('change', handleFile);
                
                const fileLabel = document.createElement('label');
                fileLabel.innerHTML = '上传Excel文件：';
                fileLabel.appendChild(fileInput);
                
                container.appendChild(fileLabel);
            }
        }
    }
}

// 处理Excel数据
function processExcelData(data) {
    try {
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('无法读取Excel工作簿或工作簿为空');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        if (!worksheet) {
            throw new Error('无法获取工作表');
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!jsonData || jsonData.length === 0) {
            throw new Error('Excel文件中没有数据');
        }
        
        console.log('成功读取Excel数据', jsonData.length, '行');
        
        // 数据处理和可视化
        const ranges = processData(jsonData);
        renderVisualization(ranges);
    } catch (error) {
        console.error('处理Excel数据时出错:', error);
        const container = document.getElementById('chartContainer');
        if (container) {
            container.innerHTML = `<div class="error-message">处理Excel数据失败: ${error.message}</div>`;
        }
        throw error; // 重新抛出错误以便于调试
    }
}

// 处理文件上传
async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const container = document.getElementById('chartContainer');
        container.innerHTML = '<div class="loading">正在处理文件，请稍候...</div>';
        
        // 确保XLSX库已加载
        await ensureXlsxLoaded();
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                processExcelData(data);
            } catch (error) {
                console.error('处理上传的Excel文件时出错:', error);
                container.innerHTML = `<div class="error-message">处理文件失败: ${error.message}</div>`;
            }
        };
        
        reader.onerror = () => {
            container.innerHTML = '<div class="error-message">文件读取失败</div>';
        };
        
        reader.readAsArrayBuffer(file);
    } catch (error) {
        alert(`处理文件时出错: ${error.message}`);
    }
}

// 处理从Excel读取的数据
function processData(jsonData) {
    // 检查数据并记录
    console.log('开始处理数据，总行数:', jsonData.length);
    console.log('第一行示例:', jsonData[0]);
    
    // 过滤和提取数据
    const rawData = jsonData
        .filter((row, index) => {
            const isValid = row && Array.isArray(row) && row.length >= 14;
            if (!isValid && index < 10) {
                console.warn(`行 ${index + 1} 数据无效或列数不足:`, row);
            }
            return isValid;
        })
        .map(row => ({
            colorCode: row[11] !== undefined ? Number(row[11]) : null,
            value: row[13] !== undefined ? Number(row[13]) : null
        }))
        .filter(data => {
            const isValid = 
                data.colorCode !== null &&
                data.value !== null &&
                [1, 2, 3].includes(data.colorCode) && 
                typeof data.value === 'number';
            
            if (!isValid) {
                console.log('过滤掉无效数据点:', data);
            }
            return isValid;
        });
    
    console.log('处理后有效数据点数量:', rawData.length);
    
    // 如果没有有效数据，提供默认数据进行显示
    if (rawData.length === 0) {
        console.warn('没有找到有效数据，使用示例数据');
        // 创建一些示例数据用于测试
        return createSampleData();
    }
    
    return categorizeData(rawData);
}

// 创建示例数据（当无法获取实际数据时使用）
function createSampleData() {
    const sampleData = {};
    
    Object.keys(LABEL_MAP).forEach(key => {
        sampleData[key] = [];
        // 为每个类别生成一些随机数据
        const count = Math.floor(Math.random() * 100) + 5;
        for (let i = 0; i < count; i++) {
            sampleData[key].push({
                colorCode: Math.floor(Math.random() * 3) + 1, // 1, 2, 或 3
                value: parseInt(key === '100以上' ? 101 : key)
            });
        }
    });
    
    return sampleData;
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
        else if (value >= 11 && value <= 20) key = '10-20';
        else if (value >= 21 && value <= 30) key = '20-30';
        else if (value > 30 && value <= 50) key = '30-50';
        else if (value > 50 && value <= 100) key = '50-100';
        else if (value > 100) key = '100以上';
        else return;

        ranges[key].push(data);
    });

    // 按颜色代码排序
    Object.values(ranges).forEach(data => data.sort((a, b) => b.colorCode - a.colorCode));
    
    // 记录分类结果
    Object.entries(ranges).forEach(([key, data]) => {
        console.log(`范围 ${key}: ${data.length} 个数据点`);
    });
    
    return ranges;
}

// 渲染可视化图表
function renderVisualization(ranges) {
    const container = document.getElementById('chartContainer');
    if (!container) {
        console.error('找不到图表容器元素');
        return;
    }
    
    container.innerHTML = '';
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #chartContainer {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .legend {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
        }
        .category {
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .label {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .circles-wrapper {
            overflow-x: auto;
        }
        .circle-row {
            display: flex;
            margin-bottom: 5px;
        }
        .circle {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 2px;
            transition: opacity 0.3s;
        }
        .circle.dimmed {
            opacity: 0.2;
        }
        .loading {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #666;
        }
        .error-message {
            color: #d32f2f;
            padding: 15px;
            border: 1px solid #ffcdd2;
            background-color: #ffebee;
            border-radius: 4px;
            margin: 20px 0;
        }
        .title {
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
            color: #333;
        }
    `;
    container.appendChild(style);

    // 添加标题
    const title = document.createElement('h1');
    title.className = 'title';
    title.textContent = '古诗词引用分析可视化';
    container.appendChild(title);

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
        
        legendItem.addEventListener('mouseenter', () => {
            document.querySelectorAll('.circle').forEach(circle => {
                if (circle.dataset.colorCode !== colorCode) {
                    circle.classList.add('dimmed');
                }
            });
        });

        legendItem.addEventListener('mouseleave', function() {
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
        labelDiv.textContent = LABEL_MAP[labelKey] + ` (${dataPoints.length}个)`;
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
                    // 添加工具提示
                    circle.title = `引用类型: ${
                        dataPoints[dataIndex].colorCode === 3 ? '几个字' : 
                        dataPoints[dataIndex].colorCode === 2 ? '完整句子' : '整首古诗'
                    }`;
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
