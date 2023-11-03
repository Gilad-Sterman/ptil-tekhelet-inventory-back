import fs from 'fs'
import { utilService } from './util.service.js'

const toys = utilService.readJsonFile('data/toy.json')

export const toyService = {
    query,
    get,
    remove,
    save
}

function query(filterBy) {
    let toysToreturn = toys
    // console.log(filterBy)
    if (filterBy.labels) {
        toysToreturn = toysToreturn.filter(toy => toy.labels.some(label => filterBy.labels.includes(label)))
    }
    if (filterBy.txt) {
        const regExp = new RegExp(filterBy.txt, 'i')
        toysToreturn = toysToreturn.filter(toy => regExp.test(toy.name))
    }
    if (filterBy.inStock === 'inStock') {
        toysToreturn = toysToreturn.filter(toy => toy.inStock)
    }
    if (filterBy.inStock === 'notInStock') {
        toysToreturn = toysToreturn.filter(toy => !toy.inStock)
    }
    if (filterBy.sortBy === 'price') {
        toysToreturn = toysToreturn.sort((toy1, toy2) => toy2.price - toy1.price)
    }
    if (filterBy.sortBy === 'createdAt') {
        toysToreturn = toysToreturn.sort((toy1, toy2) => toy2.createdAt - toy1.createdAt)
    }
    if (filterBy.sortBy === 'name') {
        toysToreturn = toysToreturn.sort((toy1, toy2) => {
            if (toy2.name > toy1.name) return -1
            return 1
        })
    }

    return Promise.resolve(toysToreturn)
}

function get(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    if (!toy) return Promise.reject('Toy not found!')
    return Promise.resolve(toy)
}

function remove(toyId, loggedinUser) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such Toy')
    const toy = toys[idx]
    // if (toy.owner._id !== loggedinUser._id) return Promise.reject('Not your toy')
    toys.splice(idx, 1)
    return _saveToysToFile()

}

function save(toy, loggedinUser) {
    if (toy._id) {
        const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
        // if (toyToUpdate.owner._id !== loggedinUser._id) return Promise.reject('Not your toy')
        toyToUpdate.name = toy.name
        toyToUpdate.price = toy.price
        toyToUpdate.labels = toy.labels
        toyToUpdate.inStock = toy.inStock
    } else {
        toy._id = _makeId()
        toy.createdAt = Date.now()
        // toy.inStock = true
        // toy.owner = loggedinUser
        toys.push(toy)
    }

    return _saveToysToFile().then(() => toy)
    // return Promise.resolve(toy)
}

function _makeId(length = 5) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function _saveToysToFile() {
    return new Promise((resolve, reject) => {

        const toysStr = JSON.stringify(toys, null, 4)
        fs.writeFile('data/toy.json', toysStr, (err) => {
            if (err) {
                return console.log(err);
            }
            console.log('The file was saved!');
            resolve()
        });
    })
}
