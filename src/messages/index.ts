export const DEFAULT_LANG = "en_GB";

type MessageType = {
	[key:string] : {
		[key:string] : string
	}
}

const Messages:MessageType = {
	[DEFAULT_LANG]: {
		"general": "Error:",
		"azureWorkItems": "Couldn't fetch work items",
		"azureIcons": "Couldn't fetch work item icons",
		"azureFields": "Couldn't fetch work item fields",
		"errorServerResp" : "There was a server response error",
		"errorServerRespPermission" : "There was a permission's error, please check access token is valid on the Azure Devops organisation.",
		"errorServerRespFail" : "There was Azure Devops server error",
		"errorServerRespNotFound" : "The requested Azure Devops organisation could not be found",
		"noWorkItemsSet" : "No work items have been set for this story. For guides on adding work items to stories, follow the guide links below",
		"watchVideo" : "Watch Video (English only)",
		"readDocs" : "View docs in Github",
		"errorAzureKey" : "Couldn't find Azure security key. Please add a valid security key for the Azure Devops environment you're attempting to access to your environement variables against a key named 'AZURE_DEVOPS', restart the command line tool you're running storybook from and try again.",
		"panelTitle" : "Storybook - Azure Devops field display",
		"panelDesc" : "Not all fields will be visible in every work item. Only fields that have been populed in the work items will be visible when viewing against a story.",
		"panelLegend" : "Fields to show in work items",
		"panelSave" : "Save visible fields",
		"panelReset" : "Reset to last saved configuration",
		"panelSuccess" : "Visible fields have been updated",
		"panelEmpty" : "Fieldsets not saved to local storage yet. Add at least on Azure Devops work item to a story and view before configuring the fields to display here."
	}
};

export const simpleMessage = (lang: string = DEFAULT_LANG, key: string) => {
	let localLang = lang;
	if (!Messages[localLang]) {
		localLang = DEFAULT_LANG;
	}
	return Messages[localLang][key];
}

export const errorMessage = (lang: string = DEFAULT_LANG, keys: string[], additional: string = ""): string => {
	let localLang = lang;
	if (!Messages[localLang]) {
		localLang = DEFAULT_LANG;
	}
	const message = [Messages[localLang]["general"], keys.reduce<string[]>((acc: string[], key: string) => {
		if (Messages[localLang][key]) {
			acc.push(Messages[localLang][key]);
		}
		return acc;
	}, [])];
	if (additional) {
		message.push(additional);
	}
	return message.join(" ");
};
