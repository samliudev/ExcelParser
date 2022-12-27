const reader = require('xlsx')
const file = reader.readFile('./Input/input.xlsx')

let excelData = [] // contains all the information from the excel sheet


const sheets = file.SheetNames

const readExcelFile = () => {
    for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]], {header: 1, raw: false})
            temp.forEach((res) => {
                excelData.push(res)
        })
    }
}

let rows = []
const output = reader.utils.json_to_sheet(rows)
readExcelFile()

const cacheExcelData = () => {
    let cache = {}
    for (const data of excelData) {                    // caching all the excel data by customer Id
        const customer = data[0]
        const month = data[1]
        const amount = data[2]
        if (cache[customer] === undefined) {
            cache[customer] = [[month, amount]]
        } else {
            cache[customer].push([month, amount])
        }
    }
    let monthlyResults = []
    for (let customerId in cache) { 
        cache[customerId].sort((a,b) => new Date(a[0]) - new Date(b[0])) // sorts dates in cache by date

        let monthlyData = processCache(customerId, cache)
        for (let data in monthlyData) {
            monthlyResults.push([customerId, data, ...monthlyData[data]])
        }
    }
    console.log(monthlyResults)
    const worksheet = reader.utils.json_to_sheet(monthlyResults, {skipHeader: true})
    const workbook = reader.utils.book_new()
    reader.utils.book_append_sheet(workbook, worksheet, "Monthly Balances")
    reader.writeFile(workbook, "AccountTransactions.xlsx")
}
// 11/2022 : min, max, current
const processCache = (customerId, cache) => {       // keeping track of max and min and final per month
    const accounts = cache[customerId]
    let monthlyData = {}
    let current = min = max = 0
    for (let i = 0; i < accounts.length; i++) {
        let month = new Date(accounts[i][0]).getMonth()+1
        let year = new Date(accounts[i][0]).getFullYear()
        const time = month + "/" + year
        if (monthlyData[time] === undefined) { 
            current = Number(accounts[i][1])
            max = min = current                           // new month/year, so reset min and max
            monthlyData[time] = [min, max, current]
        } else {                                    // update existing entry
            current += Number(accounts[i][1])
            if (current > max) max = current
            if (current < min) min = current
            monthlyData[time] = [min, max, current]
        }
        
    }
    return monthlyData
}   

cacheExcelData()
