import "@broadcast/main";
import "@dolphin/main";
import "@replays/main";
import "@settings/main";
import "@console/main";

import { settingsManager } from "@settings/settingsManager";
import {
  ipc_checkValidIso,
  ipc_deleteFolder,
  ipc_fetchNewsFeed,
  ipc_getDesktopAppPath,
  ipc_getFolderContents,
} from "common/ipc";
import { app, ipcMain, nativeImage } from "electron";
import * as fs from "fs-extra";
import path from "path";

import { fetchNewsFeedData } from "./newsFeed";
import { verifyIso } from "./verifyIso";

export function setupListeners() {
  ipcMain.on("onDragStart", (event, filePath: string) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });

  ipcMain.on("getAppSettingsSync", (event) => {
    const settings = settingsManager.get();
    event.returnValue = settings;
  });

  ipc_fetchNewsFeed.main!.handle(async () => {
    const result = await fetchNewsFeedData();
    return result;
  });

  ipc_checkValidIso.main!.handle(async ({ path }) => {
    // Make sure we have a valid path
    if (!path) {
      return { path, valid: false };
    }

    try {
      const result = await verifyIso(path);
      return { path, valid: result.valid };
    } catch (err) {
      return { path, valid: false };
    }
  });

  ipc_getDesktopAppPath.main!.handle(async () => {
    // get the path and check existence
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");
    const exists = await fs.pathExists(desktopAppPath);

    return { path: desktopAppPath, exists: exists };
  });

  ipc_deleteFolder.main!.handle(async ({ path }) => {
    await fs.remove(path).catch((err) => {
      throw new Error(err);
    });
    return { success: true };
  });

  ipc_getFolderContents.main!.handle(async ({ path }) => {
    const contents = await fs.readdir(path, { withFileTypes: true }).catch((err) => {
      throw new Error(err);
    });
    return { success: true, contents };
  });
}
