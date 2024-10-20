import { container, header2, listItem, unorderedList, textInput, button } from "kleinui/elements";
import { currentPart, menuList, selectPart } from "./main";
import { Part, parts } from "./part";
import { kleinElementNode, kleinTextNode, styleGroup } from "kleinui";
import { buttonStyles } from "./styles";
import { simulate, stopSimulation } from "./simulate";

export class collisionGroup {
    parts: Part[] = []
    name: string = "New Group"
    collide = true
    constructor(name: string) {
        this.name = name
    }
    listener: ()=>void
    addPart(p: Part) {
        this.parts.push(p)
    }
    removePart(p: Part) {
        this.parts.splice(this.parts.indexOf(p))
    }
    rerender() {
        this.listener()
    }

    simulate() {
        simulate(this)
    }
}

export const collisionGroups: collisionGroup[] = [
    new collisionGroup("Main Collision Group")
]

export function cgListItem(title: textInput, items: kleinElementNode[]) {
    const dropIcon = new kleinTextNode("˅")
    return new container(
        new button(title,new container(dropIcon).addStyle("margin-left: auto;")).addEventListener("click", (self) => {
            if (self.hasClass("hidden")) {
                for (let i of self.parent!.children) {
                    if (i != self) {
                        i.addStyle("display: block;").applyLastChange()
                    }
                }
                self.removeClass("hidden").applyLastChange()
                dropIcon.content = "˅"
                dropIcon.rerender()
            } else {
                for (let i of self.parent!.children) {
                    if (i != self) {
                        i.addStyle("display: none;").applyLastChange()
                    }
                }
                self.addClass("hidden").applyLastChange()
                dropIcon.content = "˄"
                dropIcon.rerender()
            }
            
        }).addStyle("display: flex; padding: 0; border: none; background-color: transparent;"),
        ...items
    ).addStyle("display: flex; width: 100%; flex-direction: column; gap: 0.3em;")
}

const CGStyles = new styleGroup([
    ["li.this-part::after", `
        content: " (This part)";

    `],
    ["li.this-part", `
        font-weight: bold;

    `],
    ["li", `
        list-style-type: "";
    `],
    [".cg", `
        margin-left: 3px;
    `]
], "cg")

function getCollisionGroupNode(group: collisionGroup) {
    
    const pList = new container(
    ).addToStyleGroup(CGStyles)
    var rF = () => {
        
        pList.removeAllChildren()
        pList.addChildren(
            new textInput().setAttribute("type", "checkbox").setAttribute("checked", "").addEventListener("input", (self)=>{
                group.collide = self.htmlNode.checked

            })
        )
        console.log(parts)
        for (let i of parts) {
            var input = new textInput().setAttribute("type", "checkbox").setAttribute(group.parts.includes(i) ? "checked" : "placeholder", "").addEventListener("input", ()=>{
                if (input.htmlNode.checked) {
                    for (let p of group.parts) {
                        if (i == p) {
                            return
                        }
                    }
                    group.addPart(i)
                } else {
                    group.removePart(i)
                }
            })
            if (i == currentPart) {
                pList.addChildren(new listItem(input, i.name).addClass("this-part"))
            } else {
                pList.addChildren(new listItem(input, i.name))
            }
            
        }
        console.log("rendered", group.parts, group)
        if (pList.htmlNode) {
            pList.lightRerender()

        }
    }
    group.listener = rF
    rF()
    return cgListItem(
        new textInput()
            .addEventListener("change", (self)=>{
                group.name = self.htmlNode.value
            })
            .addEventListener("click", (self, e)=>{
                e.stopImmediatePropagation()
            })
            .setAttribute("value", group.name)
            .addStyle("text-overflow: ellipsis; width: min-content; white-space: nowrap; overflow: hidden; border: none; background-color: transparent;"),
            
        [pList]
    )
    
}


var collisionGroupsNodeContainer = new container(...collisionGroups.map((g)=>getCollisionGroupNode(g))).addStyle("margin: 3px;")

var simulating = false

export var physicsConfig = menuList("Physics", 
    [collisionGroupsNodeContainer,
    new button("+").addToStyleGroup(buttonStyles).addEventListener("click", ()=>{
        collisionGroups.push(new collisionGroup("Group " + (collisionGroups.length + 1)))
        collisionGroupsNodeContainer.addChildren(getCollisionGroupNode(collisionGroups[collisionGroups.length-1]))
        collisionGroupsNodeContainer.lightRerender()
    }),
    new button("Simulate").addToStyleGroup(buttonStyles).addEventListener("click", (self)=>{
        if (simulating == false) {
            for (let i of collisionGroups) {
                i.simulate();
                (self.children[0] as kleinTextNode).content = "Stop Simulation"
                simulating = true
                self.children[0].rerender()
            }
        } else {
            for (let i of collisionGroups) {
                stopSimulation(i);
                (self.children[0] as kleinTextNode).content = "Simulate"
                simulating = false
                self.children[0].rerender()
            }
        }
        
    })

    ]
    
)


// this.collisionGroupsNode.removeAllChildren()
// this.collisionGroupsNode.children = collisionGroups.map((g)=>{
//     var getPartList = ()=>g.parts.map((p)=>{
//         if (p == this) {
//             return new listItem(
//                 p.name + " (This part)",
//             ).addStyle("font-weight: bold;")
//         } else {
//             return new listItem(p.name).addEventListener("click", ()=>{console.log("selected");selectPart(p)})
//         }
//     })
//     var CGPartList = new unorderedList(...getPartList())
//     return new container(
//         new header2(g.name),
//         new textInput().setAttribute("type","checkbox").addEventListener("input", (self)=>{
//             if (self.htmlNode.checked) {

//                 // double check this part isn't already in the group
//                 for (let i of g.parts) {
//                     if (i == this) {
//                         return
//                     }
//                 }
//                 g.parts.push(this)
//                 CGPartList.addChildren(new listItem(
//                     this.name + " (This part)",
//                 ).addStyle("font-weight: bold;"))
//                 CGPartList.lightRerender()

//             } else {
//                 for (let i of g.parts) {
//                     if (i == this) {
//                         g.parts.splice(g.parts.indexOf(this))
//                         CGPartList.removeAllChildren()
//                         CGPartList.addChildren(...getPartList())
//                         CGPartList.lightRerender()
//                     }
//                 }
//             }
//         }),
//         "- enable this part in the collision group",
        
//         CGPartList
//     )
// })
// this.collisionGroupsNode.lightRerender()
