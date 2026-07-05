import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "./local-preset.cjs", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  env: config => {
    const azureDevopsEnv = `${process.env.AZURE_DEVOPS}`;
    const azureDevopsOrg = `${process.env.SB_AZURE_ORG}`;
    const azureDevopsProject = `${process.env.SB_AZURE_PROJECT}`;
    const newConfig = {
      ...config,
      VITE_AZURE_DEVOPS : azureDevopsEnv,
      AZURE_DEVOPS : azureDevopsEnv,
      VITE_SB_AZURE_ORG: azureDevopsOrg,
      SB_AZURE_ORG: azureDevopsOrg,
      VITE_SB_AZURE_PROJECT: azureDevopsProject,
      SB_AZURE_PROJECT: azureDevopsProject,
    }
    return newConfig;
  },

  // Workaround for https://github.com/storybookjs/storybook/issues/33537
  // Storybook's MDX compiler emits absolute `file:///` URLs (via import.meta.resolve),
  // which Vite's import-analysis cannot resolve (notably on Windows). Convert those
  // back into filesystem paths so Vite can resolve them normally.
  viteFinal: async config => {
    config.plugins = config.plugins ?? [];
    config.plugins.unshift({
      name: "fix-mdx-file-url-imports",
      enforce: "pre",
      resolveId(source) {
        if (source.startsWith("file://")) {
          return fileURLToPath(source);
        }
        return null;
      },
    });
    return config;
  },
};
export default config;
