import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "./local-preset.js", "@storybook/addon-docs"],

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
  }
};
export default config;
