import { styleGroup } from "kleinui";

export var buttonStyles = new styleGroup([
    [".btn", `
        background-color: white;
        border: 1px solid rgb(153,153,153);
        border-radius: 4px; 
        padding: 0.3em 0.4em;
        width: 100%;
        font-weight: bolder;
    `],
    [".btn.selected", `
        background-color: rgb(220,220,220);    
    `]
], "btn")