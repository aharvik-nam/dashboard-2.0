import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface TrendChartDataPoint {
  date: Date;
  count: number;
  expectedCount?: number;
  isFuture: boolean;
}

interface TrendChartProps {
  data: TrendChartDataPoint[];
  color: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, color }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 300;
    const height = 80;
    const margin = { top: 5, right: 10, bottom: 20, left: 10 };

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const maxY = d3.max(data, d => Math.max(d.count, d.expectedCount || 0)) || 0;
    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([height - margin.bottom, margin.top]);

    const pastData = data.filter(d => !d.isFuture);
    const futureData = data.filter(d => d.isFuture);

    if (pastData.length > 0 && futureData.length > 0) {
      futureData.unshift(pastData[pastData.length - 1]);
    }

    const line = d3.line<{ date: Date; count: number }>()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const expectedLine = d3.line<{ date: Date; expectedCount?: number }>()
      .defined(d => d.expectedCount !== undefined)
      .x(d => x(d.date))
      .y(d => y(d.expectedCount!))
      .curve(d3.curveMonotoneX);

    const area = d3.area<{ date: Date; count: number }>()
      .x(d => x(d.date))
      .y0(height - margin.bottom)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "trend-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.2);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0);

    svg.append("path").datum(pastData).attr("fill", "url(#trend-gradient)").attr("d", area);
    svg.append("path").datum(pastData).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2).attr("d", line);
    svg.append("path").datum(futureData).attr("fill", "none").attr("stroke", "#a8a29e").attr("stroke-width", 2).attr("stroke-dasharray", "4,4").attr("d", line);

    const expectedData = data.filter(d => d.expectedCount !== undefined);
    if (expectedData.length > 0) {
      if (pastData.length > 0) {
        const lastPast = pastData[pastData.length - 1];
        expectedData.unshift({ ...lastPast, expectedCount: lastPast.count });
      }
      svg.append("path").datum(expectedData).attr("fill", "none").attr("stroke", "#ef4444").attr("stroke-width", 2).attr("stroke-dasharray", "4,4").attr("d", expectedLine);
    }

    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeMonth.every(1))
      .tickFormat(d => new Intl.DateTimeFormat('no-NB', { month: 'short' }).format(d as Date).replace('.', ''))
      .tickSize(0)
      .tickPadding(8);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#a8a29e")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("text-transform", "uppercase")
      );
  }, [data, color]);

  return <svg ref={svgRef} className="w-full h-[80px] overflow-visible" />;
};
