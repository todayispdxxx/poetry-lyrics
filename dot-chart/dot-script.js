// 使用立即执行函数封装，避免全局污染
(function() {
    // 常量配置
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

    // 主初始化函数
    function init() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFile);
        }
        loadJsonFromGitHub();
    }

    // GitHub数据加载
    async function loadJsonFromGitHub() {
        try {
            const jsonUrl = 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/dot-data.json';
            const response = await fetch(jsonUrl);
            handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    }

    // 处理响应
    async function handleResponse(response) {
        if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
        
        const jsonData = await response.json();
        console.log("原始数据样本:", jsonData[0]);
        
        // 数据标准化处理
        const processedData = normalizeData(jsonData);
        console.log("标准化数据样本:", processedData.slice(0, 3));
        
        // 分类渲染
        const ranges = processData(processedData);
        renderVisualization(ranges);
    }

    // 数据标准化
    function normalizeData(rawData) {
        return (rawData.data || rawData).map(item => ({
            citeType: parseInt(item.cite_type, 10),
            fragmentNumber: parseInt(item.fragment_number, 10)
        })).filter(item => 
            ![item.citeType, item.fragmentNumber].some(isNaN) && 
            [1, 2, 3].includes(item.citeType) &&
            item.fragmentNumber >= 5
        );
    }

    // 处理文件上传
    async function handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const jsonData = await readJsonFile(file);
            const processedData = normalizeData(jsonData);
            const ranges = processData(processedData);
            renderVisualization(ranges);
        } catch (error) {
            showError(`文件处理错误: ${error.message}`);
        }
    }

    // 文件读取
    function readJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                try { resolve(JSON.parse(e.target.result)); } 
                catch (error) { reject(error); }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    // 数据处理核心
    function processData(jsonData) {
        const rawData = jsonData.map(item => ({
            colorCode: item.citeType,
            value: item.fragmentNumber
        }));

        console.log("有效数据量:", rawData.length);
        return categorizeData(rawData);
    }

    // 数据分类
    function categorizeData(rawData) {
        const ranges = Object.keys(LABEL_MAP).reduce((acc, key) => {
            acc[key] = [];
            return acc;
        }, {});

        rawData.forEach(({ value }) => {
            let key = '';
            if (value <= 10) key = value.toString();
            else if (value <= 20) key = '10-20';
            else if (value <= 30) key = '20-30';
            else if (value <= 50) key = '30-50';
            else if (value <= 100) key = '50-100';
            else key = '100以上';

            if (ranges[key]) ranges[key].push({ colorCode, value });
            else console.warn(`未定义分类键: ${key}`);
        });

        // 排序并记录
        Object.entries(ranges).forEach(([key, data]) => {
            data.sort((a, b) => b.colorCode - a.colorCode);
            console.log(`分类 ${key}: ${data.length}条`);
        });
        
        return ranges;
    }

    // 渲染可视化
    function renderVisualization(ranges) {
        const container = document.getElementById('chartContainer');
        if (!container) return console.error("缺少容器元素");
        
        container.innerHTML = '';
        renderLegend(container);
        renderCategories(container, ranges);
    }

    // 渲染图例
    function renderLegend(container) {
        const legendHTML = Object.entries({
            3: '引用几个字',
            2: '引用完整句子',
            1: '引用整首古诗'
        }).map(([code, text]) => `
            <div class="legend-item" data-color-code="${code}">
                <span class="legend-color" style="background:${COLOR_MAP[code]}"></span>
                ${text}
            </div>
        `).join('');

        const legend = document.createElement('div');
        legend.className = 'legend';
        legend.innerHTML = legendHTML;
        
        // 添加交互
        legend.querySelectorAll('.legend-color').forEach(colorElem => {
            const targetCode = colorElem.parentElement.dataset.colorCode;
            colorElem.addEventListener('mouseenter', () => 
                document.querySelectorAll('.circle').forEach(circle => 
                    circle.classList.toggle('dimmed', circle.dataset.colorCode !== targetCode)
                )
            );
            colorElem.addEventListener('mouseleave', () => 
                document.querySelectorAll('.circle').forEach(c => c.classList.remove('dimmed'))
            );
        });

        container.appendChild(legend);
    }

    // 渲染分类区块
    function renderCategories(container, ranges) {
        Object.entries(LABEL_MAP).forEach(([key, label]) => {
            const dataPoints = ranges[key] || [];
            console.log(`渲染分类 ${key}: ${dataPoints.length}点`);

            const category = document.createElement('div');
            category.className = 'category';
            
            // 标签
            const labelDiv = document.createElement('div');
            labelDiv.className = 'label';
            labelDiv.textContent = label;
            category.appendChild(labelDiv);

            // 圆点容器
            const wrapper = document.createElement('div');
            wrapper.className = 'circles-wrapper';
            
            // 行渲染
            const totalRows = Math.ceil(dataPoints.length / CIRCLE_PER_ROW);
            for (let row = 0; row < totalRows; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'circle-row';
                
                for (let i = 0; i < CIRCLE_PER_ROW; i++) {
                    const index = row * CIRCLE_PER_ROW + i;
                    const circle = createCircle(dataPoints[index]);
                    rowDiv.appendChild(circle);
                }
                wrapper.appendChild(rowDiv);
            }

            // 空状态处理
            if (!dataPoints.length) {
                const emptyRow = document.createElement('div');
                emptyRow.className = 'circle-row empty';
                emptyRow.textContent = '0个点';
                wrapper.appendChild(emptyRow);
            }

            category.appendChild(wrapper);
            container.appendChild(category);
        });
    }

    // 创建单个圆点
    function createCircle(dataPoint) {
        const circle = document.createElement('div');
        circle.className = 'circle';
        
        if (dataPoint) {
            circle.style.backgroundColor = COLOR_MAP[dataPoint.colorCode];
            circle.dataset.colorCode = dataPoint.colorCode;
        } else {
            circle.style.visibility = 'hidden';
        }
        
        return circle;
    }

    // 错误处理
    function handleError(error) {
        console.error('运行错误:', error);
        const container = document.getElementById('chartContainer');
        if (container) {
            container.innerHTML = `<div class="error-message">${
                error.message || '未知错误'
            }</div>`;
        }
    }

    // 初始化执行
    document.addEventListener('DOMContentLoaded', init);
})();
