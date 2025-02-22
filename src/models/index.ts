
export interface ApiResp {
	/**
	 * The response value
	 */
	value?: any,
	/**
	 * Unique id from response
	 */
	id?: string,
	/**
	 * The url from the response
	 */
	url?: string,
	/**
	 * Message from the server error
	 */
	message?: string,
	/**
	 * Error http status
	 */
	status?: number
}
/**
 * Devops item data
 */
export interface WorkItem {
	/**
	 * Key pair value of the fields populated in the item
	 */
	fields : object,
	/**
	 * Id of the Azure Devops item
	 */
	id: string
}
/**
 * Basic error object for displaying at the top of the plugin's form
 */
export interface Error{
	/**
	 * Readable message for users
	 */
	message : string,
	/**
	 * Optional url to link user to further information about the error
	 */
	url?: string
}
/**
 * Figma file version information
 */
export interface FigmaFileVersion{
	/**
	 * The user readable label for the version
	 */
	label : string,
	/**
	 * Figma file version id
	 */
	id : string
}
/**
 * Component in Figma that is causing the error
 */
export interface errorItem{
	/**
	 * Message to user about the component causing the error
	 */
	message : string,
	/**
	 * Figma component id that's causing the error
	 */
	id : string
}
export interface RequestObject{
	method : string,
	headers : object,
	body? : string
}
export interface DevopsObj{
	item: string,
	protocol? : string,
	host? : string,
	project?: string,
	azure?: string

}