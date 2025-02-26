// 配置
const width = 1000;
const height = 100;  // 减小单个图表高度
const totalHeight = height * 9 + 30 * 8;  // 总高度加上间距
const margin = {top: 20, right: 70, bottom: 20, left: 120}; 
const dotRadius = 1.5;  
const decorationRadius = 3.5;   
const decorationPadding = 10;   

// 在全局配置部分添加新的参数
const baseWidth = 500;  // 基础宽度
const charWidthFactor = 3;  // 每个字符增加的宽度（像素）
const minChartWidth = 500;  // 最小图表宽度
const maxChartWidth = 1200; // 最大图表宽度

// 定义每个图表的颜色配置
const chartColors = [
    "#FD8C90",  // 第一个图表的颜色
    "#FFD363",  // 第二个图表的颜色
    "#1CCEAC",  // 第三个图表的颜色
    "#1CCEAC",  // 第四个图表的颜色
    "#FD8C90",  // 第五个图表的颜色
    "#FFD363",  // 第六个图表的颜色
    "#1CCEAC",  // 第七个图表的颜色
    "#FFD363"   // 第八个图表的颜色
];

// 定义每个图表的图片路径
const imageUrls = [
    "src/image/fhcq_barimg.png",  // 第一个图表的图片 中国喜事
    "src/image/dlj_barimg.png",  // 第二个图表的图片 但愿人长久
    "src/image/myf_barimg.png",  // 第三个图表的图片 相思
    "src/image/ppx_barimg.png",  // 第四个图表的图片 琵琶行
    "src/image/yl_barimg.png",  // 第五个图表的图片 秋水
    "src/image/mam_barimg.png",  // 第六个图表的图片 床前明月光
    "src/image/zyj_barimg.png",  // 第七个图表的图片 煎饼侠
    "src/image/wf_barimg.png"  // 第八个图表的图片 致青春
];

// 创建主SVG容器
const mainSvg = d3.select("#chart")
    .append("svg")
    .attr("width", maxChartWidth)  // 使用最大宽度
    .attr("height", totalHeight);

// 创建8个子图表
const charts = [];
for(let i = 0; i < 8; i++) {
    const svg = mainSvg.append("g")
        .attr("class", `chart-${i}`)
        .attr("transform", `translate(${margin.left + 40}, ${i * (height + 50) + margin.top})`);
    charts.push(svg);
}

// 使用charts数组中的svg对象来绘制每个图表
// 例如：charts[0]表示第一个图表的svg容器

// 增强版文本处理函数
function processContent(content) {
  const noBrackets = content.replace(/\([^)]*\)/g, ''); // 移除所有括号及其内容
  const cleanedChars = [];
  const originalIndices = [];
  const regex = /[^\s\p{P}]/gu;
  let match;

  while ((match = regex.exec(noBrackets)) !== null) {
      cleanedChars.push(match[0]);
      originalIndices.push(match.index);
  }
  return { cleanedChars, originalIndices, original: noBrackets };
}

// 修复processLyricAndMatches函数中的高亮逻辑问题
function processLyricAndMatches(lyric, matchingFragments) {
    // 如果没有匹配片段，直接返回原始歌词
    if (!matchingFragments || !lyric) {
        return lyric;
    }
    
    // 清理歌词和匹配片段的标点及空格
    const cleanText = text => text.replace(/[\s\p{P}]/gu, '');
    const cleanedLyric = cleanText(lyric);
    const cleanedMatching = cleanText(matchingFragments);
    
    // 创建两个方向的映射：清理后索引到原始索引，以及原始索引到清理后索引
    const cleanToOriginalMap = [];
    const originalToCleanMap = new Map();
    let cleanIndex = 0;
    
    for (let i = 0; i < lyric.length; i++) {
        if (!lyric[i].match(/[\s\p{P}]/gu)) {
            cleanToOriginalMap[cleanIndex] = i;
            originalToCleanMap.set(i, cleanIndex);
            cleanIndex++;
        }
    }
    
    // 查找连续三个及以上字符相同的部分
    const highlightRanges = [];
    const minMatchLength = 3;
    
    // 在整个匹配片段中查找匹配
    for (let i = 0; i < cleanedLyric.length - minMatchLength + 1; i++) {
        // 跳过已处理的字符
        let alreadyHighlighted = false;
        for (const range of highlightRanges) {
            const cleanStart = originalToCleanMap.get(range.start) || 0;
            const cleanEnd = originalToCleanMap.get(range.end - 1) || 0;
            if (i >= cleanStart && i < cleanEnd) {
                alreadyHighlighted = true;
                break;
            }
        }
        if (alreadyHighlighted) continue;
        
        // 在匹配片段中查找当前子串
        for (let matchStart = 0; matchStart <= cleanedMatching.length - minMatchLength; matchStart++) {
            let matchLength = 0;
            
            // 计算当前位置开始的最大匹配长度
            while (
                i + matchLength < cleanedLyric.length && 
                matchStart + matchLength < cleanedMatching.length && 
                cleanedLyric[i + matchLength] === cleanedMatching[matchStart + matchLength]
            ) {
                matchLength++;
            }
            
            // 如果找到足够长的匹配
            if (matchLength >= minMatchLength) {
                // 确保获取到正确的原始索引
                const startOriginalIndex = cleanToOriginalMap[i];
                const endOriginalIndex = cleanToOriginalMap[i + matchLength - 1] + 1; // +1 包含最后一个字符
                
                // 确保索引有效
                if (startOriginalIndex !== undefined && endOriginalIndex !== undefined) {
                    highlightRanges.push({
                        start: startOriginalIndex,
                        end: endOriginalIndex,
                        text: lyric.slice(startOriginalIndex, endOriginalIndex),
                        // 添加调试信息
                        cleanStart: i,
                        cleanEnd: i + matchLength,
                        matchedText: cleanedLyric.slice(i, i + matchLength)
                    });
                }
                
                // 跳过已匹配的字符
                i += matchLength - 1;
                break; // 找到一个匹配就跳出当前匹配片段的循环
            }
        }
    }
    
    // 对区间进行排序
    highlightRanges.sort((a, b) => a.start - b.start);
    
    // 合并重叠的区间
    const mergedRanges = [];
    if (highlightRanges.length > 0) {
        let current = highlightRanges[0];
        for (let i = 1; i < highlightRanges.length; i++) {
            // 如果当前区间与前一个区间有重叠或相邻
            if (highlightRanges[i].start <= current.end) {
                current.end = Math.max(current.end, highlightRanges[i].end);
                current.text = lyric.slice(current.start, current.end);
            } else {
                mergedRanges.push(current);
                current = highlightRanges[i];
            }
        }
        mergedRanges.push(current);
    }
    
    // 生成带有高亮标记的文本
    let result = '';
    let lastIndex = 0;
    
    mergedRanges.forEach(range => {
        result += lyric.slice(lastIndex, range.start);
        result += `<span class="highlight">${range.text}</span>`;
        lastIndex = range.end;
    });
    
    result += lyric.slice(lastIndex);
    return result;
}

// 定义要显示的8首歌曲信息
const songsToDisplay = [
    { song: "中国喜事", singer: "凤凰传奇" },
    { song: "但愿人长久", singer: "邓丽君" },
    { song: "相思", singer: "毛阿敏" },
    { song: "琵琶行", singer: "奇然, 沈谧仁" },
    { song: "秋水", singer: "银临" },
    { song: "床前明月光", singer: "梅艳芳" },
    { song: "煎饼侠", singer: "赵英俊" },
    { song: "致青春", singer: "王菲" }
];

// 创建tooltip（使用body作为父容器）
const tooltip = d3.select("body")  // 改为选择body
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("font-size", "12px")
    .style("pointer-events", "auto")
    .style("max-width", "350px")
    .style("word-wrap", "break-word")
    .style("overflow-y", "auto")
    .style("max-height", "200px");

// 添加tooltip显示状态变量
let tooltipTimeout;
let isTooltipFixed = false;
let fixedPosition = { x: 0, y: 0 };

// 从GitHub加载数据
d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/new_matches.json")
  .then(data => {
    console.log("数据加载成功:", data);

    if (!Array.isArray(data)) {
      throw new Error("加载的数据格式不正确");
    }

    // 修改数据查找逻辑，同时支持song/singer和actual_song/actual_singer格式
    songsToDisplay.forEach((songInfo, index) => {
      // 支持两种格式的歌曲信息
      const songName = songInfo.song || songInfo.actual_song;
      const singerName = songInfo.singer || songInfo.actual_singer;

      const songData = data.find(d => 
          (d.actual_song === songName && d.actual_singer === singerName)
      );

      console.log(`查找歌曲: ${songName} - ${singerName}`, songData ? "找到数据" : "未找到数据");

      if (!songData) {
          console.warn(`未找到歌曲《${songName}》- ${singerName} 的数据`);
          return;
      }

      // 使用之前创建的charts数组中对应的svg绘制图表
      const currentChart = charts[index];
      if (currentChart) {
        const poemMatches = songData.poem_matches;
        if (!poemMatches || Object.keys(poemMatches).length === 0) {
          throw new Error("未找到古诗词位置信息");
        }

        const totalLyrics = songData.lyric_number;

        // 合并所有positions并去重
        const allPositions = new Set();
        const positionToChars = new Map();
        const positionToTitles = new Map();
        
        Object.values(poemMatches).forEach(match => {
          match.positions.forEach((pos, i) => {
            allPositions.add(pos);
            positionToChars.set(pos, match.chars[i]);
            positionToTitles.set(pos, `《${match.title}》`);
          });
        });

        // 将Set转换为数组并排序
        const sortedPositions = Array.from(allPositions).sort((a, b) => a - b);

        // 计算连续位置段
        const segments = [];
        let currentSegment = [];
        sortedPositions.forEach((pos, i) => {
          if (i === 0 || pos !== sortedPositions[i-1] + 1) {
            if (currentSegment.length > 0) {
              segments.push({
                start: currentSegment[0],
                end: currentSegment[currentSegment.length - 1]
              });
            }
            currentSegment = [pos];
          } else {
            currentSegment.push(pos);
          }
        });
        if (currentSegment.length > 0) {
          segments.push({
            start: currentSegment[0],
            end: currentSegment[currentSegment.length - 1]
          });
        }

        // 根据歌词长度计算实际宽度
        const calculatedWidth = Math.min(
            Math.max(
                baseWidth + (songData.lyric_number * charWidthFactor),
                minChartWidth
            ),
            maxChartWidth
        );

        // 创建比例尺（排除装饰点区域）
        const xScale = d3.scaleLinear()
          .domain([0, totalLyrics])
          .range([decorationPadding + decorationRadius * 4, calculatedWidth - margin.left - margin.right - decorationPadding - decorationRadius * 4])
          .clamp(true); // 防止超出范围

        // 计算有效宽度（不包括装饰点区域）
        const effectiveWidth = calculatedWidth - margin.left - margin.right - decorationPadding * 2 - decorationRadius * 8;

        // 创建虚线背景
        currentChart.append("line")
          .attr("x1", decorationPadding + decorationRadius * 2 + 5)  // 起点向右移动
          .attr("y1", height/2 - margin.top)
          .attr("x2", calculatedWidth - margin.left - margin.right - decorationPadding - decorationRadius * 2 - 5)  // 终点向左移动
          .attr("y2", height/2 - margin.top)
          .attr("stroke", "#cccccc")
          .attr("stroke-width", 1.0)
          .attr("stroke-dasharray", "3,3");

        // 添加头尾装饰点
        currentChart.selectAll(".endpoint")
          .data([0, totalLyrics])
          .join("circle")
          .attr("class", "endpoint")
          .attr("cx", (d, i) => i === 0 ? decorationPadding + decorationRadius * 2 : calculatedWidth - margin.left - margin.right - decorationPadding - decorationRadius * 2)
          .attr("cy", height/2 - margin.top)
          .attr("r", decorationRadius)
          .attr("fill", "#666666")
          .style("pointer-events", "none") // 防止装饰点干扰鼠标事件
          .style("display", "block"); // 确保装饰点显示

        // 在进度条前添加图片装饰
        currentChart.append("image")
          .attr("x", -90)
          .attr("y", height/2 - margin.top - 50)
          .attr("width", 90)
          .attr("height", 90)
          .attr("xlink:href", imageUrls[index])  // 使用对应索引的图片
          .style("border", "2px solid black")
          .style("border-radius", "50%");

        // 添加标题组
        const titleGroup = currentChart.append("g")
          .attr("transform", `translate(${decorationPadding}, 0)`);

        const title = titleGroup.append("text")
          .attr("y", 5)
          .attr("x", 0)
          .style("font-family", "S12")
          .style("font-size", "19px")
          .style("font-weight", "normal")
          .text(`《${songData.actual_song}》`);

        titleGroup.append("text")
          .attr("y", 5)
          .attr("x", () => title.node().getComputedTextLength() + 5)
          .style("font-family", "S7")
          .style("font-size", "15px")
          .text(songData.actual_singer);

        // 添加日期信息
        currentChart.append("text")
          .attr("x", 20)
          .attr("y", height/2 - margin.top + 40)
          .style("font-family", "S12")
          .style("fill", "#E86138")
          .style("font-weight", "normal")
          .style("font-size", "20px")
          .text(songData.date);

        // 创建tooltip
        const tooltip = d3.select("#chart1")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background", "rgba(255, 255, 255, 0.95)")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("padding", "8px")
          .style("font-size", "12px")
          .style("pointer-events", "auto")  // 允许鼠标事件
          .style("max-width", "600px")  // 限制最大宽度
          .style("word-wrap", "break-word")  // 文本自动换行
          .style("overflow-y", "auto")  // 添加垂直滚动
          .style("max-height", "250px");  // 限制最大高度

        // 添加tooltip显示延迟
        let tooltipTimeout;

        // 添加tooltip显示状态变量
        let isTooltipFixed = false;
        let fixedPosition = { x: 0, y: 0 };

        // 添加tooltip鼠标事件
        tooltip
          .on("mouseenter", function() {
              isTooltipFixed = true;
              fixedPosition = {
                  x: parseFloat(tooltip.style("left")),
                  y: parseFloat(tooltip.style("top"))
              };
          })
          .on("mouseleave", function() {
              isTooltipFixed = false;
              tooltip.transition()
                  .duration(200)
                  .style("opacity", 0);
          });

        // 创建古诗词位置的圆角矩形
        let prevEnd = -Infinity;
        currentChart.selectAll(".poem-segment")
          .data(segments)
          .join("rect")
          .attr("class", "poem-segment")
          .attr("x", d => {
            const xPos = Math.max(xScale(d.start), decorationPadding + decorationRadius * 4);
            if (xPos < prevEnd + 10) {
                return prevEnd + 10;
            }
            prevEnd = xPos;
            return xPos;
          })
          .attr("y", height/2 - margin.top - 4)
          .attr("width", d => {
            // 根据字符数量计算宽度
            const charCount = d.end - d.start + 1;
            const charWidth = effectiveWidth / totalLyrics;
            const minWidth = 10;
            const maxWidth = effectiveWidth - (xScale(d.start) - (decorationPadding + decorationRadius * 4));
            return Math.max(minWidth, Math.min(charCount * charWidth * 1, maxWidth));
          })
          .attr("height", 12)
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", chartColors[index])  // 使用对应索引的颜色
          .style("stroke", "#666666")
          .style("stroke-width", "1px")
          .style("opacity", 0.7)
          .style("transition", "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)")
          .on("mouseenter", function(event, d) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => {
                const chars = Array.from(
                    {length: d.end - d.start + 1}, 
                    (_,i) => positionToChars.get(d.start + i) || ""
                ).join("").trim();

                const normalizedLyric = chars.replace(/[\s\p{P}]/gu, '');

                // 修改tooltip内容结构
                let tooltipContent = `
                    <div class="tooltip-content">
                        <div class="song-lyric">
                            <div class="lyric-text">${
                                songData.lyric ? 
                                processLyricAndMatches(songData.lyric, songData.matching_fragments) : 
                                '暂无歌词'
                            }</div>
                        </div>
                        <div class="divider"></div>`;

                // 添加古诗词匹配部分
                const matches = Object.values(poemMatches).filter(m => 
                    m.positions.some(pos => pos >= d.start && pos <= d.end)
                );

                matches.forEach((match, index) => {
                    const { cleanedChars, originalIndices, original } = processContent(match.content);
                    const strPoem = cleanedChars.join('');
                    let highlighted = original;

                    if (strPoem.includes(normalizedLyric)) {
                        const highlights = [];
                        let startIdx = strPoem.indexOf(normalizedLyric);
                        
                        while (startIdx !== -1) {
                            const endIdx = startIdx + normalizedLyric.length;
                            if (endIdx > cleanedChars.length) break;

                            const highlightStart = originalIndices[startIdx];
                            const highlightEnd = originalIndices[endIdx - 1] + 1;

                            highlights.push({ highlightStart, highlightEnd });
                            startIdx = strPoem.indexOf(normalizedLyric, endIdx);
                        }

                        let lastPos = 0;
                        highlighted = highlights.reduce((acc, hl) => {
                            acc += original.slice(lastPos, hl.highlightStart);
                            acc += `<span class="highlight">${original.slice(hl.highlightStart, hl.highlightEnd)}</span>`;
                            lastPos = hl.highlightEnd;
                            return acc;
                        }, '') + original.slice(lastPos);
                    }

            
                    tooltipContent += `
                    <div class="match-item">
                        <div class="source">《${match.title}》</div>
                        <div class="content">${highlighted}</div>
                    </div>
                    ${index < matches.length-1 ? '<div class="divider"></div>' : ''}
                `;
            });

            showTooltip(event, tooltipContent);
          }, 100);
        })
        .on("mouseleave", function(event) {
          clearTimeout(tooltipTimeout);
          hideTooltip(event);
        });
      }
        
      // 显示 tooltip 并处理位置
      function showTooltip(event, tooltipContent) {
        console.log(tooltipContent); // 调试输出提示框内容
        
        const tooltipX = Math.min(
            event.pageX + 10,
            window.innerWidth - tooltip.node().offsetWidth - 20
        );
        const tooltipY = event.pageY + 20;

        tooltip
            .style("display", "block")
            .style("opacity", 0)
            .html(tooltipContent)
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`)
            .transition()
            .duration(200)
            .style("opacity", 1);

        d3.select(event.target)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke-width", "1.5px");
      }

      // 隐藏 tooltip
      function hideTooltip(event) {
        d3.select(event.target)
            .transition()
            .duration(200)
            .style("opacity", 0.7)
            .style("stroke-width", "1px");

        const isOverTooltip = d3.select(".tooltip").node().contains(event.relatedTarget);
        if (!isOverTooltip) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0)
                .on("end", () => tooltip.style("display", "none"));
        }
      }

      // 监听 tooltip 进入和离开的事件
      tooltip
        .on("mouseenter", () => clearTimeout(tooltipTimeout))
        .on("mouseleave", () => {
            tooltipTimeout = setTimeout(() => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0)
                    .on("end", () => tooltip.style("display", "none"));
            }, 100);
        });

      // 鼠标移动时更新 tooltip 位置
      currentChart.selectAll(".poem-segment")
        .on("mousemove", function(event) {
            if (!isTooltipFixed) {
                const tooltipX = Math.min(
                    event.pageX + 10,
                    window.innerWidth - tooltip.node().offsetWidth - 20
                );
                const tooltipY = event.pageY + 20;

                tooltip
                    .style("left", `${tooltipX}px`)
                    .style("top", `${tooltipY}px`);
            } else {
                tooltip
                    .style("left", `${fixedPosition.x}px`)
                    .style("top", `${fixedPosition.y}px`);
            }
        });

      // 鼠标进入 tooltip 时固定位置
      tooltip.on("mouseenter", function() {
        isTooltipFixed = true;
        fixedPosition = {
            x: parseFloat(tooltip.style("left")),
            y: parseFloat(tooltip.style("top"))
        };
        tooltip.transition().duration(200).style("opacity", 1);
      });

      // 鼠标离开 tooltip 时解除固定
      tooltip.on("mouseleave", function() {
        isTooltipFixed = false;
        tooltip.transition()
            .duration(200)
            .style("opacity", 0)
            .on("end", () => tooltip.style("display", "none"));
      });
    });
  })
.catch(error => {
    console.error("数据加载或处理错误:", error);
});

// 添加tooltip位置更新函数
function updateTooltipPosition(event) {
    const tooltipNode = tooltip.node();
    if (!tooltipNode) return;
    
    const tooltipWidth = tooltipNode.offsetWidth || 280;
    const tooltipX = Math.min(
        event.pageX + 10,
        window.innerWidth - tooltipWidth - 20
    );
    const tooltipY = event.pageY + 20;
    
    tooltip
        .style("left", `${tooltipX}px`)
        .style("top", `${tooltipY}px`);
}
