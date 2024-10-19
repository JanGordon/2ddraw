import { styleGroup } from "kleinui"
import { updateAllDynamicStyles, updateDynamicStyleGroup } from "./theme"

export var lightTheme = {
    gridTheme: {
            minorColor: "lightgrey",
            majorColor: "lightgrey",
            minorWidth: 0.4,
            majorWidth: 2,
            bgColor: "white",
        },
    buttonTheme: {
        borderRadius: 4,
        borderColor: "rgb(153,153,153)",
        fontSize: 1,
        bgColor: "white",
        textColor: "black",
        fgColor: "black",
        selectedBgColor: "rgb(220, 220, 220)",
    },
    textTheme: {
        textColor: "black",
    }

    
}

export var darkTheme = {
    gridTheme: {
            minorColor: "rgb(10,10,10)",
            majorColor: "rgb(25,25,25)",
            minorWidth: 0.2,
            majorWidth: 2,
            bgColor: "rgb(36,36,36)",
        },
    buttonTheme: {
        borderRadius: 4,
        borderColor: "rgb(153,153,153)",
        fontSize: 1,
        bgColor: "rgb(36,36,36)",
        textColor: "white",
        fgColor: "white",
        selectedBgColor: "rgb(63,63,63)",
    },
    textTheme: {
        textColor: "white",
    }


    
}





export function setTheme(t: typeof lightTheme) {
    theme = t
    updateAllDynamicStyles()
}




export let theme = darkTheme
console.log(theme)



