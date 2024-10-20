import { kleinElementNode } from "kleinui";

export function rerender(p: kleinElementNode) {
    if (p.htmlNode) {
        p.lightRerender()
    }
}