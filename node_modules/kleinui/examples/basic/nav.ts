import { container } from "../../elements";
import { percentWidth, px } from "../../lib";

export function navbar() {
    return new container([]).setHeight(px(20)).setWidth(percentWidth(1))
}