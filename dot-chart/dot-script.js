// 可视化核心模块
(function() {
    // 配置常量
    const CONFIG = {
        DOTS_PER_ROW: 50,
        COLOR_SCHEME: {
            1: '#FD8C90', // 整首引用
            2: '#FFD363', // 句子引用
            3: '#1CCEAC'  // 片段引用
        },
        CATEGORY_MAP: {
            '5': '5个字', '6':'6个字','7':'7个字','8':'8个字','9':'9个字',
            '10':'10个字','10-20':'11~20字','20-30':'21~30字',
            '30-50':'31~50字','50-100':'51~100字','100以上':'100+字'
        },
        DATA_SOURCE: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/main/DATA/dot-data.json'
    };

    // 状态管理
    let currentData = null;

    // 主初始化
    function init() {
        bindFileInput();
        loadData().catch(handleCriticalError);
    }

    // 数据加载
    async function loadData() {
        try {
            console.group('数据加载流程');
            const response = await fetch(CONFIG.DATA_SOURCE);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const raw = await response.json();
            console.log('原始数据样本:', raw[0]);
            
            currentData = processData(raw);
            renderChart(currentData);
        } finally {
            console.groupEnd();
        }
    }

    // 数据处理管道
    function processData(raw) {
        console.group('数据处理流程');
        
        // 数据清洗
        const cleaned = raw
            .map(item => ({
                type: parseInt(item.cite_type || item.type, 10),
                length: parseInt(item.fragment_number || item.length, 10)
            }))
            .filter(item => 
                [1, 2, 3].includes(item.type) && 
                item.length >= 5 &&
                !isNaN(item.length)
            );
        
        console.log('有效数据量:', cleaned.length);
        
        // 数据分箱
        const bins = Object.keys(CONFIG.CATEGORY_MAP)
            .reduce((acc, key) => ({...acc, [key]: []}), {});
        
        cleaned.forEach(({type, length}) => {
            const binKey = getBinKey(length);
            if (binKey) bins[binKey].push({type, length});
        });

        // 按类型排序
        Object.values(bins).forEach(arr => 
            arr.sort((a, b) => b.type - a.type)
        );
        
        console.log('数据分箱结果:', bins);
        console.groupEnd();
        return bins;
    }

    // 分箱逻辑
    function getBinKey(length) {
        if (length > 100) return '100以上';
        if (length > 50) return '50-100';
        if (length > 30) return '30-50';
        if (length > 20) return '20-30';
        if (length > 10) return '10-20';
        if (length >=5 && length <=10) return length.toString();
        return null;
    }

    // 可视化渲染
    function renderChart(data) {
        const container = document.getElementById('visContainer');
        if (!container) throw new Error('找不到可视化容器');
        
        container.innerHTML = '';
        
        // 渲染图例
        const legend = createLegend();
        container.appendChild(legend);
        
        // 渲染分类区块
        Object.entries(CONFIG.CATEGORY_MAP).forEach(([key, label]) => {
            const categoryData = data[key] || [];
            const categoryBlock = createCategoryBlock(label, categoryData);
            container.appendChild(categoryBlock);
        });
    }

    function createLegend() {
        const legend = document.createElement('div');
        legend.className = 'vis-legend';
        
        legend.innerHTML = Object.entries(CONFIG.COLOR_SCHEME)
            .map(([code, color]) => `
                <div class="legend-item" data-type="${code}">
                    <span class="color-box" style="background:${color}"></span>
                    ${getTypeLabel(code)}
                </div>
            `).join('');
        
        // 交互效果
        legend.querySelectorAll('.color-box').forEach(box => {
            box.addEventListener('mouseenter', () => 
                highlightDots(box.parentElement.dataset.type)
            );
            box.addEventListener('mouseleave', resetDots);
        });
        
        return legend;
    }

    function createCategoryBlock(label, data) {
        const block = document.createElement('div');
        block.className = 'category-block';
        
        // 标题
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <span class="category-label">${label}</span>
            <span class="data-count">${data.length}项</span>
        `;
        
        // 点阵容器
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'dots-container';
        
        // 动态生成点阵
        let currentRow;
        data.forEach((item, index) => {
            if (index % CONFIG.DOTS_PER_ROW === 0) {
                currentRow = document.createElement('div');
                currentRow.className = 'dot-row';
                dotsContainer.appendChild(currentRow);
            }
            
            const dot = document.createElement('div');
            dot.className = 'data-dot';
            dot.style.backgroundColor = CONFIG.COLOR_SCHEME[item.type];
            dot.dataset.type = item.type;
            currentRow.appendChild(dot);
        });
        
        // 空状态
        if (data.length === 0) {
            dotsContainer.innerHTML = `<div class="empty-state">无数据</div>`;
        }

        block.appendChild(header);
        block.appendChild(dotsContainer);
        return block;
    }

    // 交互功能
    function highlightDots(type) {
        document.querySelectorAll('.data-dot').forEach(dot => {
            dot.classList.toggle('dimmed', dot.dataset.type !== type);
        });
    }

    function resetDots() {
        document.querySelectorAll('.data-dot').forEach(dot => 
            dot.classList.remove('dimmed')
        );
    }

    // 文件上传
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const raw = await parseFile(file);
            currentData = processData(raw);
            renderChart(currentData);
        } catch (err) {
            handleCriticalError(err);
        }
    }

    // 工具函数
    function parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    resolve(JSON.parse(e.target.result));
                } catch {
                    reject(new Error('文件解析失败'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    function getTypeLabel(typeCode) {
        const labels = {
            1: '整首引用',
            2: '句子引用',
            3: '片段引用'
        };
        return labels[typeCode] || '未知类型';
    }

    function handleCriticalError(error) {
        console.error('致命错误:', error);
        const container = document.getElementById('visContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-card">
                    <h3>可视化渲染失败</h3>
                    <p>${error.message}</p>
                    <p>请检查数据源格式或联系管理员</p>
                </div>
            `;
        }
    }

    function bindFileInput() {
        const input = document.getElementById('dataFile');
        input?.addEventListener('change', handleFileUpload);
    }

    // 启动
    document.addEventListener('DOMContentLoaded', init);
})();
