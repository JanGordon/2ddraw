export const keys = new Map<string, boolean>([])
const keybinds = new Map<string, (()=>void)[]>([])

document.addEventListener("keydown", (e)=>{
    keys.set(e.key, true)
    if (keybinds.get(e.key)) {
        for (let i of keybinds.get(e.key)!) {
            i()
        }
    }
   
})

document.addEventListener("keyup", (e)=>{
    keys.set(e.key, false)
})

export function registerKeybind(key: string, callback: ()=>void) {
    if (keybinds.get(key)) {
        keybinds.get(key)!.push(callback)

    } else {
        keybinds.set(key, [callback])
    }
}