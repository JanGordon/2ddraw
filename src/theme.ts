import { styleGroup } from "kleinui"

var dynamicStyles = new Map<string, [styleGroup, ()=>([string, string])[]]>([])

export function dynamicStyleGroup(styles: ()=>([string, string])[], className: string) {
    var sT = new styleGroup(styles(), className)
    dynamicStyles.set(className, [sT, styles])
    return sT
}

export function updateDynamicStyleGroup(styleName: string) {
    var sT = dynamicStyles.get(styleName)
    if (sT?.length == 2) {
        sT[0].styles = sT[1]()
        var ss = document.head.querySelector("#" + sT[0].className)
        if (ss) {
            ss.innerHTML = sT[0].getCss()
        }
    } else {
        console.error("no style group named", styleName)
    }
}

export function updateAllDynamicStyles() {
    for (let i of dynamicStyles.keys()) {
        updateDynamicStyleGroup(i)
    }
}