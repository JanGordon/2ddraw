
export class DB {
    idb: IDBDatabase
    dbName: string
    open(dbName: string) {
        return new Promise<void>((res, rej)=>{
            this.dbName = dbName
            if (this.idb) {
                if (this.storesToCreate.length > 0) {
                    let actualStoresToMake: string[] = []
                    for (let storeName of this.storesToCreate) {
                        if (this.idb.objectStoreNames.contains(storeName)) {
                        } else {
                            actualStoresToMake.push(storeName)
                        }
                    }
                    if (actualStoresToMake.length > 0) {
                        this.idb.close()
                        let d = indexedDB.open(dbName, this.idb.version+1)
                        d.onupgradeneeded = () => {
                            this.idb = d.result
                            for (let storeName of actualStoresToMake) {
                                this.idb.createObjectStore(storeName)
                            }
                            this.storesToCreate = []
                        }
                        d.onsuccess = ()=>{
                            res()
                        }
                    } else {
                        res()

                    }
                    
                } else {
                    res()
                }
            } else {
                let openTrans = indexedDB.open(dbName)
                openTrans.onsuccess = ()=>{
                    this.idb = openTrans.result
                    this.open(dbName).then(()=>{
                        res()
                    })
                }
            }
        })
    }
    storesToCreate: string[] = []
    createStore(storeName: string) {
        this.storesToCreate.push(storeName)
    }
    putInStore(storeName: string, key: string, data: any) {
        return new Promise<boolean>((res)=>{
            this.open(this.dbName).then(()=>{
                if (this.idb.objectStoreNames.contains(storeName)) {
                    let obStore = this.idb.transaction(storeName, "readwrite").objectStore(storeName)
                    obStore.put(data, key)
                }
            })
        })
        
    }

    getFromStore(storeName: string, key: string) {
        return new Promise<any>((res, rej)=>{
            this.open(this.dbName).then(()=>{
                if (this.idb.objectStoreNames.contains(storeName)) {
                    let obStore = this.idb.transaction(storeName, "readwrite").objectStore(storeName)
                    let transaction = obStore.get(key)
                    transaction.onsuccess = ()=>{
                        res(transaction.result)
                    }
                    transaction.onerror = ()=>{
                        rej(transaction.result)
                    }

                }
            })
        })
    }
    constructor(dbName: string) {
        this.dbName = dbName
    }
}
