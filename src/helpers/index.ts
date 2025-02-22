import { global } from '@storybook/global';
export const azureLink = (protocol:string, host:string, azureOrg:string, azureProject:string = "") => {
    return `${protocol}://${host}/${azureOrg}${azureProject ? "/" + azureProject : ""}`.toLowerCase()
};
export const azureLinkItem = (protocol:string, host:string, azureOrg:string, item:string) => {
    return `${azureLink(protocol, host, azureOrg)}/_workitems/edit/${item}`;
};
export const clearStyles = (selector: string | string[]) => {
    const selectors = Array.isArray(selector) ? selector : [selector];
    selectors.forEach(clearStyle);
  };
   
  const clearStyle = (input: string | string[]) => {
    const selector = typeof input === 'string' ? input : input.join('');
    const element = global.document.getElementById(selector);
    if (element && element.parentElement) {
      element.parentElement.removeChild(element);
    }
  };
   
  export const addOutlineStyles = (selector: string, css: string) => {
    const existingStyle = global.document.getElementById(selector);
    if (existingStyle) {
      if (existingStyle.innerHTML !== css) {
        existingStyle.innerHTML = css;
      }
    } else {
      const style = global.document.createElement('style');
      style.setAttribute('id', selector);
      style.innerHTML = css;
      global.document.head.appendChild(style);
    }
  };