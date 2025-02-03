// 配置
const width = 800;
const height = 300;
const margin = {top: 130, right: 50, bottom: 20, left: 70}; // 增加左侧边距
const dotRadius = 1.5;  
const decorationRadius = 3.5;   
const decorationPadding = 10;   

// 创建SVG容器
const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", `translate(${margin.left + 40},${margin.top})`); // 向右移动40px

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

// 从GitHub加载数据
d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/matches.json")
  .then(data => {
    console.log("数据加载成功:", data);

    if (!Array.isArray(data)) {
      throw new Error("加载的数据格式不正确");
    }

    const songData = data.find(d => d.actual_song === "但愿人长久" && d.actual_singer === "邓丽君");
    if (!songData) {
      throw new Error("未找到歌曲的数据");
    }

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

    // 创建比例尺（排除装饰点区域）
    const xScale = d3.scaleLinear()
      .domain([0, totalLyrics])
      .range([decorationPadding + decorationRadius * 4, width - margin.left - margin.right - decorationPadding - decorationRadius * 4])
      .clamp(true); // 防止超出范围

    // 计算有效宽度（不包括装饰点区域）
    const effectiveWidth = width - margin.left - margin.right - decorationPadding * 2 - decorationRadius * 8;

    // 创建虚线背景
    svg.append("line")
      .attr("x1", decorationPadding + decorationRadius * 2 + 5)  // 起点向右移动
      .attr("y1", height/2 - margin.top)
      .attr("x2", width - margin.left - margin.right - decorationPadding - decorationRadius * 2 - 5)  // 终点向左移动
      .attr("y2", height/2 - margin.top)
      .attr("stroke", "#cccccc")
      .attr("stroke-width", 1.0)
      .attr("stroke-dasharray", "3,3");

    // 添加头尾装饰点
    svg.selectAll(".endpoint")
      .data([0, totalLyrics])
      .join("circle")
      .attr("class", "endpoint")
      .attr("cx", (d, i) => i === 0 ? decorationPadding + decorationRadius * 2 : width - margin.left - margin.right - decorationPadding - decorationRadius * 2)
      .attr("cy", height/2 - margin.top)
      .attr("r", decorationRadius)
      .attr("fill", "#666666")
      .style("pointer-events", "none") // 防止装饰点干扰鼠标事件
      .style("display", "block"); // 确保装饰点显示

    // 在进度条前添加图片装饰
    svg.append("image")
      .attr("x", -70)
      .attr("y", height/2 - margin.top - 35)
      .attr("width", 70)
      .attr("height", 70)
      .attr("xlink:href", "/src/image/denglijun_barimg.png")
      .style("border", "2px solid black")
      .style("border-radius", "50%");

    // 添加标题组
    const titleGroup = svg.append("g")
      .attr("transform", `translate(${decorationPadding}, 0)`);

    const title = titleGroup.append("text")
      .attr("y", -5)
      .attr("x", 0)
      .style("font-family", "DFPSongW12-GB")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(`《${songData.actual_song}》`);

    titleGroup.append("text")
      .attr("y", -5)
      .attr("x", () => title.node().getComputedTextLength() + 10)
      .style("font-family", "楷体")
      .style("font-size", "14px")
      .text(songData.actual_singer);

    // 添加日期信息
    svg.append("text")
      .attr("x", 15)
      .attr("y", height/2 - margin.top + 30)
      .style("font-family", "DFPSongW12-GB")
      .style("fill", "#E86138")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .text(songData.date);

    // 创建tooltip
    const tooltip = d3.select("#chart")
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
      .style("max-width", "400px")  // 限制最大宽度
      .style("word-wrap", "break-word")  // 文本自动换行
      .style("overflow-y", "auto")  // 添加垂直滚动
      .style("max-height", "300px");  // 限制最大高度

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
    svg.selectAll(".poem-segment")
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
      .attr("height", 10)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "#1CCEAC")
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

            const matches = Object.values(poemMatches).filter(m => 
                m.positions.some(pos => pos >= d.start && pos <= d.end)
            );

            let tooltipContent = `<div class="lyric">${chars}</div><div class="divider"></div>`;

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
svg.selectAll(".poem-segment")
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

}); // Close the .then() block
