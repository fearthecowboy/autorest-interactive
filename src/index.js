"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const plugin_host_1 = require("./jsonrpc/plugin-host");
const fs_1 = require("fs");
// import { safeLoad } from "js-yaml";
// import { run } from "./autorest-interactive";
const pluginHost = new plugin_host_1.AutoRestPluginHost();
pluginHost.Add("autorest-interactive", (initiator) => __awaiter(this, void 0, void 0, function* () {
    const win = new electron_1.BrowserWindow({});
    win.maximize();
    win.setMenu(null);
    win.webContents.openDevTools();
    const getValueListener = (event, arg) => __awaiter(this, void 0, void 0, function* () { event.returnValue = yield initiator.GetValue(arg); });
    electron_1.ipcMain.on("getValue", getValueListener);
    win.loadURL(`${__dirname}/autorest-interactive/index.html`);
    yield new Promise(res => win.once("closed", res));
    electron_1.ipcMain.removeListener("getValue", getValueListener);
}));
const parent_stdin = fs_1.createReadStream(null, { fd: 3 });
const parent_stdout = fs_1.createWriteStream(null, { fd: 4 });
pluginHost.Run(parent_stdin, parent_stdout);
