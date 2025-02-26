import type { Preview } from "@storybook/react";

let azureOrg:string = "";
let azureProject:string = "";
let azureKey:string = "";
if(typeof process !== "undefined"){
  azureOrg = process?.env?.SB_AZURE_ORG || process?.env?.VITE_SB_AZURE_ORG || "";
  azureProject = process?.env?.SB_AZURE_PROJECT || process?.env?.VITE_SB_AZURE_PROJECT || "";
  azureKey = process?.env?.AZURE_DEVOPS || process?.env?.VITE_AZURE_DEVOPS || "";
}else{
 // @ts-ignore
 azureOrg = import.meta.env.SB_AZURE_ORG  || import.meta.env.VITE_SB_AZURE_ORG;
 // @ts-ignore
 azureProject = import.meta.env.SB_AZURE_PROJECT  || import.meta.env.VITE_SB_AZURE_PROJECT;
 // @ts-ignore
 azureKey = import.meta.env.AZURE_DEVOPS  || import.meta.env.VITE_AZURE_DEVOPS;
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
      project: azureProject,
      key: azureKey
    }
  },
};

export default preview;
