import { Theme } from 'storybook/internal/theming';
import { dedent } from 'ts-dedent';

const borderColour = "transparent";
const borderColourSelected = "#000";
const boxShadowColour = "rgba(0, 0, 0, 0.6)";
const pxRem20 = 20 / 16;
const pxRem40 = 40 / 16;
const pxRem1000 = 1000 / 16;

const rootVars = (extra:string = "") => {
	return dedent/* css */ `
	:root{
		--color-bg: #fff;
		--color-text: #000;
		--color-link: #000;
		@media (prefers-color-scheme: dark){
			--color-bg: #333333;
			--color-text: #ffffff;
			--color-link: #ffffff;
		}
		${extra}
	}
	`;
}

export function fieldSelectionStyles(selector:string, theme:Theme) {
	const regFont = `${theme.typography.size.s3 / 16}rem`;
	const smallFont = `${theme.typography.size.s2 / 16}rem`;
	return dedent/* css */ `
	${rootVars(`accent-color: ${theme.color.positive};`)}
	.fieldDisplayWrap{
		position: relative;
		width: 100%;
		height:auto;
		display:block;
		align-self: start;
		max-width: ${pxRem1000}rem;
		container-type: inline-size;
		container-name: fieldWrapper;
		padding: 1rem 0;
	}
	.fieldDisplayForm{
		position: relative;
		width: 100%;
		height: auto;
		display: grid;
		grid-template-columns: auto auto 1fr;
		grid-template-rows: auto auto;
		grid-template-areas: "fieldset fieldset fieldset"
		"btnSubmit btnReset message";
		gap: 1rem;
		padding: 1rem 0;
	}
	.fieldDisplayFieldset{
		/*todo: columns based on container size*/
		columns:1;
		column-gap: 1rem;
		grid-area: fieldset;
	}

	.fieldDisplayField{
		position: relative;
		width: 100%;
		height: auto;
		display: grid;
		grid-template-columns: ${pxRem20}rem 1fr;
		grid-template-rows: auto;
		grid-template-areas: "checkbox label";
		gap: 0.5rem;
		align-items:start;
		justify-content: start;
		margin-block-start: 1rem;
		break-inside: avoid;
		&:has(.fieldDisplayFieldDesc){
			grid-template-rows: auto min-content;
			grid-template-areas: "checkbox label"
			"description description";
		}
		&:nth-of-type(1){
			margin-block-start: 0;
		}
	}
	.fieldDisplayFieldInput{
		width: ${pxRem20}rem;
		height: ${pxRem20}rem;
		grid-area: checkbox;
		margin:0;
		padding:0;
		cursor: pointer;
		&:focus + .fieldDisplayFieldLabel{
			text-decoration: underline;
		}
	}
	.fieldDisplayFieldLabel{
		grid-area: label;
		font-size: ${regFont};
		align-self: stretch;
		font-weight: ${theme.typography.weight.bold};
		cursor: pointer;
		&:hover{
			text-decoration: underline;
		}
	}
	.fieldDisplaySaved{
		grid-area: message;
		font-size: ${regFont};
		background-color: ${theme.background.warning};
		padding: 0.5rem 1rem;
		display:inline-flex;
		margin-inline: 0 auto;
		margin-block: 0;
		font-weight: ${theme.typography.weight.bold};
		color: ${theme.color.darkest};
	}
	.fieldDisplayFieldDesc{
		grid-area: description;
		padding:0;
		margin:0;
		text-align: start;
		font-size: ${smallFont};
		line-height: 1.1;
	}
	.fieldDisplayBtn{
		display:inline-flex;
		padding: 0.5rem;
		font-size: ${regFont};
		line-height: 1.2;
		border: ${theme.appBorderColor} 1px solid;
		border-radius: ${theme.appBorderRadius / 16}rem;
		margin:0;
		pointer-events: all;
		cursor: pointer;
		background-color: var(--field-btn-color);
		&.btnSubmit{
			--field-btn-color: ${theme.background.positive};
			color: ${theme.color.darkest};
			grid-area: btnSubmit;
			&:hover, &:focus-visible{
				background-color: oklch(from ${theme.background.positive} calc(l * .85) c h);
				text-decoration: underline;
			}
		}
		&.btnReset{
			--field-btn-color:${theme.background.negative};
			color: ${theme.color.darkest};
			grid-area: btnReset;
			&:hover, &:focus-visible{
				background-color: oklch(from ${theme.background.negative} calc(l * .85) c h);
				text-decoration: underline;
			}
		}
	}
	@container fieldWrapper (min-width: 500px){
		.fieldDisplayFieldset{
			columns:2;
		}
	}
	@container fieldWrapper (min-width: 800px){
		.fieldDisplayFieldset{
			columns:3;
		}
	}
	`;
}
export function workItemStyles(selector:string, theme:Theme) {
	return dedent/* css */ `
	${rootVars()}
	.azureWorkItems{
		position: absolute;
		inset:0;
		width: 100%;
		height: auto;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		container-type: size;
		container-name: workitem-addon;
		--border-colour: ${borderColour};
		--list-padding: 1rem;
		--shadow-spread: 0.5rem;
	}
	
	.tabGrid{
		position: relative;
		width: 100%;
		height: auto;
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr;
		grid-template-areas: "tablist tabcontent";
	}
	.tabNav{
		position: relative;
		width: auto;
		height: auto;
		display: flex;
		flex-flow: column nowrap;
		align-items: start;
		justify-content: start;
		grid-area: tablist;
		overflow-x: visible;
		list-style:none;
		max-width: 30cqw;
		margin:0;
		padding: var(--list-padding) 0;
		gap:0;
		scrollbar-width:none;
	}
	.tabNavItem{
		position: relative;
		width: 100%;
		height:auto;
		display: inline-flex;
		flex: 0 1 auto;
		border: 1px solid var(--border-colour);
		border-inline-end: 0;
		z-index:1;
		background: var(--color-bg);
		&:has(.tabNavButton:disabled){
			--border-colour: ${borderColourSelected};
			z-index: 3;
			clip-path: rect(-20px calc(100% - 1px) calc(100% + ${pxRem20}rem) 0);
			box-shadow: 0px 0px var(--shadow-spread) 0px ${boxShadowColour};
		}
	}
	.tabNavButton{
		position:relative;
		padding:0;
		margin:0;
		width:100%;
		display: inline-flex;
		padding-inline: 0.25rem var(--shadow-spread);
		padding-block: 0.5rem;
		background: transparent;
		border:0;
		margin:0;
		gap: 0.25rem;
		font-size: 1rem;
		line-height: 1;
		white-space: nowrap;
		text-align: start;
		justify-content: start;
		color: var(--color-text);
		&:not(:disabled){
			cursor:pointer;
			&:hover, &:focus-visible{
				text-decoration: underline;
			}
		}
		*{
			pointer-events: none;
		}
	}
	.tabNavButtonImg{
		position:relative;
		width: 1rem;
		height: 1rem;
		flex: 0 0 1rem;
		object-fit: contain;
		object-position: center center;
	}
	.tabNavButtonText{
		position: relative;
		width: auto;
		height: auto;
		flex: 1 1 auto;
		white-space: nowrap;
  		overflow: hidden;
  		text-overflow: ellipsis;
	}
	.tabContent{
		position:relative;
		width: calc(100% + 2px);
		inset-inline-start: -2px;
		height:auto;
		display: flex;
		flex-flow: row wrap;
		list-style:none;
		margin:0;
		padding: var(--list-padding);
		gap: 0.5rem;
		container-type: inline-size;
		container-name: workitem-tab;
		grid-area: tabcontent;
		align-items: start;
		align-content: start;
		background: var(--color-bg);
		z-index:2;
		box-shadow: 0px 0px var(--shadow-spread) 0px ${boxShadowColour};
		border-inline-start: 1px solid ${borderColourSelected};
		&[inert]{
			display:none;
		}
	}
	.tabContentTitle{
		position: relative;
		width:auto;
		height: auto;
		display: inline-flex;
		margin:0;
		flex: 0 1 auto;
		font-size: 1.5rem;
		line-height: 1.5rem;
		color: var(--color-text);
	}
	.tabContentLink{
		position: relative;
		width:auto;
		height: auto;
		display: inline-flex;
		margin:0;
		flex: 0 1 auto;
		align-self: stretch;
		color: var(--color-link);
		a{
			font-size: 1rem;
			line-height: 1rem;
			margin-block: auto 0;
			display:block;
			color: inherit;
			text-decoration: underline;
			&:hover, &:focus-visible{
				text-decoration: none;
			}
		}
		
	}
	.tabContentRefresh{
		position: relative;
		width:auto;
		height: auto;
		display: inline-flex;
		margin:0;
		flex: 0 1 auto;
	}
	.tabContentList{
		position: relative;
		width:auto;
		height: auto;
		display: block;
		column-count: 1;
		column-gap: 1rem;
		margin:0;
		flex: 1 1 100%;
		gap: 0.5rem;
		list-style: none;
		padding: var(--list-padding) 0 0;
	}
	@container workitem-tab (min-width: 500px) {
		.tabContentList{
			column-count: 2;
		}
	}
	@container workitem-tab (min-width: 800px) {
		.tabContentList{
			column-count: 3;
		}
	}
	@container workitem-tab (min-width: 1100px) {
		.tabContentList{
			column-count: 4;
		}
	}
	.tabContentListItem{
		position: relative;
		width:auto;
		height:auto;
		padding:0;
		margin:0;
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto;
		grid-template-areas: "label content";
		gap: 0.25rem;
		&:has(p){
			grid-template-columns: 1fr;
			grid-template-rows: auto auto;
			grid-template-areas: "label"
			"content";
		}
		> p.workItemLabel{
			margin-block-end: 0.25rem;
		}
	}
	.workItemLabel{
		position:relative;
		cursor:pointer;
		grid-area: label;
		font-weight:bold;
		margin:0;
		color: var(--color-text);
		&::after{
			content: ":";
		}
	}
	.workItemValue {
		grid-area: content;
		border:0;
		background-color: var(--color-bg);
		color: var(--color-text);
		&:read-only {
			&:focus{
				outline: 0;
			}
			& + .workItemLabel{
				pointer-events:none;
				cursor:default;
			}
		}
	}

	@container workitem-addon (orientation: portrait) {
		.tabGrid{
			grid-template-columns: 1fr;
			grid-template-rows: min-content 1fr;
			grid-template-areas: "tablist"
			"tabcontent";
		}
		.tabNav{
			--list-padding: 0;
			flex-flow: row nowrap;
			overflow-y: hidden;
			overflow-x: auto;
			max-width:none;
		}
		.tabNavItem{
			width:auto;
			border: 1px solid var(--border-colour);
			border-block-end:0;
			&:has(.tabNavButton:disabled){
				clip-path: rect(-20px calc(100% + 20px) 100% -20px);
			}
			&:nth-of-type(1){
				border-inline-start:0;
			}
		}
		.tabContent{
			width: 100%;
			inset-inline-start: 0;
			inset-block-start: -1px;
			border:0;
			border-block-start: 1px solid ${borderColourSelected};
		}
		.tabNavButton{
			width:auto;
			padding-inline: 0.75rem;
		}
	}
	.loadingText{
		position:absolute;
		user-select: none;
		color: transparent;
	}
	.loadingIcon{
		position: absolute;
		left: calc(50% - 12px);
		top: calc(50% - 12px);
		animation-name: spin;
		animation-timing-function: linear;
		animation-duration: 1s;
		animation-iteration-count: infinite;
		transform-origin: 50% 50%;
	}
	@keyframes spin{
		0%{
			transform: rotate(0deg);
		}
		100%{
			transform: rotate(360deg);
		}
	}
	`
}