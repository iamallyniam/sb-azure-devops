import type { Preview } from "@storybook/react";

let azureOrg:string = "";
let azureProject:string = "";
if(typeof process !== "undefined"){
  azureOrg = process?.env?.SB_AZURE_ORG || process?.env?.VITE_SB_AZURE_ORG || "";
  azureProject = process?.env?.SB_AZURE_PROJECT || process?.env?.VITE_SB_AZURE_PROJECT || "";
}else{
 // @ts-ignore
 azureOrg = import.meta.env.SB_AZURE_ORG  || import.meta.env.VITE_SB_AZURE_ORG;
 // @ts-ignore
 azureProject = import.meta.env.SB_AZURE_PROJECT  || import.meta.env.VITE_SB_AZURE_PROJECT;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  initialGlobals: {
    background: { value: "light" },
    azureDevops: {
      org: azureOrg,
      project: azureProject
    }
  },
};

export default preview;
