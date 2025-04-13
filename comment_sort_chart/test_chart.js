// 分类映射表保持不变
const categoryMap = {
    "1": { 
        "label": "歌曲相关🎵", 
        "color": "#8B99E0",
        "subcategories": { "a": "歌词分析", "b": "旋律评价", "c": "编曲技术" } 
    },
    "2": { 
        "label": "歌手相关🎤", 
        "color": "#4BDBB5",
        "subcategories": { "a": "歌手个人生活", "b": "歌手的艺术成就" } 
    },
    "3": { 
        "label": "古诗词相关📜", 
        "color": "#FFD966",
        "subcategories": { "a": "古诗词原文引用", "b": "古诗词意境再现", "c": "古诗词现代解读" } 
    },
    "4": { 
        "label": "情感与经历❤️", 
        "color": "#FF9999",
        "subcategories": { 
            "a": "积极反馈", "b": "批评意见", "c": "怀旧情绪", 
            "d": "文化认同感", "e": "个人经历分享", "f": "生活感悟" 
        } 
    },
    "5": { 
        "label": "其他📝", 
        "color": "#A9A9A9",
        "subcategories": { "a": "广告或推广信息", "b": "非相关内容" } 
    }
};

// 定义用于生成颜色的函数 - 保持不变
function getColorForCategory(mainCat, subCat) {
    const baseColor = categoryMap[mainCat].color;
    const opacity = 0.3 + (Object.keys(categoryMap[mainCat].subcategories).indexOf(subCat) * 0.2);
    return baseColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
}

// 读取数据函数 - 保持不变
function readExcelFile() {
    return new Promise((resolve, reject) => {
        // 从GitHub获取JSON数据
        fetch('https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/sort_comment.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`网络错误: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('获取数据出错:', error);
                reject(error);
            });
    });
}

// processCategories函数 - 保持不变
function processCategories(data) {
    // 初始化分类计数器和评论存储
    const categoryCounts = {};
    const commentsByCategory = {};
    
    // 遍历所有数据
    data.forEach(row => {
        const categoryKey = row['分类结果'];
        
        // 检查分类是否存在且格式正确（如 1.a）
        if (categoryKey && typeof categoryKey === 'string' && categoryKey.match(/^\d\.\w$/)) {
            const [mainCategory, subCategory] = categoryKey.split('.');
            
            // 验证主分类和子分类是否在映射表中
            if (categoryMap[mainCategory] && 
                categoryMap[mainCategory].subcategories[subCategory]) {
                
                // 初始化分类计数和评论存储
                if (!categoryCounts[mainCategory]) {
                    categoryCounts[mainCategory] = {};
                    commentsByCategory[mainCategory] = {};
                }
                
                // 计数子分类
                if (!categoryCounts[mainCategory][subCategory]) {
                    categoryCounts[mainCategory][subCategory] = 1;
                    commentsByCategory[mainCategory][subCategory] = [];
                } else {
                    categoryCounts[mainCategory][subCategory]++;
                }
                
                // 存储评论
                commentsByCategory[mainCategory][subCategory].push({
                    text: row['评论内容'],
                    song: row['歌曲名称'] || '未知歌曲',
                    artist: row['歌手名称'] || '未知歌手',
                    category: categoryKey  // 添加完整的类别信息
                });
            }
        }
    });

    // 计算每个主分类的总数量
    const mainCategorySums = {};
    Object.keys(categoryCounts).forEach(mainCat => {
        mainCategorySums[mainCat] = Object.values(categoryCounts[mainCat])
            .reduce((sum, value) => sum + value, 0);
    });
    
    // 计算所有评论的总数量
    const totalComments = Object.values(mainCategorySums)
        .reduce((sum, value) => sum + value, 0);

    // 转换为图表所需格式
    const chartData = Object.keys(categoryCounts).map(mainCat => {
        const subcategories = Object.keys(categoryCounts[mainCat]).map(subCat => ({
            name: categoryMap[mainCat].subcategories[subCat],
            value: categoryCounts[mainCat][subCat],
            color: getColorForCategory(mainCat, subCat),
            comments: commentsByCategory[mainCat][subCat]
        }));
        
        return {
            label: categoryMap[mainCat].label,
            color: categoryMap[mainCat].color,
            segments: subcategories,
            totalValue: mainCategorySums[mainCat], // 添加总数量
            percent: mainCategorySums[mainCat] / totalComments // 添加百分比
        };
    });

    return { chartData, commentsByCategory, totalComments };
}

// 修改渲染条形图函数，添加事件监听器确保提示框显示
function renderBarChart(chartData, totalComments) {
    const barChart = document.getElementById('tc-barChart');
    barChart.innerHTML = ''; // 清空之前的图表
    
    // 使用屏幕宽度作为基准
    const maxWidth = window.innerWidth * 0.9; // 使用屏幕宽度的80%
    
    // 使用更大的缩放因子
    const scaleFactor = 1.5;
    
    chartData.forEach(category => {
        const barGroup = document.createElement('div');
        barGroup.className = 'tc-bar-group';
        
        const label = document.createElement('div');
        label.className = 'tc-bar-label';
        label.textContent = category.label;
        barGroup.appendChild(label);
        
        const bar = document.createElement('div');
        bar.className = 'tc-bar';
        
        // 计算当前分类占总评论的百分比
        const barWidth = (category.totalValue / totalComments) * maxWidth * scaleFactor;
        
        // 创建每个细分块
        category.segments.forEach(segment => {
            // 计算细分块在当前主分类中的占比
            const segmentPercent = segment.value / category.totalValue;
            const segmentWidth = segmentPercent * barWidth;
            
            const segmentEl = document.createElement('div');
            segmentEl.className = 'tc-bar-segment';
            segmentEl.style.width = `${segmentWidth}px`;
            segmentEl.style.backgroundColor = segment.color;
            segmentEl.style.position = 'relative'; // 确保相对定位以便tooltip正确显示
            
            // 创建提示框 - 添加内联样式确保可见性
            const tooltip = document.createElement('div');
            tooltip.className = 'tc-tooltip';
            tooltip.textContent = `${segment.name}: ${segment.value}`;
            
            // 添加基本的内联样式确保提示框正常工作
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.bottom = '40px';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.whiteSpace = 'nowrap';
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.3s';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '9999';
            
            segmentEl.appendChild(tooltip);
            
            // 添加鼠标事件监听器
            segmentEl.addEventListener('mouseenter', () => {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            });
            
            segmentEl.addEventListener('mouseleave', () => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            });
            
            bar.appendChild(segmentEl);
        });
        
        barGroup.appendChild(bar);
        barChart.appendChild(barGroup);
    });
}

// 根据评论查找对应的颜色 - 保持不变
function findCategoryColor(comment) {
    const [mainCat, subCat] = comment.category.split('.');
    return getColorForCategory(mainCat, subCat);
}

// 修改renderLyrics函数中的事件监听器部分
function renderLyrics(commentsByCategory) {
    const lyricsContainer = document.getElementById('tc-lyricsContainer');
    lyricsContainer.innerHTML = ''; // 清空之前的评论
    const rowCount = 6; // 增加行数以填满空间
    
    // 收集所有评论
    const allComments = [];
    Object.values(commentsByCategory).forEach(mainCat => {
        Object.values(mainCat).forEach(comments => {
            allComments.push(...comments);
        });
    });
    
    // 创建多行歌词
    for (let i = 0; i < rowCount; i++) {
        const lyricsRow = document.createElement('div');
        lyricsRow.className = 'tc-lyrics-row';
        lyricsRow.style.top = `${i * 50}px`; // 增加间距
        
        // 不同行设置不同的起始位置
        const startPosition = 20 + (i * 15);
        lyricsRow.style.right = `${startPosition}%`;
        
        // 在每行添加随机评论
        const shuffledLyrics = [...allComments].sort(() => 0.5 - Math.random());
        const rowLyrics = shuffledLyrics.slice(0, 15);
        
        rowLyrics.forEach(commentData => {
            const lyricItem = document.createElement('div');
            lyricItem.className = 'tc-lyric-item';
            
            const circle = document.createElement('div');
            circle.className = 'tc-lyric-circle';
            // 根据评论的完整类别信息选择颜色
            const categoryColor = findCategoryColor(commentData);
            circle.style.backgroundColor = categoryColor;
            
            const icon = document.createElement('div');
            icon.className = 'tc-music-icon';
            icon.innerHTML = '♪';
            circle.appendChild(icon);
            
            const songInfo = document.createElement('div');
            songInfo.className = 'tc-song-info';
            songInfo.textContent = `${commentData.song} - ${commentData.artist}`;
            
            circle.appendChild(songInfo);
            
            const text = document.createElement('div');
            text.className = 'tc-lyric-text';
            text.textContent = commentData.text;
            
            lyricItem.appendChild(circle);
            lyricItem.appendChild(text);
            
            // 事件监听器 - 当鼠标悬停时暂停动画
            circle.addEventListener('mouseenter', () => {
                lyricsRow.classList.add('tc-paused');
            });
            
            circle.addEventListener('mouseleave', () => {
                lyricsRow.classList.remove('tc-paused');
            });
            
            text.addEventListener('mouseenter', () => {
                lyricsRow.classList.add('tc-paused');
            });
            
            text.addEventListener('mouseleave', () => {
                lyricsRow.classList.remove('tc-paused');
            });
            
            lyricsRow.appendChild(lyricItem);
        });
        
        lyricsContainer.appendChild(lyricsRow);
    }
}

// 主流程
async function initVisualization() {
    try {
        // 读取JSON数据
        const jsonData = await readExcelFile();
        
        // 处理分类数据
        const { chartData, commentsByCategory, totalComments } = processCategories(jsonData);
        
        // 渲染图表
        renderBarChart(chartData, totalComments);
        
        // 渲染评论流
        renderLyrics(commentsByCategory);
    } catch (error) {
        console.error('加载数据出错:', error);
        alert('无法加载数据，请检查网络连接或数据格式。');
    }
    
    // 在initVisualization函数最后调用
    addEmergencyTooltip();
}

// 修改页面加载时直接初始化可视化，无需加载指示器
document.addEventListener('DOMContentLoaded', () => {
    // 直接初始化可视化
    initVisualization();
});

// 在initVisualization函数底部添加
function addEmergencyTooltip() {
    // 创建全局提示框
    const body = document.querySelector('body');
    const emergencyTooltip = document.createElement('div');
    emergencyTooltip.id = 'emergency-tooltip';
    emergencyTooltip.style.position = 'fixed';
    emergencyTooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    emergencyTooltip.style.color = 'white';
    emergencyTooltip.style.padding = '5px 10px';
    emergencyTooltip.style.borderRadius = '4px';
    emergencyTooltip.style.fontSize = '12px';
    emergencyTooltip.style.zIndex = '100000';
    emergencyTooltip.style.display = 'none';
    emergencyTooltip.style.pointerEvents = 'none';
    body.appendChild(emergencyTooltip);
    
    // 为所有segments添加事件
    const segments = document.querySelectorAll('.tc-bar-segment');
    segments.forEach(segment => {
        const segmentData = segment.querySelector('.tc-tooltip').textContent;
        
        segment.addEventListener('mouseenter', (e) => {
            emergencyTooltip.textContent = segmentData;
            emergencyTooltip.style.display = 'block';
            
            // 根据鼠标位置更新位置
            document.addEventListener('mousemove', updatePosition);
        });
        
        segment.addEventListener('mouseleave', () => {
            emergencyTooltip.style.display = 'none';
            document.removeEventListener('mousemove', updatePosition);
        });
    });
    
    function updatePosition(e) {
        emergencyTooltip.style.left = (e.clientX + 10) + 'px';
        emergencyTooltip.style.top = (e.clientY - 30) + 'px';
    }
}