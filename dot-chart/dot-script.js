// 使用IIFE封装防止全局污染
(function() {
    // 配置常量
    const CONFIG = {
        CIRCLE_PER_ROW: 50,  // 每行显示圆点数量
        COLOR_MAP: {         // 颜色映射
            3: '#1CCEAC',    // 引用几个字
            2: '#FFD363',    // 引用完整句子
            1: '#FD8C90'     // 引用整首诗
        },
        LABEL_MAP: {        // 分类标签
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
        },
        DATA_URL: 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/main/DATA/dot-data.json'
    };

    // 主初始化函数
    function init() {
        // 绑定文件输入事件
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
        
        // 加载远程数据
        loadRemoteData();
    }

    // ====================== 数据加载部分 ======================
    async function loadRemoteData() {
        try {
            console.log('[初始化] 开始加载远程数据...');
            const response = await fetch(CONFIG.DATA_URL);
            
            if (!response.ok) {
                throw new Error(`网络请求失败: ${response.status} ${response.statusText}`);
            }
            
            const rawData = await response.json();
            console.log('[成功] 原始数据加载完成', rawData);
            
            // 数据处理流水线
            const cleanData = validateData(rawData);
            const categorizedData = categorizeData(cleanData);
            renderVisualization(categorizedData);
            
        } catch (error) {
            handleFatalError(error);
        }
    }

    // ====================== 数据处理部分 ======================
    function validateData(rawData) {
        console.log('[阶段] 数据验证开始');
        
        // 获取有效数据数组
        const dataArray = rawData.data || rawData;
        if (!Array.isArray(dataArray)) {
            throw new Error('数据格式错误：预期为数组');
        }

        // 数据清洗
        const validated = dataArray
            .map((item, index) => {
                // 字段兼容处理
                const citeType = parseInt(item.cite_type || item.citeType, 10);
                const fragmentNumber = parseInt(item.fragment_number || item.fragmentNumber, 10);

                // 有效性检查
                if ([citeType, fragmentNumber].some(Number.isNaN)) {
                    console.warn(`[警告] 丢弃无效数据项 #${index}:`, item);
                    return null;
                }
                
                if (![1, 2, 3].includes(citeType)) {
                    console.warn(`[警告] 异常citeType值 #${index}: ${citeType}`);
                    return null;
                }
                
                return {
                    colorCode: citeType,
                    value: fragmentNumber
                };
            })
            .filter(item => {
                const isValid = item !== null && item.value >= 5;
                if (!isValid && item !== null) {
                    console.warn(`[警告] 丢弃无效值 #${item.value}`);
                }
                return isValid;
            });

        console.log('[成功] 有效数据条目:', validated.length);
        return validated;
    }

    // ====================== 数据分类部分 ======================
    function categorizeData(cleanData) {
        console.log('[阶段] 数据分类开始');
        
        // 初始化分类容器
        const categories = Object.keys(CONFIG.LABEL_MAP)
            .reduce((acc, key) => ({ ...acc, [key]: [] }), {});

        // 分类逻辑
        cleanData.forEach(({ colorCode, value }) => {
            const categoryKey = getCategoryKey(value);
            if (categoryKey && categories[categoryKey]) {
                categories[categoryKey].push({ colorCode, value });
            } else {
                console.warn(`[警告] 未分类数据: value=${value}`);
            }
        });

        // 按颜色代码降序排列
        Object.values(categories).forEach(arr => 
            arr.sort((a, b) => b.colorCode - a.colorCode)
        );

        console.log('[成功] 分类完成:', 
            Object.entries(categories).map(([k, v]) => `${k}:${v.length}`)
        );
        return categories;
    }

    function getCategoryKey(value) {
        if (value >= 100) return '100以上';
        if (value > 50) return '50-100';
        if (value > 30) return '30-50';
        if (value > 20) return '20-30';
        if (value > 10) return '10-20';
        if (value >= 5 && value <= 10) return value.toString();
        return null;
    }

    // ====================== 可视化渲染部分 ======================
    function renderVisualization(categorizedData) {
        console.log('[阶段] 开始渲染可视化');
        
        const container = document.getElementById('chartContainer');
        if (!container) {
            throw new Error('找不到图表容器元素');
        }
        
        // 清空容器
        container.innerHTML = '';
        
        // 构建图例
        renderLegend(container);
        
        // 构建分类区块
        Object.entries(CONFIG.LABEL_MAP).forEach(([key, label]) => {
            const dataPoints = categorizedData[key] || [];
            renderCategory(container, label, dataPoints);
        });
    }

    function renderLegend(container) {
        const legend = document.createElement('div');
        legend.className = 'vis-legend';
        
        // 生成图例项
        legend.innerHTML = Object.entries(CONFIG.COLOR_MAP)
            .map(([code, color]) => `
                <div class="legend-item" data-code="${code}">
                    <span class="color-dot" style="background:${color}"></span>
                    ${getLegendLabel(code)}
                </div>
            `).join('');

        // 添加交互效果
        legend.querySelectorAll('.color-dot').forEach(dot => {
            const targetCode = dot.parentElement.dataset.code;
            
            dot.addEventListener('mouseenter', () => {
                document.querySelectorAll('.data-dot').forEach(d => {
                    d.classList.toggle('dimmed', d.dataset.code !== targetCode);
                });
            });
            
            dot.addEventListener('mouseleave', () => {
                document.querySelectorAll('.data-dot').forEach(d => 
                    d.classList.remove('dimmed')
                );
            });
        });

        container.appendChild(legend);
    }

    function getLegendLabel(code) {
        const labels = {
            1: '引用整首古诗',
            2: '引用完整句子',
            3: '引用几个字'
        };
        return labels[code] || '未知类型';
    }

    function renderCategory(container, label, dataPoints) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'vis-category';
        
        // 分类标题
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <span class="category-label">${label}</span>
            <span class="data-count">${dataPoints.length}个数据点</span>
        `;
        categoryDiv.appendChild(header);
        
        // 圆点容器
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'dots-container';
        
        // 动态生成圆点
        let currentRow;
        dataPoints.forEach((point, index) => {
            // 创建新行
            if (index % CONFIG.CIRCLE_PER_ROW === 0) {
                currentRow = document.createElement('div');
                currentRow.className = 'dot-row';
                dotsContainer.appendChild(currentRow);
            }
            
            // 创建圆点
            const dot = document.createElement('div');
            dot.className = 'data-dot';
            dot.style.backgroundColor = CONFIG.COLOR_MAP[point.colorCode];
            dot.dataset.code = point.colorCode;
            currentRow.appendChild(dot);
        });

        // 空状态处理
        if (dataPoints.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = '暂无数据';
            dotsContainer.appendChild(empty);
        }

        categoryDiv.appendChild(dotsContainer);
        container.appendChild(categoryDiv);
    }

    // ====================== 文件上传处理 ======================
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            console.log('[操作] 开始处理上传文件');
            const rawData = await parseUploadedFile(file);
            const cleanData = validateData(rawData);
            const categorizedData = categorizeData(cleanData);
            renderVisualization(categorizedData);
        } catch (error) {
            handleFatalError(error);
        }
    }

    function parseUploadedFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    resolve(JSON.parse(e.target.result));
                } catch (error) {
                    reject(new Error('文件解析失败：非法的JSON格式'));
                }
            };
            
            reader.onerror = () => 
                reject(new Error('文件读取失败'));
            
            reader.readAsText(file);
        });
    }

    // ====================== 错误处理 ======================
    function handleFatalError(error) {
        console.error('[严重错误]', error);
        
        const container = document.getElementById('chartContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>图表加载失败</h3>
                    <p>${error.message}</p>
                    <p>请检查控制台获取详细信息</p>
                </div>
            `;
        }
    }

    // 启动初始化
    document.addEventListener('DOMContentLoaded', init);
})();
