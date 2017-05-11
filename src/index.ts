// polyfills for language support
require("./polyfill.min.js");

import { safeLoad } from "js-yaml";
import { AutoRestPluginHost } from "./jsonrpc/plugin-host";
import { run } from "./autorest-interactive";

async function main() {
  const pluginHost = new AutoRestPluginHost();
  pluginHost.Add("autorest-interactive", async initiator => {

  });

  await pluginHost.Run();
}

main();