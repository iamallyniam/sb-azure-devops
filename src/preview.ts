/**
 * A decorator is a way to wrap a story in extra “rendering” functionality. Many addons define decorators
 * in order to augment stories:
 * - with extra rendering
 * - gather details about how a story is rendered
 *
 * When writing stories, decorators are typically used to wrap stories with extra markup or context mocking.
 *
 * https://storybook.js.org/docs/react/writing-stories/decorators
 */
import type { ProjectAnnotations, Renderer } from "storybook/internal/types";

import { withGlobals } from "./withGlobals";
import { withRoundTrip } from "./withRoundTrip";

/**
 * Note: if you want to use JSX in this file, rename it to `preview.tsx`
 * and update the entry prop in tsup.config.ts to use "src/preview.tsx",
 */

 let azureKey:string = "";
 if(typeof process !== "undefined"){
   azureKey = process?.env?.AZURE_DEVOPS || process?.env?.VITE_AZURE_DEVOPS || "";
 }else{
  // @ts-ignore
   azureKey = import.meta.env.AZURE_DEVOPS  || import.meta.env.VITE_AZURE_DEVOPS;
 }

const preview: ProjectAnnotations<Renderer> = {
  decorators: [withGlobals, withRoundTrip],
  initialGlobals: {
    azureKey
  },
};

export default preview;
