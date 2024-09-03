import { container, button } from "../../elements"
import { appFrwkNode, percentHeight, percentWidth, px, shared, styleGroup } from "../../lib"


const resizerThickness = px(1)
const resizerHitBox = px(15)
const resizerStyles = new styleGroup([
    [".resizer-styles", `
        outline: none;
        background-color: black;
    `]
], "resizer-styles")

export function horizontalResizer(children: appFrwkNode[]) {
    const containerDiv = new container([]).setWidth(percentWidth(1)).setWidth(percentWidth(1)).applyStyle(["display: flex;", "flex-direction: row;"])
    let resizer = ()=>{
        var pressed = false
        var pressedOffsetX = 0
        document.addEventListener("pointerup", ()=>{
            pressed = false
        })
        let r = new button([
            new container([]).applyStyle(["position: absolute;", "z-index: 2;", "background-color: transparent;", "top: 0;", "left: 50%;", "transform: translateX(-50%);"]).setHeight(percentHeight(1)).setWidth(resizerHitBox).addEventListener("pointerdown", (self: button, e: Event)=>{
                pressed = true
                const c = containerDiv.htmlNode.getBoundingClientRect()
                const r = self.htmlNode.getBoundingClientRect()
                pressedOffsetX = (e as MouseEvent).clientX - c.left - r.left
            })
        ]).applyStyle(["position: relative;", "overflow: visible;"])
        document.addEventListener("pointermove", (e)=>{
            if (pressed) {
                const indexOfSelf = containerDiv.children.indexOf(r)!
                const left = containerDiv.children[indexOfSelf-1]!
                const right = containerDiv.children[indexOfSelf+1]!
                const targetWidth = left.width + right.width
                var totalWidthOfAllPartsLeft = 0 
                for (let i = 0; i < indexOfSelf-1; i++) {
                    totalWidthOfAllPartsLeft+=containerDiv.children[i].width
                }
                const newWidthOfLeft = (e as MouseEvent).clientX - pressedOffsetX - (totalWidthOfAllPartsLeft)
                const newWidthOfRight = targetWidth - newWidthOfLeft + r.width
                const leftToRightWidthRatio = newWidthOfLeft / newWidthOfRight
    
                const currentShareOfLeftAndRight = left.widthExpression(left).lengthOfShared + right.widthExpression(right).lengthOfShared
                var newRightSharedRatio = currentShareOfLeftAndRight / (leftToRightWidthRatio + 1)
                var newLeftSharedRatio = currentShareOfLeftAndRight - newRightSharedRatio
                // left.setWidth(px(newWidthOfLeft))
                console.log(newWidthOfLeft, newWidthOfRight)
                left.setWidth(shared(newLeftSharedRatio))
                right.setWidth(shared(newRightSharedRatio))
                containerDiv.updateDimensions()
            }
        })
        return r.addToStyleGroup(resizerStyles).setHeight(percentHeight(1)).setWidth(resizerThickness)
    }
    for (let index = 0; index < children.length; index++) {
        children[index].setHeight(percentHeight(1))
        let resizable = !children[index].flag.get("static")
        if (index+1 < children.length) {
            if (resizable) {
                containerDiv.addChildren([children[index], resizer()])
            } else {
                let dummyResizer = new button([]).addToStyleGroup(resizerStyles).setHeight(percentHeight(1)).setWidth(resizerThickness)
                containerDiv.addChildren([children[index], dummyResizer])

            }
        } else {
            containerDiv.addChildren([children[index]])
        }
    }
    return containerDiv
}

export function verticalResizer(children: appFrwkNode[]) {
    const containerDiv = new container([]).setHeight(percentHeight(1)).setWidth(percentWidth(1)).applyStyle(["display: flex;", "flex-direction: column;"])
    let resizer = ()=>{
        var pressed = false
        var pressedOffsetY = 0
        document.addEventListener("pointerup", ()=>{
            pressed = false
        })
        let r = new button([
            new container([]).applyStyle(["position: absolute;", "z-index: 2;", "background-color: transparent;", "top: 50%;", "left: 0;", "transform: translateY(-50%);"]).setWidth(percentWidth(1)).setHeight(resizerHitBox).addEventListener("pointerdown", (self: button, e: Event)=>{
                pressed = true
                const c = containerDiv.htmlNode.getBoundingClientRect()
                const r = self.htmlNode.getBoundingClientRect()
                pressedOffsetY = (e as MouseEvent).clientY - c.top - r.top
            })
        ]).applyStyle(["position: relative;", "overflow: visible;"])
        document.addEventListener("pointermove", (e)=>{
            if (pressed) {
                const indexOfSelf = containerDiv.children.indexOf(r)!
                const above = containerDiv.children[indexOfSelf-1]!
                const below = containerDiv.children[indexOfSelf+1]!
                const targetHeight = above.height + below.height
                var totalHeightOfAllPartsAbove = 0 
                for (let i = 0; i < indexOfSelf-1; i++) {
                    totalHeightOfAllPartsAbove+=containerDiv.children[i].height
                }
                const newHeightOfAbove = (e as MouseEvent).clientY - pressedOffsetY - (totalHeightOfAllPartsAbove)
                const newHeightOfBelow = targetHeight - newHeightOfAbove + r.height
                const aboveToBelowHeightRatio = newHeightOfAbove / newHeightOfBelow
    
                const currentShareOfAboveAndBelow = above.heightExpression(above).lengthOfShared + below.heightExpression(below).lengthOfShared
                var newBelowSharedRatio = currentShareOfAboveAndBelow / (aboveToBelowHeightRatio + 1)
                var newAboveSharedRatio = currentShareOfAboveAndBelow - newBelowSharedRatio
                // above.setHeight(px(newHeightOfAbove))
                above.setHeight(shared(newAboveSharedRatio))
                below.setHeight(shared(newBelowSharedRatio))
                containerDiv.updateDimensions()
            }
        })
        return r.addToStyleGroup(resizerStyles).setWidth(percentWidth(1)).setHeight(resizerThickness)
    }
    for (let index = 0; index < children.length; index++) {
        children[index].setWidth(percentWidth(1))
        let resizable = !children[index].flag.get("static")

        if (index+1 < children.length) {
            if (resizable) {
                containerDiv.addChildren([children[index], resizer()])
            } else {
                let dummyResizer = new button([]).addToStyleGroup(resizerStyles).setWidth(percentWidth(1)).setHeight(resizerThickness)
                containerDiv.addChildren([children[index], dummyResizer])

            }
        } else {
            containerDiv.addChildren([children[index]])
        }
    }
    return containerDiv
}