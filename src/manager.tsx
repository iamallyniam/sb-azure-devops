import React from "react";
import { addons, types } from "storybook/internal/manager-api";

import { Panel } from "./components/Panel";
import { Tab } from "./components/Tab";
import { ADDON_ID, PANEL_ID, PLUGIN_NAME, TAB_ID, TOOL_ID } from "./constants";

/**
 * Note: if you want to use JSX in this file, rename it to `manager.tsx`
 * and update the entry prop in tsup.config.ts to use "src/manager.tsx",
 */

// Register the addon
addons.register(ADDON_ID, (api) => {
  // Register a tool

  // Register a panel
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: PLUGIN_NAME,
    match: ({ viewMode }) => viewMode === "story",
    render: ({ active }) => <Panel active={active} />,
  });

  // Register a tab
  addons.add(TAB_ID, {
    type: types.TAB,
    title: PLUGIN_NAME,
    render: ({ active }) => <Tab active={active} />,
  });
});
