export const keys = new Map<string, boolean>([])

document.addEventListener("keydown", (e)=>{
    keys.set(e.key, true)
})

document.addEventListener("keyup", (e)=>{
    keys.set(e.key, false)
})