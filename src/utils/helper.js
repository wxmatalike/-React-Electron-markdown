export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const mapToArr = (map) => {
    return Object.keys(map).map(key => {
        return map[key]
    })
}