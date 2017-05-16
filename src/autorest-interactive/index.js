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
    const nodes = Object.keys(pipeline).map(key => Object.assign(pipeline[key], { key: key, displayName: key.split("/") }));
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
    let lastFootprint = null;
    const render = () => {
        const footprint = JSON.stringify(nodes) + JSON.stringify(links);
        if (lastFootprint === footprint)
            return;
        lastFootprint = footprint;
        const lineData = vis.selectAll("line.edge").data(links);
        {
            lineData.enter().append("line").attr("class", "edge").attr("stroke", "#000").attr("stroke-width", 0.02)
                .attr("x1", d => d.source.x.toFixed(3))
                .attr("y1", d => d.source.y.toFixed(3))
                .attr("x2", d => d.target.x.toFixed(3))
                .attr("y2", d => d.target.y.toFixed(3));
            lineData.exit().remove();
        }
        const nodeData = vis.selectAll(".node").data(nodes);
        {
            const enter = nodeData.enter()
                .append("g")
                .attr("class", "node")
                .attr("stroke", "#000")
                .attr("fill", "#FFF")
                .attr("stroke-width", 0.03)
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .append("g")
                .attr("class", "scalable")
                .on("click", d => alert(JSON.stringify(d.configScope)));
            nodeData.exit().remove();
            const update = nodeData.select(".scalable").merge(enter);
            update.selectAll("*").remove();
            update.append("circle")
                .attr("r", "0.45em")
                .attr("fill", d => d.state.state === "running" ? "#FFF" : (d.state.state === "complete" ? "#DFD" : "#FDD"));
            update.append("text")
                .attr("text-anchor", "middle")
                .attr("style", d => `font-size: ${1 / (d.displayName.reduce((a, b) => Math.max(a, b.length), 0) + 1)}em`)
                .html(d => d.displayName.map((l, i) => `<tspan x="0" y="${(i - (d.displayName.length - 1) / 2) * 1.3}em">${l}</tspan>`).join(""))
                .attr("fill", "#000").attr("stroke-width", 0);
            update.append("text")
                .attr("text-anchor", "middle")
                .attr("y", "3.2em")
                .attr("style", `font-size: 0.2em; font-weight: bold`)
                .text(d => {
                const selfFinished = d.state.finishedAt;
                if (!selfFinished) {
                    return "";
                }
                const previousFinished = d.inputs.map(x => pipeline[x].state.finishedAt).reduce((a, b) => !b ? undefined : Math.max(a, b), 0) || selfFinished;
                const sec = (((selfFinished || Date.now()) - (previousFinished || selfFinished)) / 1000).toFixed(1);
                return sec === "0.0" ? "" : `${sec}s`;
            })
                .attr("fill", "#000").attr("stroke-width", 0);
        }
    };
    const update = () => {
        const states = remoteEval(`tasks`);
        for (const node of nodes) {
            node.state = node.state || { state: "running" };
            node.state.state = states[node.key]._state;
            node.state.finishedAt = states[node.key]._finishedAt;
            if (node.state.state === "complete" && !node.state.outputUris) {
                node.state.outputUris = remoteEval(`tasks[${JSON.stringify(node.key)}]._result().map(x => x.key)`);
            }
        }
    };
    const refresh = () => { update(); render(); };
    refresh();
    setInterval(refresh, 100);
    // $("#pipelineGraph").text(JSON.stringify(pipeline, null, 2));
    // setInterval(() => {
    //   $("body").text(JSON.stringify(3));
    // }, 1000);
});
