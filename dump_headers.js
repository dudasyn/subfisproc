const xlsx = require('xlsx'); 
const wb = xlsx.readFile('data/Planilha.xlsx'); 
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(Object.keys(data[0]));
