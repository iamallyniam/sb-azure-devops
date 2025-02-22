# Storybook Addon Azure Devops Plugin
Link stories to Azure Devops work items

## Installation

First, install the package.

```sh
npm install --save-dev sb-azure-devops
```

Then, register it as an addon in `.storybook/main.js`.

```js
// .storybook/main.ts

// Replace your-framework with the framework you are using (e.g., react-webpack5, vue3-vite)
import type { StorybookConfig } from '@storybook/your-framework';

const config: StorybookConfig = {
  // ...rest of config
  addons: [
    '@storybook/addon-essentials'
    'sb-azure-devops', // 👈 register the addon here
  ],
};

export default config;
```

## Usage

### Environment variables

You first need to generate a personal access token for Azure Devops. To do so follow the instructions from Microsoft. The minimum permissions that are needed are:

- Work items, read

For security your Azure Devops personal access token is read as an environment variable. After generating your access token you can add the token to your environment variables using the key "AZURE_DEVOPS". Depending on the system you're running your Storybook instance on there are different ways to add environment variables, here are some common ways:

- Local
  - [Local, Windows](https://www.csharp.com/article/how-to-addedit-path-environment-variable-in-windows-11/)
  - [Local, Mac](https://support.apple.com/en-gb/guide/terminal/apd382cc5fa-4f58-4449-b20a-41c53c006f8f/mac)
- Hosted
  - [Netlify](https://docs.netlify.com/environment-variables/overview/)
  - [Vercel](https://vercel.com/docs/projects/environment-variables/managing-environment-variables)
  - [Azure](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/manage-environment-variables)

### Storybook parameters

Azure devops Organisation and Project values must be defined as `auzreDevops.org` and `auzreDevops.project` parameters in the initial globals. These are defined in the preview.js|ts file. If your Storybook implementation needs to support multiple projects/organisations, these can be handled by setting up global options to switch Organisation and Projects.

```js
// preview.ts

// Replace your-framework with the name of your framework
import type { Preview } from "@storybook/your-framework";

const preview: Preview = {
  // ...rest of config
  initialGlobals: {
    // ...rest of initial globals config
    azureDevops: {
      org: "devopsOrgName",
      project: "devopsProjectName"
    }
  },
};
```

You can then associate work item ids from azure devops with your
stories by adding an array of ids as strings to your story parameters

```js
// Button.stories.ts

// Replace your-framework with the name of your framework
import type { Meta } from '@storybook/your-framework';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  parameters: {
    workItems: ["1", "2"]
  }
};

export default meta;
```

## Releases

- **0.0.1** - Initial public release.
  - Read only work items from Azure Devops.
  - Configure which fields you want to display in your work items.
  - Supports light and dark mode.
  - Supports horizontal and vertical addon layouts.