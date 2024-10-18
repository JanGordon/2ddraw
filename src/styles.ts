import { styleGroup } from "kleinui";
import { theme } from "./preferences";
import { dynamicStyleGroup } from "./theme";

export var buttonStyles = dynamicStyleGroup(()=>[
    [".btn", `
        background-color: ${theme.buttonTheme.bgColor};
        border: 1px solid ${theme.buttonTheme.borderColor};
        border-radius: ${theme.buttonTheme.borderRadius}px; 
        padding: 0.3em 0.4em;
        color: ${theme.buttonTheme.textColor};
        width: 100%;
        font-weight: bolder;
    `],
    [".btn.selected", `
        background-color: ${theme.buttonTheme.selectedBgColor};    
    `]
], "btn")

export var inputStyles = dynamicStyleGroup(()=>[
    [".inpt", `
        background-color: ${theme.buttonTheme.bgColor};
        border: 1px solid ${theme.buttonTheme.borderColor};
        border-radius: ${theme.buttonTheme.borderRadius}px; 
        padding: 0.3em 0.4em;
        color: ${theme.buttonTheme.textColor};
        width: calc(100% - 0.8em);
        font-weight: bolder;
    `],
    [".inpt input", `
        width: calc(100% - 0.8em);
        border: 1px solid ${theme.buttonTheme.borderColor};
        background-color: ${theme.buttonTheme.bgColor};
        color: ${theme.buttonTheme.textColor};
    `],
], "inpt")



