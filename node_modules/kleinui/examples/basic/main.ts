import { button, container, textInput } from "../../elements";
import { kleinNode, kleinTextNode, percentHeight, percentWidth, px, renderApp, shared, styleGroup } from "../../lib";
import { navbar } from "./nav";
import { verticalResizer, horizontalResizer } from "./resizers";

const c = new container()
var styl = new styleGroup([
    [".f", `
        background-color: pink;
    `]
], "f")

function demoButton() {
    return new button("press me for rewards").addEventListener("click",(self)=>{
        let d = (self.children[0] as kleinTextNode)
        d.content = "wow well done"
        d.rerender()
        c.addChildren(
            new button("Hello Im a new child"),
            new button("Hello Im a 2nd new child")
        )
        c.addStyle("color: red;")
        c.lightRerender()
    }).setHeight(shared(1)).addStyle("outline: none;").addToStyleGroup(styl)
}



let app = new container(
    // verticalResizer([
    //     navbar().setFlag("static", true),
    //     demoButton().setHeight(shared(1)),
    //     demoButton().setHeight(shared(1)),
    //     horizontalResizer([
    //         demoButton().setWidth(shared(1)),
    //         c.setWidth(shared(1))
    //     ]).setHeight(shared(1))
    // ]),
    
    new textInput().addEventListener("click", (self)=>{
        self.setValue("ey up there").applyLastChange()
    })
    
)


renderApp(app, document.body)