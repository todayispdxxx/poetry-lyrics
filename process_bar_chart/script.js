// 配置
const width = 800;
const height = 100;
const margin = {top: 30, right: 30, bottom: 20, left: 50}; // 增加左侧边距
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

// 从GitHub加载数据
d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/main/DATA/new_output_with_ids.json")
  .then(data => {
    console.log("数据加载成功:", data);

    if (!Array.isArray(data)) {
      throw new Error("加载的数据格式不正确");
    }

    const songData = data.find(d => d.actual_song === "但愿人长久" && d.actual_singer === "邓丽君");
    if (!songData) {
      throw new Error("未找到歌曲《淡淡幽情》的数据");
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

// 创建比例尺
const xScale = d3.scaleLinear()
  .domain([0, totalLyrics])
  .range([decorationPadding + decorationRadius * 2, width - margin.left - margin.right - decorationPadding - decorationRadius * 2]);

    // 创建虚线背景
    svg.append("line")
      .attr("x1", 20)
      .attr("y1", height/2 - margin.top)
      .attr("x2", width - margin.left - margin.right + 20)
      .attr("y2", height/2 - margin.top)
      .attr("stroke", "#cccccc")
      .attr("stroke-width", 1.0)
      .attr("stroke-dasharray", "3,3");

    // 添加头尾装饰点
    svg.selectAll(".endpoint")
      .data([0, totalLyrics])
      .join("circle")
      .attr("class", "endpoint")
      .attr("cx", (d, i) => i === 0 ? 15 : width - margin.left - margin.right - 10)
      .attr("cy", height/2 - margin.top)
      .attr("r", decorationRadius)
      .attr("fill", "#666666")
      .style("pointer-events", "none") // 防止装饰点干扰鼠标事件
      .style("display", "block"); // 确保装饰点显示

    // 在进度条前添加圆形装饰
    svg.append("circle")
      .attr("cx", -30)
      .attr("cy", height/2 - margin.top -5)
      .attr("r", 35)
      .attr("fill", "#999");

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
      .style("pointer-events", "none");

    // 创建古诗词位置的圆角矩形
    svg.selectAll(".poem-segment")
      .data(segments)
      .join("rect")
      .attr("class", "poem-segment")
      .attr("x", d => xScale(d.start))
      .attr("y", height/2 - margin.top - 4)
      .attr("width", d => Math.min(
          xScale(d.end - d.start + 1),
          width - margin.left - margin.right - decorationPadding - decorationRadius * 2 - xScale(d.start)
      ))
      .attr("height", 8)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "#1CCEAC")
      .style("stroke", "#666666")
      .style("stroke-width", "1px")
      .style("transition", "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)")
      .on("mouseover", function(event, d) {
          // 先准备tooltip内容
          const segmentChars = [];
          for (let pos = d.start; pos <= d.end; pos++) {
            if (positionToChars.has(pos)) {
              segmentChars.push(positionToChars.get(pos));
            }
          }
          
          const allTitles = new Set();
          Object.values(poemMatches).forEach(match => {
            const matchPositions = match.positions;
            const hasOverlap = matchPositions.some(pos => pos >= d.start && pos <= d.end);
            if (hasOverlap) {
              allTitles.add(`《${match.title}》`);
            }
          });
          
          const charsToShow = segmentChars.length > 0 ? 
            segmentChars.join("") : "无匹配字符";
          const charCount = segmentChars.length;
          const positionRange = `${d.start + 1}-${d.end + 1}`;
          
          const rect = this.getBoundingClientRect();
          const tooltipContent = `
            <div style="text-align: center">
              <div>
                <span style="color: #666; font-style: italic">${charsToShow}</span>
              </div>
              <div style="margin-top: 4px; color: #666">
                <div style="text-align: left">出处：</div>
                ${Array.from(allTitles).map(title => `<div style="text-align: left; text-indent: 2em">${title}</div>`).join("")}
                <div style="text-align: left">字数：${charCount} 字</div>
                <div style="text-align: left">位置：${positionRange}</div>
              </div>
            </div>
          `;

          // 先停止所有正在进行的动画
          d3.select(this).interrupt();
          tooltip.interrupt();

          // 同时执行矩形和tooltip动画
          d3.select(this)
              .transition()
              .duration(150)
              .ease(d3.easeCubicOut)
              .attr("height", 10)
              .style("stroke-width", "1.5px")
              .style("fill", "#19b798")
              .style("transform", "scale(1.02)");

          tooltip.html(tooltipContent)
              .style("left", (rect.left + window.scrollX + rect.width/2) + "px")
              .style("top", (rect.bottom + window.scrollY + 5) + "px")
              .style("transform", "translateX(-50%)")
              .style("opacity", 0)
              .transition()
              .duration(150)
              .ease(d3.easeCubicOut)
              .style("opacity", 0.9);
      })
      .on("mouseout", function() {
          // 先停止所有正在进行的动画
          d3.select(this).interrupt();
          tooltip.interrupt();

          // 同时执行矩形和tooltip消失动画
          d3.select(this)
              .transition()
              .duration(150)
              .ease(d3.easeCubicOut)
              .attr("height", 8)
              .style("stroke-width", "1px")
              .style("fill", "#1CCEAC")
              .style("transform", "scale(1)");

          tooltip.transition()
              .duration(150)
              .ease(d3.easeCubicOut)
              .style("opacity", 0)
              .on("end", () => {
                  tooltip.style("display", "none");
                  // 确保最终状态正确
                  d3.select(this)
                      .attr("height", 8)
                      .style("stroke-width", "1px")
                      .style("fill", "#1CCEAC");
              });
      })
      .on("mouseenter", function() {
          tooltip.style("display", "block");
      });
  })
