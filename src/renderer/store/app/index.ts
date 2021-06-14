import { dolphinDownloadFinished, dolphinDownloadLogReceived, downloadDolphin } from "dolphin/ipc";
import log from "electron-log";
import create from "zustand";

type StoreState = {
  initialized: boolean;
  logMessage: string;
};

type StoreReducers = {
  initialize: () => Promise<void>;
};

const initialState: StoreState = {
  initialized: false,
  logMessage: "",
};

export const useApp = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  initialize: async () => {
    if (get().initialized) {
      console.log("App is already initialized!");
      return;
    }

    console.log("Initializing app...");
    const promises: Promise<void>[] = [];

    dolphinDownloadLogReceived.renderer!.handle(async ({ message }) => {
      log.info(message);
      set({ logMessage: message });
    });

    promises.push(
      new Promise((resolve) => {
        const handler = dolphinDownloadFinished.renderer!.handle(async ({ error }) => {
          // We only want to handle this event once so immediately destroy
          handler.destroy();

          if (error) {
            const errMsg = "Error occurred while downloading Dolphin";
            log.error(errMsg, error);
            set({ logMessage: errMsg });
          }
          resolve();
        });
      }),
    );

    // Download Dolphin if necessary
    downloadDolphin.renderer!.trigger({});

    await Promise.all(promises);
    set({ initialized: true });
  },
}));
