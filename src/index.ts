import { app, BrowserWindow, dialog } from "electron";
import { AutoRestPluginHost } from "./jsonrpc/plugin-host";
// import { safeLoad } from "js-yaml";
// import { run } from "./autorest-interactive";

import { createReadStream, createWriteStream } from "fs";

var parent_stdin = createReadStream(null, { fd: 3 });
var parent_stdout = createWriteStream(null, { fd: 4 });

const pluginHost = new AutoRestPluginHost();
pluginHost.Add("autorest-interactive", async initiator => {
  const win = new BrowserWindow({});
  win.setMenu(null);

  win.loadURL("https://google.com/");

  await new Promise<void>(res => win.on("closed", res));
});
pluginHost.Run(parent_stdin, parent_stdout);