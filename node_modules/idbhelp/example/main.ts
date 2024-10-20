import {DB} from "../lib"

const db = new DB("idbhelpertest")
db.createStore("people")
const personName = document.getElementById("name") as HTMLInputElement
const gender = document.getElementById("gender") as HTMLInputElement
const age = document.getElementById("age") as HTMLInputElement
document.getElementById("add")?.addEventListener("click", async ()=>{
    await db.putInStore("people", personName.value, {age: age.value, gender: gender.value})
})

const showName = document.getElementById("show-name") as HTMLInputElement
const peopleDiv = document.getElementById("people") as HTMLDivElement
document.getElementById("show")?.addEventListener("click", async ()=>{
    peopleDiv.innerHTML = JSON.stringify(await db.getFromStore("people", showName.value))
})  

