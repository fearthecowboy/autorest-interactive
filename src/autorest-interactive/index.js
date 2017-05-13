"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const $ = require("jquery");
const d3 = require("d3");
function remoteEval(key) {
    return electron_1.ipcRenderer.sendSync("getValue", "__status." + new Buffer(key).toString("base64"));
}
// function remoteEval(expression: string): string {
//   return ipcRenderer.sendSync("getValue", key);
// }
$(() => {
    const pipeline = remoteEval("pipeline");
    const depth = (node) => node.inputs.map(i => depth(pipeline[i]) + 1).reduce((a, b) => Math.max(a, b), 0);
    const nodes = Object.keys(pipeline).map(key => Object.assign(pipeline[key], { key: key, id: key.replace("/", ":") }));
    const links = [].concat.apply([], nodes.map(node => node.inputs.map(input => {
        return {
            source: pipeline[input],
            target: node
        };
    })));
    // horiz layout
    nodes.forEach(n => n.depth = depth(n));
    nodes.forEach(n => n.x = 0);
    nodes.forEach((n, i) => n.y = i / 10);
    const width = nodes.map(x => x.depth).reduce((a, b) => Math.max(a, b), 0);
    const height = width * 0.7;
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-1))
        .force("link", d3.forceLink(links).distance(1).strength(1).iterations(10))
        .force("y", d3.forceY(0))
        .stop();
    for (var i = 0; i < 1000; ++i) {
        simulation.tick();
        nodes.forEach(n => n.x = n.depth - width / 2);
        nodes.forEach(n => n.y = Math.min(Math.max(n.y, -height / 2), height / 2));
    }
    const vis = d3.select("#pipelineGraph").attr("viewBox", `0 0 ${width + 2} ${height + 2}`).append("g").attr("transform", `translate(${width / 2 + 1},${height / 2 + 1})`);
    const render = () => {
        const lineData = vis.selectAll("line").data(links);
        lineData.enter().append("line").attr("stroke", "#000").attr("stroke-width", 0.02)
            .attr("x1", d => d.source.x.toFixed(3))
            .attr("y1", d => d.source.y.toFixed(3))
            .attr("x2", d => d.target.x.toFixed(3))
            .attr("y2", d => d.target.y.toFixed(3));
        lineData.exit().remove();
        const nodeData = vis.selectAll("circle").data(nodes);
        const enter = nodeData
            .enter().append("g").attr("stroke", "#000").attr("fill", "#FFF").attr("stroke-width", 0.03).attr("transform", d => `translate(${d.x},${d.y})`).append("g");
        enter.attr("class", "scalable").attr("id", d => d.id);
        enter.append("circle").attr("r", 0.4).attr("fill", d => d.state.state === "running" ? "#FFF" : (d.state.state === "complete" ? "#EFE" : "#FEE"));
        enter.append("text").attr("text-anchor", "middle").attr("dy", ".3em").attr("style", d => `font-size: ${1 / (d.key.length + 1)}em`).text(d => d.key).attr("fill", "#000").attr("stroke-width", 0);
        nodeData.exit().remove();
    };
    const update = () => {
        const states = remoteEval(`tasks`);
        nodes.forEach(n => n.state = { state: states[n.key]._state });
    };
    const refresh = () => { update(); render(); };
    refresh();
    setInterval(refresh, 100);
    // $("#pipelineGraph").text(JSON.stringify(pipeline, null, 2));
    // setInterval(() => {
    //   $("body").text(JSON.stringify(3));
    // }, 1000);
});
