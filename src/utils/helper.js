//数组转对象
export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}
//对象转数组
export const mapToArr = (map) => {
    return Object.keys(map).map(key => {
        return map[key]
    })
}
//获取父元素节点，用于左侧列表的右键展开
export const getParentNode = (node, parentClassName) => {
    let current = node
    while (current !== null) {
        if (current.classList.contains(parentClassName)) {
            return current
        }
        current = current.parentNode
    }
    return false
}
//将时间戳转为时间
export const timestampToString = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}