import { kleinElementNode, renderBasics } from "./lib"

export class button extends kleinElementNode {
    htmlNode: HTMLButtonElement
    name = "button"
    render(target: HTMLElement): void {
        let element = document.createElement("button")
        renderBasics(this, element)
        target.appendChild(element)
    }
}
export class container extends kleinElementNode {
    htmlNode: HTMLDivElement
    name = "container"
    render(target: HTMLElement): void {
        let element = document.createElement("div")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class canvas extends kleinElementNode {
    htmlNode: HTMLCanvasElement
    name = "canvas"
    canvas = document.createElement("canvas")
    render(target: HTMLElement): void {
        renderBasics(this, this.canvas)
        target.appendChild(this.canvas)
    }
    getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
    getContext(contextId: "bitmaprenderer", options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null;
    getContext(contextId: "webgl", options?: WebGLContextAttributes): WebGLRenderingContext | null;
    getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null;

    getContext(contextId: string, options?: (CanvasRenderingContext2DSettings | ImageBitmapRenderingContextSettings | WebGLRenderingContext | WebGL2RenderingContext)) {
        return this.canvas.getContext(contextId, options)
    }
}

export class unorderedList extends kleinElementNode {
    htmlNode: HTMLUListElement
    name = "unordered-list"
    render(target: HTMLElement): void {
        let element = document.createElement("ul")
        renderBasics(this, element)
        target.appendChild(element)
    }
    
}

export class listItem extends kleinElementNode {
    htmlNode: HTMLLIElement
    name = "list-item"
    render(target: HTMLElement): void {
        let element = document.createElement("li")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class orderedList extends kleinElementNode {
    htmlNode: HTMLOListElement
    name = "ordered-list"
    render(target: HTMLElement): void {
        let element = document.createElement("ol")
        renderBasics(this, element)
        target.appendChild(element)
    }
}
export class image extends kleinElementNode {
    htmlNode: HTMLImageElement
    name = "img"
    setSrc(src: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLImageElement).src = src
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("img")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class video extends kleinElementNode {
    htmlNode: HTMLVideoElement
    name = "video"
    setSrc(src: string) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLVideoElement).src = src
        })
        return this
    }
    setControls(on: boolean) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLVideoElement).controls = on
        })
        return this
    }
    autoplay: boolean
    setAutoplay(on: boolean) {
        this.changes.push(()=>{
            (this.htmlNode as HTMLVideoElement).autoplay = on
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("video")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class audio extends kleinElementNode {
    htmlNode: HTMLAudioElement
    name = "audio"
    setSrc(src: string) {
        this.changes.push(()=>{
            this.htmlNode.src = src
        })
        return this
    }

    setControls(on: boolean) {
        this.changes.push(()=>{
            this.htmlNode.controls = on
        })
        return this
    }
    setAutoplay(on: boolean) {
        this.changes.push(()=>{
            this.htmlNode.autoplay = on
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("audio")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class link extends kleinElementNode {
    htmlNode: HTMLAnchorElement
    name = "link"
    setTarget(link: string) {
        this.changes.push(()=>{
            this.htmlNode.href = link
        })
        return this
    }
    render(target: HTMLElement): void {
        let element = document.createElement("a") as HTMLAnchorElement
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class paragraph extends kleinElementNode {
    htmlNode: HTMLParagraphElement
    name = "paragraph"
    render(target: HTMLElement): void {
        let element = document.createElement("p")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class header1 extends kleinElementNode {
    htmlNode: HTMLHeadingElement
    name = "header1"
    render(target: HTMLElement): void {
        let element = document.createElement("h1")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class header2 extends kleinElementNode {
    htmlNode: HTMLHeadingElement
    name = "header2"
    render(target: HTMLElement): void {
        let element = document.createElement("h2")
        renderBasics(this, element)
        target.appendChild(element)
    }
}

export class textInput extends kleinElementNode {
    htmlNode: HTMLInputElement
    name = "textInput"
    render(target: HTMLElement): void {
        let element = document.createElement("input")
        element.type = "text"
        renderBasics(this, element)
        target.appendChild(element)
    }
    setValue(val: string) {
        this.changes.push(()=>{
            this.htmlNode.value = val
        })
        return this
    }
}

export class rangeInput extends kleinElementNode {
    htmlNode: HTMLInputElement
    name = "rangeInput"
    render(target: HTMLElement): void {
        let element = document.createElement("input")
        element.type = "range"
        renderBasics(this, element)
        target.appendChild(element)
    }
    setRange(min: number, max: number) {
        this.changes.push(()=>{
            this.htmlNode.min = String(min)
            this.htmlNode.max = String(max)
        })
        return this
    }
    setValue(val: string) {
        this.changes.push(()=>{
            this.htmlNode.value = val
        })
        return this
    }
}

export class fileInput extends kleinElementNode {
    htmlNode: HTMLInputElement
    name = "fileInput"
    render(target: HTMLElement): void {
        let element = document.createElement("input")
        element.type = "file"
        renderBasics(this, element)
        target.appendChild(element)
    }
    setValue(val: string) {
        this.changes.push(()=>{
            this.htmlNode.value = val
        })
        return this
    }
}
