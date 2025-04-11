// 使用闭包封装整个图表功能，避免全局污染
(function() {
    // 配置常量（可修改为实例专属配置）
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

    class PoetryVisualization {
        constructor(containerId, fileInputId) {
            // 实例专属的元素ID
            this.containerId = containerId;
            this.fileInputId = fileInputId;
            this.init();
        }

        init() {
            // 独立的事件监听（使用箭头函数保持this指向）
            document.addEventListener('DOMContentLoaded', () => {
                const fileInput = document.getElementById(this.fileInputId);
                if (fileInput) {
                    // 使用bind确保处理函数属于当前实例
                    fileInput.addEventListener('change', this.handleFile.bind(this));
                }
                this.loadJsonFromGitHub();
            });
        }

        async loadJsonFromGitHub() {
            try {
                const jsonUrl = 'https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/dot-data.json';
                const response = await fetch(jsonUrl);
                if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
                
                const jsonData = await response.json();
                console.log("加载的JSON数据样本:", jsonData[0]);

                // 数据清洗和适配
                const dataToProcess = jsonData.map(item => ({
                    citeType: item.cite_type || item.citeType,
                    fragmentNumber: item.fragment_number || item.fragmentNumber
                })).filter(item => item.citeType !== undefined && item.fragmentNumber !== undefined);

                console.log("有效数据条目数:", dataToProcess.length);
                this.render(this.processData(dataToProcess));
            } catch (error) {
                console.error('加载失败:', error);
                this.showError(error.message);
            }
        }

        async handleFile(event) {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const jsonData = await this.readJsonFile(file);
                const dataToProcess = jsonData.map(item => ({
                    citeType: item.cite_type || item.citeType,
                    fragmentNumber: item.fragment_number || item.fragmentNumber
                }));
                this.render(this.processData(dataToProcess));
            } catch (error) {
                this.showError(`文件处理错误: ${error.message}`);
            }
        }

        readJsonFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        resolve(JSON.parse(e.target.result));
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file);
            });
        }

        processData(jsonData) {
            const rawData = jsonData.map(item => {
                const colorCode = parseInt(item.citeType, 10);
                const value = parseInt(item.fragmentNumber, 10);
                if (isNaN(colorCode) || isNaN(value)) {
                    console.log('无效数据:', item);
                    return null;
                }
                return { colorCode, value };
            }).filter(data => {
                const valid = data && [1, 2, 3].includes(data.colorCode) && data.value >= 5;
                if (!valid) console.log('过滤数据:', data);
                return valid;
            });

            console.log("最终有效数据:", rawData.length);
            return this.categorizeData(rawData);
        }

        categorizeData(rawData) {
            const ranges = Object.keys(LABEL_MAP).reduce((acc, key) => {
                acc[key] = [];
                return acc;
            }, {});

            rawData.forEach(data => {
                const value = data.value;
                let key;

                if (value === 5) key = '5';
                else if (value === 6) key = '6';
                // ...其他分类逻辑保持原样...
                else if (value > 100) key = '100以上';
                
                if (key) ranges[key].push(data);
            });

            Object.values(ranges).forEach(data => data.sort((a, b) => b.colorCode - a.colorCode));
            return ranges;
        }

        render(ranges) {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error(`容器元素不存在: ${this.containerId}`);
                return;
            }
            container.innerHTML = '';

            // 生成带命名空间的CSS类名
            const ns = `poetry-vis-${this.containerId}`;
            this.createLegend(container, ns);
            this.renderCategories(container, ranges, ns);
        }

        createLegend(container, namespace) {
            const legend = document.createElement('div');
            legend.className = `${namespace}-legend legend`;
            legend.innerHTML = `
                <div class="legend-item" data-color-code="3">
                    <span class="legend-color" style="background-color: ${COLOR_MAP[3]}"></span>引用几个字
                </div>
                <!-- 其他图例项 -->
            `;

            // 实例专属的事件处理
            legend.querySelectorAll('.legend-item').forEach(item => {
                const colorCode = item.dataset.colorCode;
                item.querySelector('.legend-color').addEventListener('mouseenter', () => {
                    container.querySelectorAll(`.${namespace}-circle`).forEach(circle => {
                        circle.classList.toggle('dimmed', circle.dataset.colorCode !== colorCode);
                    });
                });
                item.querySelector('.legend-color').addEventListener('mouseleave', () => {
                    container.querySelectorAll(`.${namespace}-circle`).forEach(circle => {
                        circle.classList.remove('dimmed');
                    });
                });
            });

            container.appendChild(legend);
        }

        renderCategories(container, ranges, namespace) {
            const order = Object.keys(LABEL_MAP);
            order.forEach(labelKey => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = `${namespace}-category category`;
                
                // 添加标签和圆点行（逻辑保持原样，但使用命名空间类名）
                const labelDiv = document.createElement('div');
                labelDiv.className = 'label';
                labelDiv.textContent = LABEL_MAP[labelKey];
                categoryDiv.appendChild(labelDiv);

                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'circles-wrapper';
                
                // 渲染圆点时使用命名空间类名
                const circles = ranges[labelKey] || [];
                circles.forEach((dataPoint, index) => {
                    const circle = document.createElement('div');
                    circle.className = `${namespace}-circle circle`;
                    circle.style.backgroundColor = COLOR_MAP[dataPoint.colorCode];
                    circle.dataset.colorCode = dataPoint.colorCode;
                    // ...其他渲染逻辑...
                });

                container.appendChild(categoryDiv);
            });
        }

        showError(message) {
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = `<div class="error-message">${message}</div>`;
            }
        }
    }

    // 初始化实例（每个图表使用不同的ID）
    window.initPoetryVisualization = function(containerId = 'chartContainer', fileInputId = 'fileInput') {
        new PoetryVisualization(containerId, fileInputId);
    };
})();
