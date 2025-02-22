import React, { SyntheticEvent, useCallback, useEffect, useId, useState } from "react";
import { addOutlineStyles, clearStyles } from "src/helpers";
import { useTheme } from "storybook/internal/theming";
import { H2, P } from "storybook/internal/components";

import { ADDON_ID, KEY } from "../constants";
import { FieldWithVisibility } from "./Panel";
import { fieldSelectionStyles } from "./workItemStyles";
import { DEFAULT_LANG, simpleMessage } from "src/messages";

interface TabProps {
	active: boolean;
}
export const Tab: React.FC<TabProps> = ({ active }, context) => {
	const theme = useTheme();
	
	if (!active) {
		return null;
	}

	const [hasSaved, setHasSaved] = useState(false)

	const getSavedFieldDefs = () => {
		const savedFieldDefsStr = localStorage.getItem("fieldDefs");
		try {
			const savedFieldDefs: FieldWithVisibility[] = JSON.parse(savedFieldDefsStr);
			return savedFieldDefs;
		} catch (e) {
			localStorage.removeItem("fieldDefs");
			return [];
		}
	}

	const [fieldDefs, setFieldDefs] = useState<FieldWithVisibility[]>(getSavedFieldDefs);
	const [workingFields, setWorkingFields] = useState<FieldWithVisibility[]>(() => [...fieldDefs]);

	const toggleField = useCallback((name: string, value: boolean) => {
		const currentWorkingFields = [...workingFields];
		const findFieldInd = currentWorkingFields.findIndex(item => item.referenceName === name);
		if (findFieldInd) {
			setHasSaved(false);
			currentWorkingFields[findFieldInd].shouldDisplay = value;
			setWorkingFields(currentWorkingFields);
		}
	}, [workingFields, setWorkingFields, setHasSaved]);

	const updateVisibleFields = useCallback((evt: SyntheticEvent<HTMLFormElement>) => {
		evt.preventDefault();
		try {
			localStorage.setItem("fieldDefs", JSON.stringify(workingFields));
			setFieldDefs(workingFields);
			setHasSaved(true);
		} catch (e) {
			//todo: error handling
		}
		return false;
	}, [workingFields, setFieldDefs]);

	const resetVisibleFields = useCallback((evt: SyntheticEvent<HTMLFormElement>) => {
		setHasSaved(false);
		setWorkingFields(getSavedFieldDefs());
	}, [setHasSaved, setWorkingFields]);

	useEffect(() => {
		const selectorId = ADDON_ID;
		if (!active) {
			clearStyles(selectorId);
			return;
		  }
	   
		  addOutlineStyles(selectorId, fieldSelectionStyles(selectorId, theme));
	   
		  return () => {
			clearStyles(selectorId);
		  };
	}, [active, fieldSelectionStyles, context.id]);

	const userLang = document?.documentElement?.lang || DEFAULT_LANG;

	return (
		<div className="fieldDisplayWrap">
			<H2>{simpleMessage(userLang, "panelTitle")}</H2>
			{workingFields.length > 0 && (
				<>
				<P>{simpleMessage(userLang, "panelDesc")}</P>
					<form className="fieldDisplayForm" onSubmit={updateVisibleFields} onReset={resetVisibleFields}>
						<fieldset className="fieldDisplayFieldset">
							<legend className="fieldDisplayTitle">{simpleMessage(userLang, "panelLegend")}</legend>
							{workingFields.length > 0 && (
								<>
									{workingFields.map((item, i) => {
										const id = useId();
										const descId = useId();
										return (
											<div className="fieldDisplayField" key={`field-${id}`}>
												<input id={id}
													className="fieldDisplayFieldInput"
													type="checkbox"
													value="true"
													name={item.referenceName}
													defaultChecked={item.shouldDisplay}
													aria-describedby={item.description ? descId : null}
													onChange={evt => toggleField(evt.target.name, evt.target.checked)} />
												<label htmlFor={id} className="fieldDisplayFieldLabel">{item.name}</label>
												{item.description && (
													<p id={descId} className="fieldDisplayFieldDesc">{item.description}</p>
												)}
											</div>
										)
									})}
								</>
							)}
						</fieldset>
						<button className="fieldDisplayBtn btnSubmit" type="submit">{simpleMessage(userLang, "panelSave")}</button>
						<button className="fieldDisplayBtn btnReset" type="reset">{simpleMessage(userLang, "panelReset")}</button>
						{hasSaved && (
							<p className="fieldDisplaySaved" aria-live="polite">{simpleMessage(userLang, "panelSuccess")}</p>
						)}
					</form>
				</>
			)}
			{workingFields.length === 0 && (
				<P>{simpleMessage(userLang, "panelEmpty")}</P>
			)}
		</div>
	);
};
