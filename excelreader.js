const reader = require('xlsx')
const file = reader.readFile('./Input/input.csv')

let excelData = []
const sheets = file.SheetNames

const readExcelFile = () => {       // helper function to parse through excel input
    for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]], {header: 1, raw: false})
            temp.forEach((res) => {
                excelData.push(res)
        })
    }
}

let cache = {}

const cacheExcelData = () => {      // helper function to cache the excel data by customer Id
    readExcelFile()
    for (const data of excelData) { 
        const customer = data[0]
        const month = data[1]
        const amount = data[2]
        if (cache[customer] === undefined) {
            cache[customer] = [[month, amount]]
        } else {
            cache[customer].push([month, amount])
        }
    }
}

const createOutput = () => {    // main function to take cache and output an excel sheet
    cacheExcelData()
    let monthlyResults = []
    for (let customerId in cache) { 
        cache[customerId].sort((a,b) => {   // sorts each customers accounts by date
            return new Date(a[0])- new Date(b[0]) || b[1] - a[1]    // if there are multiple transactions on the same day, apply credit transactions first
        }) 
        let monthlyData = calculateMonthlies(customerId, cache)
        for (let data in monthlyData) {
            monthlyResults.push([customerId, data, ...monthlyData[data]])
        }
    }
    const worksheet = reader.utils.json_to_sheet(monthlyResults, {skipHeader: true})
    const workbook = reader.utils.book_new()
    reader.utils.book_append_sheet(workbook, worksheet, "Monthly Balances")
    reader.writeFile(workbook, "AccountTransactions.csv")
}

const calculateMonthlies = (customerId, cache) => {     // helper function to keep track of max and min and final balances per month
    const accounts = cache[customerId]
    let monthlyData = {}
    let current = min = max = 0
    for (let i = 0; i < accounts.length; i++) {
        let month = new Date(accounts[i][0]).getMonth()+1
        let year = new Date(accounts[i][0]).getFullYear()
        const time = month + "/" + year
        if (monthlyData[time] === undefined) { 
            isNaN(Number(accounts[i][1])) ? current = 0 : current = Number(accounts[i][1])      // if the amount is NaN or empty, we'll treat it as "0"
            max = min = current     // new month/year, so reset min and max
            monthlyData[time] = [min, max, current]
        } else {                                         
            isNaN(Number(accounts[i][1])) ? current += 0 : current += Number(accounts[i][1])
            if (current > max) max = current
            if (current < min) min = current
            monthlyData[time] = [min, max, current]
        }
    }
    return monthlyData
}   

createOutput()
