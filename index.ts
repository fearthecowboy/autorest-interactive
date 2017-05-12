import * as electron from "electron";
import { spawn } from "child_process";

if (typeof electron === "string") {
  spawn(electron as any, [__filename], { stdio: ["ignore", "ignore", process.stderr, process.stdin, process.stdout] });
} else {
  electron.app.on("ready", () => {
    require("./src/index");
  });
}