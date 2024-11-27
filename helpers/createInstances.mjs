export const createInstances = ({arr, size}) => {
    let temp = []
    const calInstance = (arr.length/size)
    for (let i = 0; i < arr.length; i+=calInstance) {
      let pedacito = arr.slice(i, i + (calInstance))
      temp.push(pedacito)
    }
    return temp
}