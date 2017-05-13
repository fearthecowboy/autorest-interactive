import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { AutoRestPluginHost } from "./jsonrpc/plugin-host";
import { createReadStream, createWriteStream } from "fs";
// import { safeLoad } from "js-yaml";
// import { run } from "./autorest-interactive";

const pluginHost = new AutoRestPluginHost();
pluginHost.Add("autorest-interactive", async initiator => {
  const win = new BrowserWindow({});
  win.maximize();
  win.setMenu(null);
  win.webContents.openDevTools();
  const getValueListener = async (event, arg) => { event.returnValue = await initiator.GetValue(arg); };
  ipcMain.on("getValue", getValueListener);
  win.loadURL(`${__dirname}/autorest-interactive/index.html`);
  await new Promise<void>(res => win.once("closed", res));
  ipcMain.removeListener("getValue", getValueListener);
});
const parent_stdin = createReadStream(null, { fd: 3 });
const parent_stdout = createWriteStream(null, { fd: 4 });
pluginHost.Run(parent_stdin, parent_stdout);