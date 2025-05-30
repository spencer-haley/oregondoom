import { useEffect, useRef, useState } from 'react'; 
import Navbar from '../components/Navbar';
import * as d3 from 'd3';
import Papa from 'papaparse';

export default function EcosystemPage() {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [bandList, setBandList] = useState([]);
  const [focusedBand, setFocusedBand] = useState('');

  useEffect(() => {
    async function loadCSV() {
      try {
        const response = await fetch('/OregonDoomShowChronicling.csv');
        const text = await response.text();
        const { data } = Papa.parse(text, { header: true });
        const parsed = data.filter(e => e.Date && e["Band(s)"]);
        setData(parsed);
      } catch (error) {
        console.error('Failed to load CSV:', error);
      }
    }
    loadCSV();
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const appearanceCounts = {};
    const bandLinks = {};
    const bandYears = {};

    data.forEach(row => {
      const bands = row["Band(s)"].split('|').map(b => b.trim()).filter(Boolean);
      const year = parseInt(row.Date.split('/')[2]);
      const date = new Date(row.Date);
      const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      bands.forEach(b => {
        appearanceCounts[b] = (appearanceCounts[b] || 0) + 1;
        bandYears[b] = bandYears[b] || { first: year, last: year };
        if (year < bandYears[b].first) bandYears[b].first = year;
        if (year > bandYears[b].last) bandYears[b].last = year;
      });

      for (let i = 0; i < bands.length; i++) {
        for (let j = i + 1; j < bands.length; j++) {
          const [bandA, bandB] = [bands[i], bands[j]].sort();
          const key = `${bandA}---${bandB}`;
          bandLinks[key] = bandLinks[key] || { value: 0, shows: [] };
          bandLinks[key].value += 1;
          bandLinks[key].shows.push(`${bandA} ↔ ${bandB}<br>${dateLabel}<br>${row.Venue}, ${row.City}`);
        }
      }
    });

    const filteredBands = Object.keys(appearanceCounts).filter(b => appearanceCounts[b] >= 3);
    setBandList(filteredBands.sort());

    let nodes = filteredBands.map(name => ({
      id: name,
      count: appearanceCounts[name],
      ...bandYears[name]
    }));

    let links = Object.entries(bandLinks)
      .map(([key, value]) => {
        const [source, target] = key.split('---');
        return { source, target, value: value.value, shows: value.shows };
      })
      .filter(l => filteredBands.includes(l.source) && filteredBands.includes(l.target));

    if (focusedBand) {
      const relatedBands = new Set();
      const sharedShowCount = {};

      links = links.filter(l => {
        if (l.source === focusedBand || l.target === focusedBand) {
          const other = l.source === focusedBand ? l.target : l.source;
          relatedBands.add(focusedBand);
          relatedBands.add(other);
          sharedShowCount[other] = l.value;
          return true;
        }
        return false;
      });

      nodes = nodes
        .filter(n => relatedBands.has(n.id))
        .map(n => ({
          ...n,
          count: n.id === focusedBand ? appearanceCounts[n.id] : sharedShowCount[n.id] || 1
        }));
    }

    const width = 1000;
    const height = 800;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'black');

    const container = svg.append("g");

    const zoom = d3.zoom().on("zoom", (event) => {
      container.attr("transform", event.transform);
    });

    svg.call(zoom);

    if (focusedBand) {
      svg.transition()
        .duration(750)
        .call(zoom.scaleTo, 1.8); // default zoom for focus
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(180).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const tooltip = d3.select("body").append("div")
      .attr("class", "absolute text-sm bg-black text-doomGreen border border-doomGreen px-2 py-1 rounded hidden z-50");

    const years = nodes.map(n => +n.last);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    const colorScale = d3.scaleSequential()
      .domain([minYear, maxYear])
      .interpolator(t => d3.interpolateRgb("#222", "#9acd32")(Math.pow(t, 2.5)));

    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#666')
      .attr('stroke-opacity', 0.08)
      .attr('stroke-width', d => Math.log2(d.value + 1) * 1.5)
      .on("mouseover", (event, d) => {
        tooltip.classed("hidden", false)
          .html(d.shows.join('<br><br>'))
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.classed("hidden", true));

    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => Math.sqrt(d.count) * 6)
      .attr('fill', d => colorScale(+d.last))
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .call(drag(simulation))
      .on("mouseover", (event, d) => {
        tooltip.classed("hidden", false)
          .html(`<strong>${d.id}</strong><br/>Shows: ${d.count}<br/>${d.first}–${d.last}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.classed("hidden", true));

    const label = container.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', 10)
      .attr('fill', '#ffffff')
      .attr('stroke', '#000')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .attr('text-anchor', 'middle');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y - 10);
    });

    // Improved legend styling and layout
    const legendWidth = 220;
    const legendHeight = 12;
    const legendPadding = 10;
    const legendGroup = svg.append("g")
      .attr("transform", `translate(20, 20)`);

    const defs = svg.append("defs");
    const gradientId = "legend-gradient";
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    for (let i = 0; i <= 100; i++) {
      gradient.append("stop")
        .attr("offset", `${i}%`)
        .attr("stop-color", d3.interpolateRgb("#222", "#9acd32")(Math.pow(i / 100, 2.5)));
    }

    legendGroup.append("rect")
      .attr("width", legendWidth + legendPadding * 2)
      .attr("height", 50)
      .attr("fill", "black")
      .attr("stroke", "#9acd32")
      .attr("stroke-width", 1);

    legendGroup.append("text")
      .attr("x", (legendWidth + legendPadding * 2) / 2)
      .attr("y", 14)
      .attr("fill", "#9acd32")
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Last show year:");

    legendGroup.append("rect")
      .attr("x", legendPadding)
      .attr("y", 20)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`);

    legendGroup.append("text")
      .attr("x", legendPadding)
      .attr("y", 42)
      .attr("fill", "#9acd32")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .text(minYear);

    legendGroup.append("text")
      .attr("x", legendPadding + legendWidth)
      .attr("y", 42)
      .attr("fill", "#9acd32")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .text(maxYear);

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
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
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }
  }, [data, focusedBand]);

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-metal text-doomGrey">Oregon Doom Ecosystem</h1>
          <p className="text-2xl text-doomGreen mt-2">
            An interactive network of bands who’ve shared shows together — derived from over two decades of Oregon-based doom lineage
          </p>
          <p className="text-1xl text-doomGreen mt-2">
            Interactivity: Zoom In/Out, Panning, Tooltips on Hover (Bubbles show number of shows & lines show details about shared shows)
          </p>
          <br />
          <div className="mb-4">
            <label htmlFor="band-select" className="mr-2">Focus Band:</label>
            <select
              id="band-select"
              value={focusedBand}
              onChange={e => setFocusedBand(e.target.value)}
              className="bg-black border border-doomGreen text-doomGreen px-3 py-1 rounded"
            >
              <option value="">Show All</option>
              {bandList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <svg ref={svgRef} className="w-full h-[800px] border border-doomGreen rounded" />
      </div>
    </>
  );
}
