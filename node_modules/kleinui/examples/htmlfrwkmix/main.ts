import { container, textInput } from "../../elements";
import {renderNode} from "../../lib";


let calendar = new container(

    new textInput().addEventListener("click", (self)=>{
        self.setValue("ey up there").applyLastChange()
    })
    
).addStyle("width: 100%; height: 100%;")


renderNode(calendar, document.getElementById("calendar")!)