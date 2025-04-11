(function() {
    const CIRCLE_PER_ROW = 50;
    const COLOR_MAP = {3: '#1CCEAC', 2: '#FFD363', 1: '#FD8C90'};
    const LABEL_MAP = {
        '5':'5个字','6':'6个字','7':'7个字','8':'8个字','9':'9个字',
        '10':'10个字','10-20':'11~20个字','20-30':'21~30个字',
        '30-50':'31~50个字','50-100':'51~100个字','100以上':'100个字以上'
    };

    // 主初始化
    document.addEventListener('DOMContentLoaded', () => {
        const fileInput = document.getElementById('fileInput');
        fileInput?.addEventListener('change', handleFile);
        loadJsonFromGitHub();
    });

    // GitHub数据加载
    async function loadJsonFromGitHub() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/main/DATA/dot-data.json');
            if (!response.ok) throw new Error(`HTTP错误 ${response.status}`);
            
            const rawData = await response.json();
            const processed = processData(normalizeData(rawData));
            renderVisualization(processed);
        } catch (error) {
            showError(error.message);
        }
    }

    // 数据标准化
    function normalizeData(data) {
        return (data.data || data).map(item => ({
            citeType: Number(item.cite_type),
            fragmentNumber: Number(item.fragment_number)
        })).filter(item => 
            ![item.citeType, item.fragmentNumber].some(isNaN) &&
            [1, 2, 3].includes(item.citeType) &&
            item.fragmentNumber >= 5
        );
    }

    // 核心数据处理
    function processData(cleanData) {
        const ranges = Object.keys(LABEL_MAP).reduce((acc, k) => (acc[k]=[], acc), {});

        cleanData.forEach(({ citeType: colorCode, fragmentNumber: value }) => {
            const key = getRangeKey(value);
            if (key) ranges[key].push({ colorCode, value });
        });

        Object.values(ranges).forEach(arr => arr.sort((a, b) => b.colorCode - a.colorCode));
        return ranges;
    }

    // 获取分类键
    function getRangeKey(value) {
        if (value <= 10) return value.toString();
        if (value <= 20) return '10-20';
        if (value <= 30) return '20-30';
        if (value <= 50) return '30-50';
        if (value <= 100) return '50-100';
        return '100以上';
    }

    // 渲染可视化
    function renderVisualization(ranges) {
        const container = document.getElementById('chartContainer');
        if (!container) return;
        
        container.innerHTML = '';
        renderLegend(container);
        
        Object.entries(LABEL_MAP).forEach(([key, label]) => {
            const dataPoints = ranges[key] || [];
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';

            // 标签
            const labelDiv = document.createElement('div');
            labelDiv.className = 'label';
            labelDiv.textContent = label;
            categoryDiv.appendChild(labelDiv);

            // 圆点容器
            const wrapper = document.createElement('div');
            wrapper.className = 'circles-wrapper';
            
            // 动态生成圆点
            const totalDots = dataPoints.length;
            const rows = Math.ceil(totalDots / CIRCLE_PER_ROW);
            
            for (let row = 0; row < rows; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'circle-row';
                
                for (let i = 0; i < CIRCLE_PER_ROW; i++) {
                    const idx = row * CIRCLE_PER_ROW + i;
                    const circle = document.createElement('div');
                    circle.className = 'circle';
                    
                    if (idx < totalDots) {
                        const { colorCode } = dataPoints[idx];
                        circle.style.backgroundColor = COLOR_MAP[colorCode];
                        circle.dataset.colorCode = colorCode;
                    } else {
                        circle.style.visibility = 'hidden';
                    }
                    rowDiv.appendChild(circle);
                }
                wrapper.appendChild(rowDiv);
            }

            // 空状态处理
            if (!totalDots) {
                const empty = document.createElement('div');
                empty.className = 'circle-row empty';
                empty.textContent = '0个点';
                wrapper.appendChild(empty);
            }

            categoryDiv.appendChild(wrapper);
            container.appendChild(categoryDiv);
        });
    }

    // 渲染图例
    function renderLegend(container) {
        const legend = document.createElement('div');
        legend.className = 'legend';
        legend.innerHTML = [3,2,1].map(code => `
            <div class="legend-item" data-color-code="${code}">
                <span class="legend-color" style="background:${COLOR_MAP[code]}"></span>
                ${['几个字','完整句子','整首诗'][code-1]}
            </div>
        `).join('');

        // 交互逻辑
        legend.querySelectorAll('.legend-color').forEach(colorElem => {
            const targetCode = colorElem.parentElement.dataset.colorCode;
            colorElem.addEventListener('mouseenter', () => {
                document.querySelectorAll('.circle').forEach(circle => {
                    circle.classList.toggle('dimmed', circle.dataset.colorCode !== targetCode);
                });
            });
            colorElem.addEventListener('mouseleave', () => {
                document.querySelectorAll('.circle').forEach(c => c.classList.remove('dimmed'));
            });
        });

        container.appendChild(legend);
    }

    // 错误处理
    function showError(msg) {
        const container = document.getElementById('chartContainer');
        if (container) container.innerHTML = `<div class="error">${msg}</div>`;
    }

    // 文件处理
    async function handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const rawData = JSON.parse(await file.text());
            const processed = processData(normalizeData(rawData));
            renderVisualization(processed);
        } catch (error) {
            showError(`文件处理失败: ${error.message}`);
        }
    }
})();
