import { button } from "kleinui/elements"
import { registerKeybind } from "./keys"
import { buttonStyles } from "./styles"

export const modeButtons = {
    select: new button("select").setAttribute("title", "select (s)"),
    draw: new button("draw").setAttribute("title", "draw (d)").addClass("selected"),
    move: new button("move").setAttribute("title", "move (f)")
}

registerKeybind("s", ()=>{
    selectMode("select")
})
registerKeybind("d", ()=>{
    selectMode("draw")
})
registerKeybind("f", ()=>{
    selectMode("move")
})

export var selectedMode = "draw"


for (let i of Object.entries(modeButtons)) {
    i[1].addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
        selectMode(i[0])
    })
}

function selectMode(mode: string) {
    for (let i of Object.values(modeButtons)) {
        i.removeClass("selected").applyLastChange()
    }
    modeButtons[mode].addClass("selected").applyLastChange()
    selectedMode = mode
}