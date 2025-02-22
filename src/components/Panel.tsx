import React, { memo, useCallback, useEffect, useId, useState } from "react";
import { AddonPanel } from "storybook/internal/components";
import { useGlobals, useParameter   } from "storybook/internal/manager-api";
import { useTheme } from "storybook/internal/theming";
import {workItemStyles} from "./workItemStyles";

import { ADDON_ID, } from "../constants";

import { clearStyles, addOutlineStyles, azureLinkItem} from "src/helpers";
import { WorkItem, WorkItemField2, WorkItemIcon, WorkItemType } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { devopsReq } from "./ServerRequests";
import { ApiResp } from "src/models";
import { DEFAULT_LANG, errorMessage } from "src/messages";
import { Empty } from "./EmptyState";
import { SyncIcon } from "@storybook/icons";

interface PanelProps {
	active: boolean;
}
export type FieldWithVisibility = WorkItemField2 & {
	shouldDisplay:boolean
};
export const Panel: React.FC<PanelProps> = memo(function MyPanel(props, context) {
	const theme = useTheme();

	const userLang = document.documentElement.lang || DEFAULT_LANG;

	const [globals] = useGlobals();
	const workItem = useParameter<string[]>("workItems", []);

	const azureDevopsConfig = globals.azureDevops ? globals.azureDevops : null;

	const [azureDevopsConfigOrg, setAzureDevopsConfigOrg] = useState<string>(() => {
		return azureDevopsConfig?.org ? azureDevopsConfig.org : "";
	})
	const [azureDevopsConfigProject, setAzureDevopsConfigProject] = useState<string>(() => {
		return azureDevopsConfig?.project ? azureDevopsConfig.project : "";
	})
	const [azureDevopsConfigKey, setAzureDevopsConfigKey] = useState<string>(() => {
		return globals.azureKey;
	});
	const [isLoading, setIsLoading] = useState<boolean>(() => true);
	const [error, setError] = useState<string>(() => "");
	const [fieldDefs, setFieldDefs] = useState<FieldWithVisibility[]>(() => {
		const savedFieldDefsStr = localStorage.getItem("fieldDefs");
		try{
			const savedFieldDefs:FieldWithVisibility[] = JSON.parse(savedFieldDefsStr);
			return savedFieldDefs;
		}catch(e){
			localStorage.removeItem("fieldDefs");
			return [];
		}
	});
	const [workItemDefs, setWorkItemDefs] = useState<WorkItemType[]>([]);

	interface WorkItemDetails {
		title: string,
		type: string
	}

	interface WorkerItemCollection {
		[key: string] : WorkItem & WorkItemDetails;
	}

	const [workItemFields, setWorkItemFields] = useState<WorkerItemCollection|null>(null);

	useEffect(() => {
		const azureDevopsConfig = globals.azureDevops ? globals.azureDevops : null;
		setAzureDevopsConfigOrg(azureDevopsConfig?.org ? azureDevopsConfig.org : "");
		setAzureDevopsConfigProject(azureDevopsConfig?.project ? azureDevopsConfig.project : "");
		setAzureDevopsConfigKey(globals.azureKey ? globals.azureKey : "");
	}, [globals])

	const azureDevopsRequest = useCallback((requestStr:string, method:string = "GET", body:string = "", contentRange:string = "", apiVersion = "api-version=6.0"):Promise<ApiResp> => {
		return devopsReq(azureDevopsConfigKey, azureDevopsConfigOrg, azureDevopsConfigProject, requestStr, method, body, contentRange, apiVersion, userLang);
	}, [azureDevopsConfigKey, azureDevopsConfigOrg, azureDevopsConfigProject]);

	interface WorkItemResponse {
		value: WorkItem[]
	}

	interface FieldResponse {
		value: WorkItemField2[]
	}
	interface WorkItemIconResponse {
		value: WorkItemIcon[];
	}

	const getWorkItems = (azureIds:Array<string>):Promise<WorkItemResponse> => {
		return new Promise((resolve, reject) => {
			if(azureIds.length > 0){
				const requestStr = `wit/workitems?ids=${azureIds.join(",")}&$expand=fields`;
				azureDevopsRequest(requestStr).then((resp: WorkItemResponse): void => {
					resolve(resp);
				}).catch(err => {
					console.log(err);
					reject(err);
				});
			}else{
				reject("No ids sent");
			}
		});
	}
	const getFieldTypes = ():Promise<FieldResponse> => {
		return new Promise((resolve,reject) => {
			const requestStr = `wit/fields?$expand=all`;
			azureDevopsRequest(requestStr, "GET", "", "","api-version=7.1").then((resp: FieldResponse): void => {
				resolve(resp);
			}).catch(err => {
				reject(err);
			});
		})
	}
	const getWorkItemIcons = ():Promise<WorkItemIconResponse> => {
		return new Promise((resolve,reject) => {
			const requestStr = `wit/workitemtypes`;
			azureDevopsRequest(requestStr, "GET", "", "","api-version=7.1").then((resp: WorkItemIconResponse): void => {
				resolve(resp);
			}).catch(err => {
				reject(err);
			});
		})
	}

	/**
	 * Make data requests
	 */
	useEffect(() => {
		if(props.active && workItem.length > 0 && azureDevopsConfigKey && azureDevopsConfigOrg){
			setWorkItemFields(null);
			setIsLoading(true);
			setError("");
			getWorkItems(workItem).then(data => {
				
				const updatedData:WorkerItemCollection = data.value.reduce<WorkerItemCollection>((acc:WorkerItemCollection, item:WorkItem) => {
					const newKey:string = String(item.id);
					acc[newKey] = {
						...item,
						type: String(item.fields["System.WorkItemType"]),
						title: String(item.fields["System.Title"])
					};
					return acc;
				}, {});
				
				if(fieldDefs.length === 0 || workItemDefs.length === 0){
					const promiseReqs = [
						getWorkItemIcons()
					]
					if(fieldDefs.length === 0){
						promiseReqs.push(getFieldTypes())
					}
					Promise.all(promiseReqs).then(resps => {
						setWorkItemDefs(resps[0].value);
						if(resps.length > 1){
							const fieldDefsShow:FieldWithVisibility[] = resps[1].value.map(item => {
								return {
									...item,
									shouldDisplay: true
								}
							});
							setFieldDefs(fieldDefsShow);
							localStorage.setItem("fieldDefs", JSON.stringify(fieldDefsShow));
						}
						setWorkItemFields(updatedData);
						setIsLoading(false);
					}).catch(err => {
						console.log(err);
						setIsLoading(false);
						let errorKeys = ["azureIcons"];
						if(promiseReqs.length > 1){
							errorKeys = ["azureIcons", "azureFields"];
						}
						setError(errorMessage(userLang, errorKeys));
					});
				}else{
					setWorkItemFields(updatedData);
					setIsLoading(false);
				}
			}).catch(err => {
				console.log(err);
				setIsLoading(false);
				setError(errorMessage(userLang, ["azureWorkItems"], workItem.join(",")));
			})
		}else if(workItem.length === 0){
			setWorkItemFields(null);
			setIsLoading(false);
		}
	}, [workItem, azureDevopsConfigKey, azureDevopsConfigOrg, props.active]);

	const findField = (key:string) => {
		return fieldDefs.find(field => field.referenceName === key);
	}
	interface WorkItemFieldType {
		field: WorkItemField2,
		value: WorkItem,
		filedName: string
	}
	const WorkItemField = (props:WorkItemFieldType) => {
		const field = props.field;
		const value = props.value;
		const filedName = props.filedName;
		let type = "text";
		let step = null;
		let valuePrnt:string = `${value}`;
		const filedString = String(field.type);
		switch(filedString){
			case "integer": 
			case "double":
				type = "number";
				if(filedString === "double"){
					step = 0.01;
				}else{
					step = 1;
				}
			break;
			case "treePath":

			break;
			case "string":
			break;
			case "dateTime":
				const dateValue = new Date(`${value}`);
				valuePrnt = dateValue.toISOString().substring(0, 16);
				type = "datetime-local"
			break;
			case "html":
			break;
		}
		const id = useId();
		if(valuePrnt){
			return (<li className="tabContentListItem">
			{filedString === "html" && (
				<>
				<p className="workItemLabel">{field.name || filedName}</p>
				<div className="workItemValue" dangerouslySetInnerHTML={{__html: valuePrnt }} />
				</>
			)}
			{filedString !== "html" && (
				<>
				<input className="workItemValue" id={id} name={filedName} defaultValue={valuePrnt} type={type} step={step} readOnly={true} />
				<label className="workItemLabel" htmlFor={id}>{ field.name || filedName }</label>
				</>
			)}
			</li>
			)
		}else{
			return null;
		}
	}
	useEffect(() => {
		const selectorId = ADDON_ID;
		if (!props.active) {
			clearStyles(selectorId);
			return;
		  }
	   
		  addOutlineStyles(selectorId, workItemStyles(selectorId, theme));
	   
		  return () => {
			clearStyles(selectorId);
		  };
	}, [props.active, workItemStyles, context.id]);

	const [tabInd, setTabInd] = useState<number>(() => 0);

	return (
		<AddonPanel {...props}>
			<div className="azureWorkItems">
			{error && (
				<p>{error}</p>
			)}
			{!workItemFields && !isLoading && !error &&(
				<Empty lang={userLang} />
			)}
			{isLoading && !error &&(
				<>
				<p aria-atomic="true" aria-live="polite" className="loadingText" >Loading</p>
				<SyncIcon size={24} color={theme.color.primary} className="loadingIcon" />
				</>
			)}
			{workItemFields && !error && !isLoading &&(
				<div className="tabGrid">
					<ul role="tablist" className="tabNav">
						{Object.keys(workItemFields).map((keyName, i) => {
							const workItemType:WorkItem & WorkItemDetails = workItemFields[keyName];
							const workItemTypeType = workItemType.type;
							const workItemTypeDetails = workItemDefs.find(workItemDef => workItemTypeType === workItemDef.name);
							let iconImage = "";
							if(workItemTypeDetails){
								iconImage = workItemTypeDetails.icon.url;
							}
							return(
								<li key={`tab=${i}`} className="tabNavItem">
								<button id={`tab-${i}`} type="button" className="tabNavButton"
								role="tab"
								disabled={i === tabInd}
								onClick={() => { setTabInd(i) }}
								aria-controls={`tabpanel-${i}`}>
									{iconImage && (
										<img src={iconImage} className="tabNavButtonImg" />
									)}
									<span className="tabNavButtonText">{workItemType.title}</span>
								</button>
								</li>
							)
						})}
					</ul>
					{Object.keys(workItemFields).map((keyName, i) => {
						const workItemType:WorkItem & WorkItemDetails = workItemFields[keyName];
						const workItemProps = workItemType.fields;
						
						return (
							<div key={`tab-${i}`}className="tabContent" {...{ inert: i !== tabInd ? '' : undefined }}>
								<h2 className="tabContentTitle">{workItemType.title}</h2>
								<p className="tabContentLink"><a href={`${azureLinkItem("https", "dev.azure.com", azureDevopsConfigOrg, String(workItemType.id))}`} target="_blank" rel="nofollow noreferrer noopener">View work item in Azure Devops</a></p>
								{/* <button className="tabContentRefresh">Refresh content</button> */}
								<ul id={`tabpanel-${i}`} key={`tabContnet-${i}`} role="tabpanel" aria-labelledby={`tab-${i}`} className="tabContentList" >
								{Object.keys(workItemProps).map((fieldKey, ii) => {
									const field = findField(fieldKey);
									if(field && field.shouldDisplay){
										return <WorkItemField field={field} value={workItemProps[fieldKey]} filedName={keyName} key={`field-${i}-${ii}`} />
									}
								})}
								</ul>
							</div>
						)
					})}
				</div>
			)}
			</div>
		</AddonPanel>
	);
});