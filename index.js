"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const child_process_1 = require("child_process");
if (typeof electron === "string") {
    // make sure that electron can be electron!
    delete process.env['ELECTRON_RUN_AS_NODE'];
    const proc = child_process_1.spawn(electron, [__filename], { stdio: ["ignore", "ignore", process.stderr, process.stdin, process.stdout] });
    process.on('exit', (code) => {
        proc.kill();
    });
}
else {
    electron.app.on("ready", () => {
        require("./src/index");
    });
}
