import { createPart, deleteAllParts, deletePart } from "./main";
import { Part, parts, Path, pathMap, pathStyle, setParts } from "./part";
import { rigidbody } from "./rigidbody";
import { Vec2 } from "./vec";
import { get, set } from 'idb-keyval';

export type PathSaveObject = {
    controlPoints: Vec2[][]
    style: pathStyle,
    type: string 
}

export type RigidbodySaveObject = {
    mass: number,
    hasGravity: boolean,
}

export type PartSaveObject = {
    name: string
    pos: Vec2,
    startPos: Vec2,
    rigidbody: RigidbodySaveObject
    paths: PathSaveObject[]
}

export type ProjectSaveObject = {
    parts: PartSaveObject[]
}

function savePart(p: Part): PartSaveObject {
    return {
        name: p.name,
        pos: p.pos,
        startPos: p.startPos,
        rigidbody: {
            mass: p.rigidbody.mass,
            hasGravity: p.rigidbody.hasGravity
        },
        paths: p.paths.map((path)=>{
            return {
                controlPoints: path.controlPoints,
                style: path.style,
                type: path.name
            }
        })
    }
}

function loadPart(p: PartSaveObject): Part {
    var pr = createPart()
    pr.name = p.name
    for (let v of p.paths) {
        console.log(v.type)
        var pConstructor = pathMap.get(v.type)
        if (pConstructor) {
            var path = pConstructor() as Path
            path.controlPoints = v.controlPoints
            path.style = v.style
            pr.addPath(path)
        } else {
            console.error("invalid path type: ", v.type)
            
        }
    }
    pr.pos = p.pos
    pr.startPos = p.startPos
    pr.rigidbody = new rigidbody(pr)
    pr.rigidbody.mass = p.rigidbody.mass
    pr.rigidbody.hasGravity = p.rigidbody.hasGravity
    return pr
}


export async function saveAs() {
    const options: SaveFilePickerOptions = {
        types: [
          {
            description: 'Draw Files',
            accept: {
              'text/plain': ['.drw'],
            },
          },
        ],
      };
      console.log("here")
    var fileHandle = await window.showSaveFilePicker(options)
    const writable = await fileHandle.createWritable();

    var toWrite = {
        parts: parts.map(savePart)
    } as ProjectSaveObject
    console.log(toWrite)
    await writable.write(JSON.stringify(toWrite))
    await writable.close()
    set("prev", fileHandle)

}

export async function save() {
    var fileHandle = await get("prev")
    if (!fileHandle) {
        saveAs()
        return
    }
    console.log("saving to", fileHandle.name)
    const writable = await fileHandle.createWritable();

    var toWrite = {
        parts: parts.map(savePart)
    } as ProjectSaveObject
    console.log(toWrite)
    await writable.write(JSON.stringify(toWrite))
    await writable.close()

}

export async function openFile() {
    var [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile()
    const saveObject = JSON.parse(await file.text()) as ProjectSaveObject
    console.log(saveObject)
    deleteAllParts()

    for (let p of saveObject.parts) {
        
        parts.push(loadPart(p))
    }
}

export async function openPrev() {
    var fileHandle = await get("prev") as FileSystemFileHandle
    if (!fileHandle) {
        return
    }

    
    if (await fileHandle.queryPermission() == "denied") {
        await fileHandle.requestPermission()
        if (await fileHandle.queryPermission() == "denied") {
            return
        } 
    } 
    
    
    const file = await fileHandle.getFile()
    const saveObject = JSON.parse(await file.text()) as ProjectSaveObject
    console.log(saveObject)
    deleteAllParts()

    for (let p of saveObject.parts) {
        
        parts.push(loadPart(p))
    }
}