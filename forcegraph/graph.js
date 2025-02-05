// Define the processData function
function processData(rawData) {
    if (!Array.isArray(rawData)) {
        console.error('输入数据格式错误:', rawData);
        return { nodes: [], links: [] };
    }

    const nodes = new Map();
    const links = [];
    
    rawData.forEach(item => {
        if (!item?.singer || !item?.poem_matches) return;
        
        const singer = item.singer;
        
        if (!nodes.has(singer)) {
            nodes.set(singer, {
                id: singer,
                group: 1,
                type: 'singer',
                connectedPoems: new Set(),
                connections: 0
            });
        }
        
        Object.entries(item.poem_matches).forEach(([_, poem]) => {
            if (!poem?.title || !poem?.writer) return;
            
            const poemId = `${poem.title}·${poem.writer}`;
            
            if (!nodes.has(poemId)) {
                nodes.set(poemId, {
                    id: poemId,
                    group: 2,
                    type: 'poetry',
                    writer: poem.writer,
                    title: poem.title,
                    connectedSingers: new Set(),
                    connections: 0
                });
            }
            
            const singerNode = nodes.get(singer);
            const poemNode = nodes.get(poemId);
            
            singerNode.connectedPoems.add(poemId);
            poemNode.connectedSingers.add(singer);
            
            links.push({
                source: singer,
                target: poemId,
                matchingChars: poem.chars.join(''),
                songTitle: item.song
            });
        });
    });

    let singerSizes = Array.from(nodes.values())
        .filter(n => n.group === 1)
        .map(n => n.connectedPoems.size);
    let poetrySizes = Array.from(nodes.values())
        .filter(n => n.group === 2)
        .map(n => n.connectedSingers.size);

    const singerScale = d3.scaleSqrt()
        .domain([Math.min(...singerSizes), Math.max(...singerSizes)])
        .range([CONFIG.radius.singer.min, CONFIG.radius.singer.max]);

    const poetryScale = d3.scaleSqrt()
        .domain([Math.min(...poetrySizes), Math.max(...poetrySizes)])
        .range([CONFIG.radius.poetry.min, CONFIG.radius.poetry.max]);

    const finalNodes = Array.from(nodes.values()).map(node => {
        const baseNode = {
            ...node,
            connections: node.group === 1 ? node.connectedPoems.size : node.connectedSingers.size
        };

        if (node.group === 1) {
            return {
                ...baseNode,
                radius: singerScale(node.connectedPoems.size),
                poemCount: node.connectedPoems.size,
                displaySize: singerScale(node.connectedPoems.size).toFixed(1)
            };
        } else {
            return {
                ...baseNode,
                radius: poetryScale(node.connectedSingers.size),
                singerCount: node.connectedSingers.size,
                displaySize: poetryScale(node.connectedSingers.size).toFixed(1)
            };
        }
    });

    return {
        nodes: finalNodes,
        links: links
    };
}

// Define the createForceGraph function
function createForceGraph(data, config) {
    d3.select("#graph").selectAll("*").remove();

    const style = document.createElement('style');
    style.textContent = `
        .node circle {
            transition: none; /* Remove transitions for immediate highlight */
        }
        .link {
            transition: none; /* Remove transitions for immediate highlight */
        }
        .node.dimmed circle {
            opacity: 0.15;
        }
        .link.dimmed {
            opacity: 0.15;
        }
        .node.highlighted circle {
            stroke: #666;
            stroke-width: 3px;
        }
        .link.highlighted {
            stroke: #666;
            stroke-width: 2px;
        }
        .tooltip {
            padding: 10px;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #ddd;
            border-radius: 4px;
            pointer-events: none;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            position: absolute;
            opacity: 0;
            z-index: 100;
        }
    `;
    document.head.appendChild(style);

    const svg = d3.select("#graph")
        .append("svg")
        .attr("width", config.width)
        .attr("height", config.height)
        .style("position", "absolute")
        .style("top", `${config.svg.position.top}px`)
        .style("left", `${config.svg.position.left}px`)
        .style("background-color", "#ffffff")
        .style("border-radius", "8px");

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    const g = svg.append("g");
    
    const zoom = d3.zoom()
        .scaleExtent([config.zoom.min, config.zoom.max])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom)
       .call(zoom.transform, d3.zoomIdentity
            .translate(350, 270)
            .scale(0.15));

    const nodeLinks = new Map();
    const connectedNodes = new Map();
    
    data.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (!connectedNodes.has(sourceId)) {
            connectedNodes.set(sourceId, new Set());
        }
        if (!connectedNodes.has(targetId)) {
            connectedNodes.set(targetId, new Set());
        }
        connectedNodes.get(sourceId).add(targetId);
        connectedNodes.get(targetId).add(sourceId);
        
        if (!nodeLinks.has(sourceId)) {
            nodeLinks.set(sourceId, new Set());
        }
        if (!nodeLinks.has(targetId)) {
            nodeLinks.set(targetId, new Set());
        }
        nodeLinks.get(sourceId).add(link);
        nodeLinks.get(targetId).add(link);
    });

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance(config.force.distance))
        .force("charge", d3.forceManyBody()
            .strength(config.force.nodeStrength)
            .distanceMax(500))
        .force("center", d3.forceCenter(config.width / 2, config.height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius * 1.2))
        .velocityDecay(0.6);

    const link = g.append("g")
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5);

    const node = g.append("g")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
        .attr("class", "node")
        .call(drag(simulation));

    node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.group === 1 ? config.colors.singer : config.colors.poetry)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    function getConnectedElements(nodeId) {
        const connected = new Set();
        const links = new Set();
        
        connectedNodes.get(nodeId)?.forEach(id => {
            connected.add(id);
        });
        
        nodeLinks.get(nodeId)?.forEach(link => {
            links.add(link);
        });
        
        return { nodes: connected, links: links };
    }

    function highlightConnections(nodeId, isHighlighted = true) {
        const { nodes: connectedNodes, links: connectedLinks } = getConnectedElements(nodeId);
        
        requestAnimationFrame(() => {
            node.each(function(d) {
                const element = d3.select(this);
                const isConnected = connectedNodes.has(d.id) || d.id === nodeId;
                
                element
                    .classed("dimmed", isHighlighted && !isConnected)
                    .classed("highlighted", isHighlighted && isConnected);
            });

            link.each(function(d) {
                const element = d3.select(this);
                const isConnected = connectedLinks.has(d);
                
                element
                    .classed("dimmed", isHighlighted && !isConnected)
                    .classed("highlighted", isHighlighted && isConnected);
            });
        });
    }

    function getTooltipContent(d) {
        const content = document.createElement('div');
        content.className = 'tooltip-content';
        content.innerHTML = ` 
            <h4 style="margin:0 0 8px;color:${d.group === 1 ? '#FFB6C1' : '#87CEEB'}">${d.id}</h4>
            <p style="margin:4px 0">类型: ${d.group === 1 ? '歌手' : '诗词'}</p>
            ${d.group === 1 
                ? `<p style="margin:4px 0">演唱古诗词数: ${d.poemCount}</p>`
                : `<p style="margin:4px 0">作者: ${d.writer}</p>
                   <p style="margin:4px 0">被演唱次数: ${d.singerCount}</p>`
            }
        `;
        return content.outerHTML;
    }

    let currentHighlight = null;

    node
        .on("mouseover", function(event, d) {
            if (currentHighlight !== d.id) {
                currentHighlight = d.id;
                highlightConnections(d.id, true);
            }

            tooltip
                .html(getTooltipContent(d))
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px")
                .style("opacity", 1);
        })
        .on("mouseout", function() {
            currentHighlight = null;
            highlightConnections(null, false);
            tooltip.style("opacity", 0);
        });

    simulation.on("tick", () => {
        requestAnimationFrame(() => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });
    });

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.1).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

// Once the DOM is ready, load the data and create the force graph
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await d3.json("https://raw.githubusercontent.com/todayispdxxx/poetry-lyrics/refs/heads/main/DATA/merged-new-data.json");
        const graphData = processData(response);
        createForceGraph(graphData, CONFIG);
    } catch (error) {
        console.error('加载或处理数据时出错:', error);
    }
});
