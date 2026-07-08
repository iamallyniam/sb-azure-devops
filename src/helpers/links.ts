/**
 * Pure URL builders for Azure Devops links.
 *
 * Kept free of any `@storybook/global` (or other Storybook runtime) import so
 * this module is safe to bundle into the preview/docs iframe — where those
 * manager/preview globals are not guaranteed to be defined.
 */
export const azureLink = (protocol: string, host: string, azureOrg: string, azureProject: string = "") => {
    return `${protocol}://${host}/${azureOrg}${azureProject ? "/" + azureProject : ""}`.toLowerCase();
};

export const azureLinkItem = (protocol: string, host: string, azureOrg: string, item: string) => {
    return `${azureLink(protocol, host, azureOrg)}/_workitems/edit/${item}`;
};
