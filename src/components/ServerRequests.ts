import { azureLink } from "src/helpers";
import { DEFAULT_LANG, errorMessage, simpleMessage } from "src/messages";
import { ApiResp } from "src/models";

const fetchJson = (req:string, sendObj:RequestInit, lang:string):Promise<Object> => {
	return new Promise((resolve, reject) => {
		fetch(req, sendObj).then(resp => {
			resp.json().then(data => {
				if(resp.status < 203){
					resolve(data);
				}else{
					let statusMessage = errorMessage(lang, ["errorServerResp"]);
					switch(resp.status){
						case 203 :
							statusMessage =  errorMessage(lang, ["errorServerRespPermission"]);
						break;
						case 500 :
							statusMessage = errorMessage(lang, ["errorServerRespFail"]);
						break;
						case 404 :
							statusMessage = errorMessage(lang, ["errorServerRespNotFound"]);
						break;
					}
					if(data.message){
						statusMessage += `. ${data.message}`;
					}
					const errorObj:ApiResp = {
						message : statusMessage,
						status : resp.status
					};
					if(resp.status < 400){
						if(resp.url){
							errorObj.url = resp.url;
						}
					}
					reject(errorObj);
				}
			}).catch(err => {
				reject(err);
			});
		}).catch(err => {
			reject(err);
		});
	});
};

export const devopsReq = (azureDevopsConfigKey:string, azureDevopsConfigOrg:string, auzreDevopsConfigProject:string, requestStr:string, method:string = "GET", body:string = "", contentRange:string = "", apiVersion = "api-version=6.0", lang = DEFAULT_LANG):Promise<ApiResp> => {
	return new Promise((resolve, reject) => {
		if(azureDevopsConfigKey){
			let contentType = "application/json";
			switch(method){
				case "PATCH" :
					contentType = "application/json-patch+json";
				break;
				case "PUT" :
					contentType = "application/octet-stream";
				break;
			}
			const headers = new Headers();
			headers.append("Authorization", `Basic ${btoa(":" + azureDevopsConfigKey)}`);
			headers.append("Accept", `application/json`);
			headers.append("content-type", contentType);
			headers.append("Access-Control-Allow-Origin", "*");
			headers.append("origin", "anonymous");
			headers.append("mode", "cors");
			headers.append("cache", "no-cache");
			headers.append("credentials", "same-origin");
			headers.append("redirect", "follow");
			headers.append("referrerPolicy", "no-referrer");
			if(contentRange){
				headers.append("Content-Range", contentRange);
			}
			let sendObj:RequestInit = {
				"method" : method,
				"headers" : headers
			};
			if(body){
				sendObj = {
					...sendObj,
					body
				};
			}
			let operator = "?";
			if(requestStr.indexOf("?") > -1){
				operator = "&";
			}
			fetchJson(`${azureLink("https", "dev.azure.com", azureDevopsConfigOrg, auzreDevopsConfigProject)}/_apis/${requestStr}${operator}${apiVersion}`, sendObj, lang).then(data => {
				resolve(data);
			}).catch(err => {
				reject(err);
			});
		}else{
			reject({
				"message" : simpleMessage("en_GB", "errorAzureKey")
			})
		}
	});
}