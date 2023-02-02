/**
 * @author Denis Romaniko
 **/

//---------------------------------------------------------
// Common variables
//---------------------------------------------------------
var uberUuidColumnName = "Identyfikator UUID kierowcy";
var uberDriverNameColumnName = "Imię kierowcy";
var uberDriverSurnameColumnName = "Nazwisko kierowcy";
var uberSumColumnName = "Wypłacono Ci : Twój przychód";
var uberCashColumnName = "Wypłacono Ci : Bilans przejazdu : Wypłaty : Odebrana gotówka";

var uberEatsUuidColumnName = "Identyfikator UUID kierowcy";
var uberEatsUserNameColumnName = "Imię kierowcy";
var uberEatsUserSurnameColumnName = "Nazwisko kierowcy";
var uberEatsSumColumnName = "Wypłacono Ci";

var boltPhoneColumnName = "Telefon"; //B
var boltDriverNamesColumnName = "Kierowca"; //A
var boltSumColumnName = "Wartość brutto"; //D
var boltCashColumnName = "Przejazdy gotówkowe (przyjęta gotówka)"; //J
var boltOplataColumnName = "Opłata Bolt"; //I
var boltCancelFeeColumnName = "Opłata za anulowanie"; //E
var boltBonusColumnName = "Bonus"; //L
var boltReturnsColumnName = "Zwroty"; //N
var boltTipsColumnName = "Napiwek"; //O
var boltDiscountColumnName = "Zniżki gotówkowe zrekompensowane przez Bolt "; //K
var boltBalanceColumnName = "Tygodniowy bilans"; //P

var freeDriverNameColumnName = "DRIVER FIRST NAME";
var freeDriverSurnameColumnName = "DRIVER LAST NAME";
var freeIdColumnName = "DRIVER ID";
var freeAmountColumnName = "TOUR VALUE";
var freeTipsColumnName = "TOUR TIP";
var freePaymentTypeColumnName = "PAYMENT METHOD";
var freeTollColumnName = "TOLL VALUE";
var freeBonusesIdColumnName = "id_driver";
var freeBonusesValueColumnName = "bonus_gross_value";
var freeBonusesNameColumnName = "bonus_name";

var woltIdColumnName = "Courier ID";
var woltUserNameColumnName = "Courier Name";
var woltAmountColumnName = "Amount";
var woltItemColumnName = "Item";

var filterEkasa = "Opłata e-kasa"; //free Now
var filterPartner = "Partner"; //free Now
var filterWszyscyKierowcy = "Wszyscy Kierowcy"; //Bolt

var isTaxi = 0;

//---------------------------------------------------------
// Converting an array of objects with driver data
// to CSV format
// objArray - data array
//---------------------------------------------------------
function arrayToCsv(objArray, delimiter = ";") {
	let resultArray = Object.values(objArray);
	let csv = resultArray.map(row => {return Object.values(row).join(delimiter);}).join("\r\n");

	return csv;
}

//---------------------------------------------------------
// Convert strings with names to 'FirstName LastName' format
//---------------------------------------------------------
function formatName(name) {
	return name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, match => match.toUpperCase());
}

//---------------------------------------------------------
// Removing an element from the DOM
//---------------------------------------------------------
function removeElement(elementd) {
	let element = document.getElementById(elementd);

	if (element) element.remove();
}

//---------------------------------------------------------
// Display error message
//---------------------------------------------------------
function displayMessage(message = "", isDisplayed = 0) {
	let reportSpan = document.getElementById("krakenNoData");
	reportSpan.textContent = message;

	removeElement("krakenTable");

	if (isDisplayed === 1) reportSpan.className = "showCell";
	else reportSpan.className = "";
}

//---------------------------------------------------------
// Getting data from Dolibarr
//---------------------------------------------------------
function getDoliData() {
	let doliData = [];
	const DOLLI_URL = "";
	const url = "https://" + DOLLI_URL + "/api/index.php/users?sortfield=t.rowid&sortorder=ASC&limit=0";
	const request = new Request(url, {
		method: "GET",
		cache: "no-cache",
		headers: {
			"Accept": "application/json", 
			"DOLAPIKEY": ""
		},
	});

	fetch(request)
		.then(response => {
			if (!response.ok) throw new Error("HTTP response is not Okay");
			return response.json();
		}).then(result => {
			doliData = Object.values(result).map(entry => {
				let userDataIban = "", userDataUberId = "", userDataBoltId = "", userDataFreeId = "", userDataWoltId = "";
				let userDataId = entry.id;
				let userDataName = formatName(entry.firstname + " " + entry.lastname);
				let userDataMobile = entry.user_mobile;
				let userDataExtra = entry.array_options;
				if (userDataExtra.options_ut513) userDataIban = userDataExtra.options_ut513.replace(/\s/g, "");
				if (userDataExtra.options_ut530) userDataUberId = userDataExtra.options_ut530;
				if (userDataExtra.options_ut531) userDataFreeId = userDataExtra.options_ut531;
				if (userDataExtra.options_ut532) userDataWoltId = userDataExtra.options_ut532;
				if (userDataExtra.options_ut533) userDataBoltId = userDataExtra.options_ut533;

				userDataIban = (userDataIban.length !== 26) ? "00000000000000000000000000" : userDataIban;

				let userData = {key: userDataId, name: userDataName, mobile: userDataMobile, iban: userDataIban, 
					uberId: userDataUberId, boltId: userDataBoltId, freeId: userDataFreeId, woltId: userDataWoltId};
				return userData;
			});
			earningsCalculation(doliData);
		}).catch(error => {
			console.log("There is the following problem with fetch: ", error);
			// Continuation of calculations if a local file with account numbers is uploaded
			let ibans = localStorage.getItem("ibans");
			if (ibans.length > 0) earningsCalculation(doliData);
			else displayMessage("Проблема с подключением к Dolibarr ERP", 1);
		});
}

//---------------------------------------------------------
// Print data
// rootElementId = ID of the root DOM element to print
//---------------------------------------------------------
function printData(rootElementId) {
	let printElement = document.getElementById(rootElementId);
	let newWindow = window.open();

	if (localStorage.krakenZero > 0)
		newWindow.document.write("<style>.krakenZero {display:none;}</style>");

	newWindow.document.write("<style>td.showCell {display:none !important;}\n.krakenDataRow:hover {opacity:1 !important;}</style>");
	newWindow.document.write(printElement.outerHTML);
	newWindow.print();
	newWindow.close();
}

//---------------------------------------------------------
// Saving data to CSV
// objArray - data array
//---------------------------------------------------------
function saveData2CSV(objArray) {
	let csv = [Object.keys(objArray[0])].concat(objArray).map(
		it => {return Object.values(it).join(";")}).join("\r\n");
	let filename = "export_" + Date.now().toString();
	let csvBlob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
	let csvUrl = URL.createObjectURL(csvBlob);
	let onclickCSVString = "window.location.href='" + csvUrl + "';";
	let exportButtonCSV = document.getElementById("krakenExport" + "CSV");

	exportButtonCSV.setAttribute("onclick", onclickCSVString);
	exportButtonCSV.removeAttribute("disabled");
}

//---------------------------------------------------------
// Forming an array for importing money transfers in Santander
//---------------------------------------------------------
function userData2Santander() {
	let table = document.getElementById('krakenTable');
	let button = document.getElementById('krakenExport2Bank');
	let separator = "|", adres = "", title = "na podstawie umowy najmu samochodu";
	let rachunekWinien = "";
	let dateNow = ((new Date(Date.now()).toLocaleString("ru-RU")).split(",")[0]).split(".").join("-");

	let resultData = [...table.rows].map(row => [...row.children].map(cell => {return cell.innerText;}));
	resultData = resultData.slice(1).filter(element => element[element.length - 2] > 0);

	let mfPlusData = "4120414|1\r\n";
	mfPlusData += resultData.map(
		element => {
			let name = element[2];
			let kwota = element[element.length - 2];
			let iban = element[element.length - 1].replace(/\s/g, "");
			iban = (iban.length !== 26) ? "00000000000000000000000000" : iban;
			let recipient = (name.length < 80) ? name : name.substring(0, 80);
			let transfer = "1" + separator + rachunekWinien + separator + 
				iban + separator + recipient + separator + adres + separator + 
				kwota + separator + "1" + separator + title + separator + dateNow + separator;
			return transfer;
		}).join("\r\n");

//	button.addEventListener("click", function bankClick(event){});
	let tempLink = document.createElement("a");
	let bankBlob = new Blob([mfPlusData], {type: "text/plain;charset=windows-1250"});
	tempLink.setAttribute("href", URL.createObjectURL(bankBlob));
	tempLink.setAttribute("download", "santander.txt");
	tempLink.click();
	URL.revokeObjectURL(tempLink.href);
	tempLink.remove();
}

//---------------------------------------------------------
// Changing the display of data in rows with zeros
//---------------------------------------------------------
function emptyRows() {
	let stylesheet = document.styleSheets[document.styleSheets.length - 1];
	let krakenZero = localStorage.getItem("krakenZero");

	if (krakenZero > 0) {
		stylesheet.deleteRule(0);
		localStorage.setItem("krakenZero", 0);
	} else {
		stylesheet.insertRule(".krakenZero {display:none;}", 0);
		localStorage.setItem("krakenZero", 1);
	}
}

//---------------------------------------------------------
// Drawing data on employees into a table, exporting and printing
//---------------------------------------------------------
function drawTable(data, useIbans, taxi) {
	// Cleaning up old data
	displayMessage();

	// Setting the flag for working with drivers or couriers
	if (taxi === 1) isTaxi = 1;
	else isTaxi = 0;

	// Drawing new data
	let tableHeader;
	// Payout and IBAN should always be the last fields (required for export 2 bank)!!
	if (isTaxi === 1)
		tableHeader = ["#", "Key", "ФИО", 
			"Uber", "Нал.", "VAT", 
			"Bolt", "Нал.", "VAT", 
			"Free", "Нал.", "VAT", 
			"Netto", "Нал.", "VAT", 
			"Ком.", "ZUS", "Долг", "Факт.", "Аренда", 
			"Выплата", "IBAN"];
	else 
		tableHeader = ["#", "Key", "ФИО", 
			"UberEats", "VAT", 
			"Wolt", "Чаевые", "VAT", 
			"Netto сумма", "VAT сумма", 
			"Ком.", "ZUS", "Долг", "Факт.", "Аренда", 
			"Выплата", "IBAN"];
	let table = document.createElement("table");
	let tableData = Object.values(data).sort((a, b) => a.name.localeCompare(b.name));
	let rootElement = document.getElementById("krakenData");
	let index = 0;

	table.id = "krakenTable";
	table.className = "krakenDataTable";
	for (let rowData of tableData) {
		if (index === 0) {
			let headerRow = table.insertRow(-1);//(-1) for last position in Safari
			headerRow.className = "krakenHeader";
			headerRow.setAttribute("onclick", "emptyRows()");
			index++;

			// Filling the first cells with column names
			for (let header of tableHeader) {
				let cell = headerRow.insertCell();
				cell.textContent = header;
				if (header === "Key") cell.className = "key";
				if (header === "IBAN")
					if (useIbans === 1) cell.className = "showCell";
					else cell.className = "hideCell";
			}
		}

		let row = table.insertRow(-1);//(-1) is for the last position in Safari!
		row.className = "krakenDataRow";

		let indexCell = row.insertCell();
		indexCell.className = "krakenIndex";
		indexCell.setAttribute("onclick", "emptyRows()");

		let cellZus, cellDebt, cellInv, cellRent;
		let cellZusId = "zus" + index;
		let cellDebtId = "debt" + index;
		let cellInvId = "inv" + index;
		let cellRentId = "rent" + index;
		let payoutCellId = "payout" + index;
		let valueSum = 0, cellZusValue = 0, cellDebtValue = 0, cellInvValue = 0, cellRentValue = 0;

		for (let [key, value] of Object.entries(rowData)) {
			let cell = row.insertCell();
			cell.className = key;

			if (value < 0) cell.className += " krakenNegative";
			if (!isNaN(value) && key !== "key" && key !== "iban") {
				cell.textContent = value.toFixed(2);
				valueSum += value;
            } else cell.textContent = value;

			if (key === "name") cell.setAttribute("onclick", "this.setAttribute('contenteditable', 'true');");

			if (key === "zus") {
				cellZus = cell;
				cellZusValue = value;
				if (valueSum !== 0) cell.id = cellZusId;
			}

			if (key === "debt") {
				cellDebt = cell;
				cellDebtValue = value;
				if (valueSum !== 0) cell.id = cellDebtId;
			}

			if (key === "inv") {
				cellInv = cell;
				cellInvValue = value;
				if (valueSum !== 0) cell.id = cellInvId;
			}

			if (key === "rent") {
				cellRent = cell;
				cellRentValue = value;
				if (valueSum !== 0) cell.id = cellRentId;
			}

			if (key === "payout" && valueSum !== 0) {
				cell.id = payoutCellId;
				cell.textContent = parseFloat(value - cellZusValue - cellDebtValue - cellInvValue - cellRentValue).toFixed(2);

				cellZus.setAttribute("onclick", "this.setAttribute('contenteditable', 'true');");
				cellDebt.setAttribute("onclick", "this.setAttribute('contenteditable', 'true');");
				cellInv.setAttribute("onclick", "this.setAttribute('contenteditable', 'true');");
				cellRent.setAttribute("onclick", "this.setAttribute('contenteditable', 'true');");

				cellZus.setAttribute("onkeyup", 
					payoutCellId + ".textContent = parseFloat(parseFloat(" + value + ") - parseFloat(" + cellZusId + ".textContent) - parseFloat(" + 
					cellDebtId + ".textContent) - parseFloat(" + cellInvId + ".textContent) - parseFloat(" + cellRentId + ".textContent)).toFixed(2);" + 
					"if (parseFloat(" + payoutCellId + ".textContent) < 0) " + payoutCellId + ".setAttribute('style', " + 
					"'color:red;font-weight:800;'); else " + payoutCellId + ".setAttribute('style', 'color:black;font-weight:400;');");
				cellDebt.setAttribute("onkeyup", 
					payoutCellId + ".textContent = parseFloat(parseFloat(" + value + ") - parseFloat(" + cellZusId + ".textContent) - parseFloat(" + 
					cellDebtId + ".textContent) - parseFloat(" + cellInvId + ".textContent) - parseFloat(" + cellRentId + ".textContent)).toFixed(2);" + 
					"if (parseFloat(" + payoutCellId + ".textContent) < 0) " + payoutCellId + ".setAttribute('style', " + 
					"'color:red;font-weight:800;'); else " + payoutCellId + ".setAttribute('style', 'color:black;font-weight:400;');");
				cellInv.setAttribute("onkeyup", 
					payoutCellId + ".textContent = parseFloat(parseFloat(" + value + ") - parseFloat(" + cellZusId + ".textContent) - parseFloat(" + 
					cellDebtId + ".textContent) - parseFloat(" + cellInvId + ".textContent) - parseFloat(" + cellRentId + ".textContent)).toFixed(2);" + 
					"if (parseFloat(" + payoutCellId + ".textContent) < 0) " + payoutCellId + ".setAttribute('style', " + 
					"'color:red;font-weight:800;'); else " + payoutCellId + ".setAttribute('style', 'color:black;font-weight:400;');");
				cellRent.setAttribute("onkeyup", 
					payoutCellId + ".textContent = parseFloat(parseFloat(" + value + ") - parseFloat(" + cellZusId + ".textContent) - parseFloat(" + 
					cellDebtId + ".textContent) - parseFloat(" + cellInvId + ".textContent) - parseFloat(" + cellRentId + ".textContent)).toFixed(2);" + 
					"if (parseFloat(" + payoutCellId + ".textContent) < 0) " + payoutCellId + ".setAttribute('style', " + 
					"'color:red;font-weight:800;'); else " + payoutCellId + ".setAttribute('style', 'color:black;font-weight:400;');");
			}

			if (key === "iban")
				if (useIbans === 1) {
					cell.setAttribute("onclick", "this.setAttribute('contenteditable', 'true');");
					if (cell.textContent === "00000000000000000000000000") cell.className += " krakenNoIban";
					cell.className += " showCell";
				} else cell.className += " hideCell";
		}

		if (valueSum === 0) row.className += " krakenZero";
		else indexCell.textContent = index++;
    }

	// Table rendering
  	emptyRows();
	rootElement.appendChild(table);
	
	// Saving data as a local file
	saveData2CSV(tableData)

	// Saving data as a file in Santander format
	let exportButtonBank = document.getElementById("krakenExport" + "2Bank");
	if (useIbans === 1) exportButtonBank.removeAttribute("disabled");

	// Availability of the print button
	let printButton = document.getElementById("krakenPrint");
	printButton.removeAttribute("disabled");

	// Availability of the CRM button
	let crmButton = document.getElementById("krakenPostSalaries");
	let crmDate = document.getElementById("krakenSalaryDate");
	crmDate.valueAsDate = new Date();
	crmButton.removeAttribute("disabled");

	// Availability of the calculation button
	let salaryButton = document.getElementById("krakenSalary");
	salaryButton.setAttribute("disabled", "");
}

//---------------------------------------------------------
// Saving salaries to Dolibarr
//---------------------------------------------------------
function saveSalaries() {
	let table = document.getElementById('krakenTable');
	let button = document.getElementById('krakenPostSalaries');
	let dateep = document.getElementById("krakenSalaryDate").value;

	let resultData = [...table.rows].slice(1).map(row => {
		let rowData = {};
		for (let cell of row.cells) rowData[cell.className.split(" ")[0]] = cell.textContent;
		rowData["dateep"] = dateep;

		return {userData: rowData};
	});
	resultData = resultData.filter(element => element.userData.payout > 0);
	resultData = JSON.stringify(resultData);

	if (confirm("Записать данные по выплатам в базу данных ?\n(Будут записаны только данные по положительным выплатам для существующих работников.)")) {
		jQuery.ajax({
			url: "/data.php",
			method: "POST",
			data: { "isTaxi": isTaxi, "dataArray": resultData }
		});

		button.setAttribute("disabled", "");
	}
}

//---------------------------------------------------------
// Uploading of CSV files
//---------------------------------------------------------
function loadDataFiles(event) {
	let files = event.target.files;
	let company = "test";
	let reader = new FileReader();
	let button = document.getElementById("krakenSalary");

	// Clearing all data to download new ones
	localStorage.setItem("uber", "");
	localStorage.setItem("bolt", "");
	localStorage.setItem("free", "");
	localStorage.setItem("freeBonuses", "");
	localStorage.setItem("uberEats", "");
	localStorage.setItem("wolt", "");
	//localStorage.setItem("xpress", "");
	//localStorage.setItem("boltFood", "");
	localStorage.setItem("ibans", "");

	// Recursive function to read data from selected files
	function readFile(index) {
		// Exit if no file has been selected for download
		if (index >= files.length) return;

		let file = files[index];
		let filename = file.name;

		// Handling the onload event
		reader.onload = function(e) {
			let fileText = e.target.result;

			// Determining source types from data in a file
			if (fileText.indexOf("Opłata za dojazd") >= 0) company = "uberEats";
			else if (fileText.indexOf("BOOKING ID") >= 0) company = "free";
			else if (fileText.indexOf("bonus_name") >= 0) company = "freeBonuses";
			else if (fileText.indexOf("Opłata Bolt") >= 0) {
				company = "bolt";

				// If the Bolt file is full, then discard the data for each day
				let boltWeekDataLength = fileText.indexOf("Kierowca", 50) - 1;
				if (boltWeekDataLength > 0) fileText = fileText.slice(0, boltWeekDataLength);
			} else if (fileText.indexOf("Identyfikator UUID kierowcy") >= 0) company = "uber";
			else if (fileText.indexOf("Courier ID") >= 0) company = "wolt";
			else if (fileText.indexOf("Accounts_IBAN") >= 0) company = "ibans";
			else company = "test";

			// Writing read data from all files for each company to a global variable
			if (company != "test") {
				let currentData = localStorage.getItem(company);
				localStorage.setItem(company, currentData + fileText);
			}

			readFile(index + 1);
		}

		// FileReader initialization
		reader.readAsText(file);
	}

	if (files.length) {
		button.removeAttribute("disabled");
		readFile(0);
    } else {
		button.setAttribute("disabled", "");
		return;
    }
}

//---------------------------------------------------------
// Calculation of earnings, cash and tax for all
// companies
//---------------------------------------------------------
function earningsCalculation(doliData) {
	let uberRecords = [], boltRecords = [], freeRecords = [];
	let uberEatsRecords = [], woltRecords = [], ibanRecords = [];
	let useIbans = 0;
	let vat = 8; // VAT == 8%
	let vat23 = 23; // VAT == 23%
	let eKasa = 10;
	let commission1 = 36, commission2 = 50, commission3 = 60;
	let commissionWolt = 50, commissionEats = 35;

	// initializing variables with data from localStorage
	let uberText = localStorage.getItem("uber");
	let boltText = localStorage.getItem("bolt");
	let freeText = localStorage.getItem("free");
	let freeBonusesText = localStorage.getItem("freeBonuses");
	let uberEatsText = localStorage.getItem("uberEats");
	let woltText = localStorage.getItem("wolt");
	let ibans = localStorage.getItem("ibans");

	if (uberText.length > 0) uberRecords = parseUberData(uberText, doliData);
	if (boltText.length > 0) boltRecords = parseBoltData(boltText, doliData);
	if (freeText.length > 0) freeRecords = parseFreeData(freeText, freeBonusesText, doliData);
	if (uberEatsText.length > 0) uberEatsRecords = parseUberEatsData(uberEatsText, doliData);
	if (woltText.length > 0) woltRecords = parseWoltData(woltText, doliData);
	if (ibans.length > 0) ibanRecords = parseIbanData(ibans);
	if (ibanRecords.length > 0 || doliData.length > 0) useIbans = 1;

	// Combining records for all Uber, Bolt and Free companies into one array
	let taxiRecords = [...uberRecords, ...boltRecords, ...freeRecords];

	// Combining records for all UberEats and Wolt companies into one array
	let courierRecords = [...uberEatsRecords, ...woltRecords];

	// Calculation of earnings for all unique drivers for all taxi companies
	let resultTaxiData = taxiRecords.reduce((result, {key, name, money, cash}) => {
		let userData, amount = 0, amountCash = 0, tax = 0, amountSum = 0, amountCashSum = 0, amountTaxSum = 0;
		let amountTips = 0, amountTolls = 0, grossValue = 0, oplataBolt = 0, cancelFees = 0, tips = 0, returns = 0, balance = 0;
		let prowizja = 0, bonuses = 0, cashDiscounts = 0, commission = 0, amountTotal = 0, deduction = 0, iban = "";

		result[key] = {key, name, 
			moneyUber: 0, cashUber: 0, taxUber: 0, 
			moneyBolt: 0, cashBolt: 0, taxBolt: 0, 
			moneyFree: 0, cashFree: 0, taxFree: 0, 
			moneySum: 0, cashSum: 0, taxSum: 0, 
			commission: 0, zus: 0, debt: 0, inv: 0, rent: 0, payout: 0, 
			iban: "**************************"};

		// Getting an Uber entry with the current driver's details
		userData = uberRecords.filter(record => record.key === key).map(item => {return [item.money, item.cash];});
		// Uber earning amount
		amount = (userData.length > 0) ? userData.at(0)[0] : 0;
		// Uber Cash Amount
		amountCash = (userData.length > 0) ? userData.at(0)[1] : 0;
		// VAT amount
		if ((Math.abs(amount) - amountCash) <= 0) tax = amountCash * (vat / 100);
		else tax = amount * (vat / 100);
		// Calculating the commission amount
		commission = (tax > 0) ? commission = commission1 : 0;
		// Total net earnings for all companies
		amountSum += amount - tax - amountCash;
		// Total cash balance across all companies
		amountCashSum += amountCash;
		// Total tax for all companies
		amountTaxSum += tax;
		// Writing Uber Data to an array
		result[key].moneyUber = parseFloat(amount.toFixed(2));
		result[key].cashUber = parseFloat(amountCash);
		result[key].taxUber = parseFloat(tax.toFixed(2));

		// Getting a Bolt Record with Current Driver Data
		userData = boltRecords.filter(record => record.key === key).map(item => {
			return [item.money, item.cash, item.oplataBolt, item.cancelFees, item.tips, item.bonuses, item.cashDiscounts, item.returns, item.balance];});
		// Bolt Gross Earning Amount
		grossValue = (userData.length > 0) ? userData.at(0)[0] : 0; //D
		// Bolt cash amount
		amountCash = (userData.length > 0) ? userData.at(0)[1] : 0; //J
		// Bolt deduction amount
		oplataBolt = (userData.length > 0) ? userData.at(0)[2] : 0; //I
		// Bolt cancellation fee amount
		cancelFees = (userData.length > 0) ? userData.at(0)[3] : 0; //E
		// Bolt tip amount
		tips = (userData.length > 0) ? userData.at(0)[4] : 0; //O
		// Bolt bonus amount
		bonuses = (userData.length > 0) ? userData.at(0)[5] : 0; //L
		// Bolt discount amount
		cashDiscounts = (userData.length > 0) ? userData.at(0)[6] : 0; //K
		// Bolt amount of refunds
		returns = (userData.length > 0) ? userData.at(0)[7] : 0; //N
		// Bolt weekly balance
		amount = (userData.length > 0) ? userData.at(0)[8] : 0; //P
		// VAT amount
		if (amount < 0) tax = amountCash * (vat / 100);
		else tax = (amount + amountCash) * (vat / 100);
		// Calculating the commission amount
		if (tax > 0 && commission === commission1) commission = commission2;
		else if (tax > 0 && commission === 0) commission = commission1;
		// Total net earnings for all companies
		amountSum += amount - tax;
		// Total cash balance across all companies
		amountCashSum += amountCash;
		// Total tax for all companies
		amountTaxSum += tax;
		// Writing Bolt Data to an array
		result[key].moneyBolt = parseFloat(amount.toFixed(2));
		result[key].cashBolt = parseFloat(amountCash);
		result[key].taxBolt = parseFloat(tax.toFixed(2));

		// Getting a FreeNow entry with current driver data
		userData = freeRecords.filter(record => record.key === key).map(item => {return [item.money, item.cash, item.tips, item.tolls, item.bonuses];});
		// Free earnings amount
		amount = (userData.length > 0) ? userData.at(0)[0] : 0;
		// Free cash amount
		amountCash = (userData.length > 0) ? userData.at(0)[1] : 0;
		// Free tip amount
		amountTips = (userData.length > 0) ? userData.at(0)[2] : 0;
		// The amount of toll charges for Free
		amountTolls = (userData.length > 0) ? userData.at(0)[3] : 0;
		// Free bonus amount
		bonuses = (userData.length > 0) ? userData.at(0)[4] : 0;
		// Intermediate values
		prowizja = (Math.abs(amount) + amountCash) * 0.2 * 1.23;
		amount = Math.abs(amount) + amountCash + amountTips + amountTolls;
		// VAT amount
		tax = Math.abs(amount) * (vat / (100 + vat));
		// VAT2 amount (23%)
		let tax3 = Math.abs(bonuses) * (vat23 / (vat23 + 100));
		// Calculating the commission amount
		if (tax > 0 && commission === commission2) commission = commission3 + eKasa;
		else if (tax > 0 && commission === commission1) commission = commission2 + eKasa;
		else if (tax > 0 && commission === 0) commission = commission1 + eKasa;
		else if (amount === 0 && bonuses !== 0) commission = commission1 + eKasa;
		// Total net earnings for all companies
		amountSum += amount + bonuses - amountCash - prowizja - tax - tax3;
		// Total cash balance across all companies
		amountCashSum += amountCash;
		// Total tax for all companies
		amountTaxSum += tax + tax3;
		// Writing FreeNow Data to an array
		result[key].moneyFree = parseFloat(amount.toFixed(2));
		result[key].cashFree = parseFloat(amountCash.toFixed(2));
		result[key].taxFree = parseFloat(tax.toFixed(2));

		// Recording driver results for all companies in an array
		result[key].moneySum = parseFloat(amountSum.toFixed(2));
		result[key].cashSum = parseFloat(amountCashSum.toFixed(2));
		result[key].taxSum = parseFloat(amountTaxSum.toFixed(2));

		// Obtaining and recording bank data and debts of the driver
		if (ibans.length > 0) {
			ibanRecords.filter(record => record.at(1) === name).map(item => {
				result[key].iban = item.at(2);
				//result[key].deduction = item.at(3) + item.at(4) + item.at(5);
			});
		} else {
			doliData.filter(record => record.key === key).map(item => {
				result[key].iban = item.iban;
			});
		}

		// Writing summary results for a driver to an array
		result[key].commission = commission;
		result[key].payout = parseFloat((amountSum - commission).toFixed(2));

		return result;
	}, {});

	// Calculation of earnings for all unique couriers for all delivery companies
	let resultCourierData = courierRecords.reduce((result, {key, name, money, tips}) => {
		let userData, amount = 0, tax = 0, amountSum = 0, amountTaxSum = 0, amountTips = 0, commission = 0;

		result[key] = {key, name, moneyUber: 0, taxUber: 0, moneyWolt: 0, tipsWolt: 0, taxWolt: 0, moneySum: 0, taxSum: 0, 
			commission: 0, zus: 0, debt: 0, inv: 0, rent: 0, payout: 0, iban: "**************************"};

		// Getting an UberEats entry with the current courier details
		userData = uberEatsRecords.filter(record => record.key === key).map(item => {return [item.money];});
		// UberEats earning amount
		amount = (userData.length > 0) ? userData.at(0)[0] : 0;
		// VAT amount
		tax = Math.abs(amount) * (vat23 / (vat23 + 100));
		// Calculating the commission amount
		commission = (tax > 0) ? commission = commissionEats : 0;
		// Total net earnings for all companies
		amountSum += amount - tax;
		// Total tax for all companies
		amountTaxSum += tax;
		// Writing UberEats data to an array
		result[key].moneyUber = parseFloat(amount.toFixed(2));
		result[key].taxUber = parseFloat(tax.toFixed(2));

		// Получение записи Wolt с данными текущего курьера
		userData = woltRecords.filter(record => record.key === key).map(item => {return [item.money, item.tips];});
		// Wolt earning amount
		amount = (userData.length > 0) ? userData.at(0)[0] : 0;
		// Wolt Tipping amount
		amountTips = (userData.length > 0) ? userData.at(0)[1] : 0;
		// VAT amount
		tax = amountTips * (vat23 / (vat23 + 100));
		// Calculating the commission amount
		commission += ((amount + amountTips) > 0) ? commission = commissionWolt : 0;
		// Total net earnings for all companies
		amountSum += amount + amountTips;
		// Total tax for all companies
		amountTaxSum += tax;
		// Writing Wolt data to an array
		result[key].moneyWolt = parseFloat(amount.toFixed(2));
		result[key].tipsWolt = parseFloat(amountTips.toFixed(2));
		result[key].taxWolt = parseFloat(tax.toFixed(2));

		// Запись результатов курьера по всем компаниям в массив
		result[key].moneySum = parseFloat(amountSum.toFixed(2));
		result[key].taxSum = parseFloat(amountTaxSum.toFixed(2));

		// Obtaining and recording bank data and courier debts
		if (ibans.length > 0) {
			ibanRecords.filter(record => record.at(1) === name).map(item => {
				result[key].iban = item.at(2);
				//result[key].deduction = item.at(3) + item.at(4) + item.at(5);
			});
		} else {
			doliData.filter(record => record.key === key).map(item => {
				result[key].iban = item.iban;
			});
		}

		// Writing summary results by courier to an array
		result[key].commission = commission;
		result[key].payout = parseFloat((amountSum - commission).toFixed(2));

		return result;
	}, {});

	document.getElementById("krakenNoData").className = "";

	// Rendering content with data
	if (Object.keys(resultCourierData).length > 0)
		drawTable(resultCourierData, useIbans, 0);
	else if (Object.keys(resultTaxiData).length > 0)
		drawTable(resultTaxiData, useIbans, 1);
	else displayMessage("В файлах нет данных по водителям или курьерам", 1);
}

//---------------------------------------------------------
// Converting CSV to array
//---------------------------------------------------------
function csvToArray(csv, omitFirstRow = false, delimiter = ",") {
//	console.log(csv.indexOf('\n'));

	// Replacing commas in quotes with dots
	csv = csv.replace(/"[^"]*"/g, function(v) {return v.replace(/,/g, ".");});

	// Removing double quotes
	csv = csv.split("\"").join("");

	return csv.slice(omitFirstRow ? csv.indexOf("\n") + 1 : 0)
		.split(/\r?\n/g) //UNIX-DOS EOL
		.map(element => element.split(delimiter));
}

//---------------------------------------------------------
// Parsing UBER taxi data from CSV
//---------------------------------------------------------
function parseUberData(csv, doliData) {
	let records = csvToArray(csv).filter(element => element.join("") != "");
	let columnNames = records[0].map(String);
	let keyColumn = columnNames.indexOf(uberUuidColumnName);
	let nameColumn = columnNames.indexOf(uberDriverNameColumnName);
	let surnameColumn = columnNames.indexOf(uberDriverSurnameColumnName);
	let sumColumn = columnNames.indexOf(uberSumColumnName);
	let cashColumn = columnNames.indexOf(uberCashColumnName);

	if (sumColumn < 0) sumColumn = columnNames.indexOf("Paid to you : Your earnings");
	if (cashColumn < 0) cashColumn = columnNames.indexOf("Paid to you : Trip balance : Payouts : Cash Collected");

	records = records.slice(1);

	let keys = records.map(element => element[keyColumn]);
	let names = records.map(element => formatName(element[nameColumn] + " " + element[surnameColumn]));
	let surnames = records.map(element => element[surnameColumn]);
	let sums = records.map(element => element[sumColumn]).map(Number);
	let cash = records.map(element => Math.abs(element[cashColumn])).map(Number);

	let uberFullData = [...new Array(keys.length)].map((element, index) => {return [keys[index], names[index], sums[index], cash[index]];});
	uberFullData = uberFullData.filter(element => element[1] !== filterMykhailoHolovash);
	uberFullData = uberFullData.filter(element => element[1] !== formatName(uberDriverNameColumnName + " " + uberDriverSurnameColumnName)); //"Imię Kierowcy Nazwisko Kierowcy"
	//uberFullData = uberFullData.filter(element => element[1].indexOf("Imię kierowcy") < 0);

	let uberData = uberFullData.reduce((result, [uberKey, uberName, money, cash]) => {
		let userData, key, name;
		if (doliData.length > 0) {
			userData = doliData.filter(record => record.uberId === uberKey).map(item => {return [item.key, item.name];});
			key = (userData.length > 0) ? userData.at(0)[0] : uberName;
			name = (userData.length > 0) ? userData.at(0)[1] : uberName;
		} else {
			key = uberName;
			name = uberName;
		}

		result[uberKey] ??= {key, name, money: 0, cash: 0};

		(result[uberKey]).money += money;
		(result[uberKey]).cash += cash;

		return result;
	}, {});

	return Object.values(uberData);
}

//---------------------------------------------------------
// Parsing BOLT taxi data from CSV
//---------------------------------------------------------
function parseBoltData(csv, doliData) {
	let records = csvToArray(csv).filter(element => element.join("") != "");
	let columnNames = records[0].map(String);
	let keyColumn = columnNames.indexOf(boltPhoneColumnName); //B
	let namesColumn = columnNames.indexOf(boltDriverNamesColumnName); //A
	let sumColumn = columnNames.indexOf(boltSumColumnName); //D
	let cashColumn = columnNames.indexOf(boltCashColumnName); //J
	let oplataBoltColumn = columnNames.indexOf(boltOplataColumnName); //I
	let cancelFeeColumn = columnNames.indexOf(boltCancelFeeColumnName); //E
	let bonusColumn = columnNames.indexOf(boltBonusColumnName); //L
	let returnsColumn = columnNames.indexOf(boltReturnsColumnName); //N
	let tipColumn = columnNames.indexOf(boltTipsColumnName); //O
	let cashDiscountColumn = columnNames.indexOf(boltDiscountColumnName); //K
	let balanceColumn = columnNames.indexOf(boltBalanceColumnName); //P

	records = records.slice(1);

	let keys = records.map(element => element[keyColumn]);
	let names = records.map(element => formatName(element[namesColumn]));
	let sums = records.map(element => element[sumColumn]).map(Number);
	let cash = records.map(element => Math.abs(element[cashColumn])).map(Number);
	let oplataBolt = records.map(element => Math.abs(element[oplataBoltColumn])).map(Number);
	let cancelFees = records.map(element => Math.abs(element[cancelFeeColumn])).map(Number);
	let bonuses = records.map(element => Math.abs(element[bonusColumn])).map(Number);
	let returns = records.map(element => Math.abs(element[returnsColumn])).map(Number);
	let tips = records.map(element => Math.abs(element[tipColumn])).map(Number);
	let cashDiscounts = records.map(element => Math.abs(element[cashDiscountColumn])).map(Number);
	let balance = records.map(element => element[balanceColumn]).map(Number);

	let boltFullData = [...new Array(keys.length)].map((element, index) => {
		return [keys[index], names[index], sums[index], cash[index], oplataBolt[index], cancelFees[index], 
			tips[index], bonuses[index], cashDiscounts[index], returns[index], balance[index]];});
	boltFullData = boltFullData.filter(element => element[1] !== filterMykhailoHolovash);
	boltFullData = boltFullData.filter(element => element[1] !== filterWszyscyKierowcy);
	boltFullData = boltFullData.filter(element => element[1] !== boltDriverNamesColumnName);

	let boltData = boltFullData.reduce((result, [boltKey, boltName, money, cash, oplataBolt, cancelFees, tips, bonuses, cashDiscounts, returns, balance]) => {
		let userData, key, name;
		if (doliData.length > 0) {
			userData = doliData.filter(record => record.boltId === boltKey).map(item => {return [item.key, item.name];});
			key = (userData.length > 0) ? userData.at(0)[0] : boltName;
			name = (userData.length > 0) ? userData.at(0)[1] : boltName;
		} else {
			key = boltName;
			name = boltName;
		}

		result[boltKey] ??= {key, name, money: 0, cash: 0, oplataBolt: 0, cancelFees: 0, tips: 0, bonuses: 0, cashDiscounts: 0, returns: 0, balance: 0};

		(result[boltKey]).money += money;
		(result[boltKey]).cash += cash;
		(result[boltKey]).oplataBolt += oplataBolt;
		(result[boltKey]).cancelFees += cancelFees;
		(result[boltKey]).tips += tips;
		(result[boltKey]).bonuses += bonuses;
		(result[boltKey]).cashDiscounts += cashDiscounts;
		(result[boltKey]).returns += returns;
		(result[boltKey]).balance += balance;

		return result;
	}, {});

	return Object.values(boltData);
}

//---------------------------------------------------------
// Parsing FREENOW taxi data from CSV
//---------------------------------------------------------
function parseFreeData(csv, csv2, doliData) {
	let records = csvToArray(csv).filter(element => element.join("") != "");
	let columnNames = records[0].map(String);
	let nameColumn = columnNames.indexOf(freeDriverNameColumnName);
	let surnameColumn = columnNames.indexOf(freeDriverSurnameColumnName);
	let keyColumn = columnNames.indexOf(freeIdColumnName);
	let amountsColumn = columnNames.indexOf(freeAmountColumnName);
	let tipsColumn = columnNames.indexOf(freeTipsColumnName);
	let paymentTypeColumn = columnNames.indexOf(freePaymentTypeColumnName);
	let tollColumn = columnNames.indexOf(freeTollColumnName);

	records = records.slice(1);

	let names = records.map(element => formatName(element[nameColumn] + " " + element[surnameColumn]));
	let keys = records.map(element => element[keyColumn]);
	let amounts = records.map(element => element[amountsColumn]).map(Number);
	let tips = records.map(element => element[tipsColumn]).map(Number);
	let payments = records.map(element => element[paymentTypeColumn]);
	let tolls = records.map(element => element[tollColumn]).map(Number);

	let freeFullData = [...new Array(names.length)].map((element, index) => {
		return [keys[index], names[index], payments[index], amounts[index], tips[index], tolls[index]];});
	freeFullData = freeFullData.filter(element => element[1] !== formatName(freeDriverNameColumnName + " " + freeDriverSurnameColumnName));// "Driver First Name Driver Last Name"

	let freeData = freeFullData.reduce((result, [freeKey, freeName, payment, amount, tip, toll]) => {
		let userData, key, name;
		if (doliData.length > 0) {
			userData = doliData.filter(record => record.freeId === freeKey).map(item => {return [item.key, item.name];});
			key = (userData.length > 0) ? userData.at(0)[0] : freeName;
			name = (userData.length > 0) ? userData.at(0)[1] : freeName;
		} else {
			key = freeName;
			name = freeName;
		}

		result[freeKey] ??= {key, name, freeKey, money: 0, cash: 0, tips: 0, tolls: 0, bonuses: 0};

		if (payment === "APP")
			(result[freeKey]).money += amount;
		else if (payment === "CASH")
			(result[freeKey]).cash += amount;

		(result[freeKey]).tips += tip;
		(result[freeKey]).tolls += toll;

		return result;
	}, {});

	//Free taxi bonuses
	if (csv2.length > 0) {
		let records2 = csvToArray(csv2).filter(element => element.join("") != "");
		let columnNames2 = records2[0].map(String);
		let key2Column = columnNames2.indexOf(freeBonusesIdColumnName);
		let bonusColumn = columnNames2.indexOf(freeBonusesValueColumnName);
		let bonusNameColumn = columnNames2.indexOf(freeBonusesNameColumnName);
		records2 = records2.slice(1);
		let keys2 = records2.map(element => element[key2Column]);
		let bonuses = records2.map(element => element[bonusColumn]).map(Number);
		let bonusNames = records2.map(element => element[bonusNameColumn]);

		let freeBonusesFullData = [...new Array(keys2.length)].map((element, index) => {return [keys2[index], bonuses[index], bonusNames[index]];});
		freeBonusesFullData = freeBonusesFullData.filter(element => element[0] !== freeBonusesIdColumnName);
		freeBonusesFullData = freeBonusesFullData.filter(element => element[2].indexOf("Opłata ekasa") < 0);
		freeBonusesFullData = freeBonusesFullData.filter(element => element[2].indexOf("Oplata ekasa") < 0);
		freeBonusesFullData = freeBonusesFullData.filter(element => element[2].indexOf(filterEkasa) < 0);

		let freeBonusesData = Object.values(freeBonusesFullData.reduce((result, [key2, bonus, bonusName]) => {
			result[key2] ??= {key2, bonus: 0};
			(result[key2]).bonus += bonus;
			return result;
		}, {}));
		freeBonusesData = freeBonusesData.filter(element => element.key2 !== filterPartner);

		if (freeBonusesData.length > 0) {
			freeBonusesData.forEach(element => {
				let index = Object.values(freeData).findIndex(
					object => object.freeKey === element.key2);
				if (index >= 0)
					(freeData[element.key2]).bonuses = element.bonus;
				else
					freeData[element.key2] = {key: element.key2, name: element.key2, freeKey: element.key2, money: 0, cash: 0, tips: 0, tolls: 0, bonuses: element.bonus};
			});
		}
	}

	return Object.values(freeData);
}

//---------------------------------------------------------
// Parsing WOLT taxi data from CSV
//---------------------------------------------------------
function parseWoltData(csv, doliData) {
	let records = csvToArray(csv).filter(element => element.join("") != "");
	let columnNames = records[0].map(String);
	let keyColumn = columnNames.indexOf(woltIdColumnName);
	let namesColumn = columnNames.indexOf(woltUserNameColumnName);
	let amountsColumn = columnNames.indexOf(woltAmountColumnName);
	let itemsColumn = columnNames.indexOf(woltItemColumnName);

	records = records.slice(1);

	let names = records.map(element => formatName(element[namesColumn]));
	let keys = records.map(element => element[keyColumn]);
	let items = records.map(element => Math.abs(element[itemsColumn])).map(Number);
	let amounts = records.map(element => Math.abs(element[amountsColumn])).map(Number);

	let woltFullData = [...new Array(names.length)].map((element, index) => {
		return [keys[index], names[index], items[index], amounts[index]];});
	woltFullData = woltFullData.filter(element => element[0] !== woltIdColumnName);

	let woltData = woltFullData.reduce((result, [woltKey, woltName, item, amount]) => {
		let userData, key, name;
		if (doliData.length > 0) {
			userData = doliData.filter(record => record.woltId === woltKey).map(item => {return [item.key, item.name];});
			key = (userData.length > 0) ? userData.at(0)[0] : woltName;
			name = (userData.length > 0) ? userData.at(0)[1] : woltName;
		} else {
			key = woltName;
			name = woltName;
		}

		result[woltKey] ??= {key, name, money: 0, tips: 0};

		if (item === 186)
			(result[woltKey]).money += amount;
		else if (item === 415)
			(result[woltKey]).tips += amount;

		return result;
	}, {});

	return Object.values(woltData);
}

//---------------------------------------------------------
// Parsing UBEREats taxi data from CSV
//---------------------------------------------------------
function parseUberEatsData(csv, doliData) {
	let records = csvToArray(csv).filter(element => element.join("") != "");
	let columnNames = records[0].map(String);
	let keyColumn = columnNames.indexOf(uberEatsUuidColumnName);
	let nameColumn = columnNames.indexOf(uberEatsUserNameColumnName);
	let surnameColumn = columnNames.indexOf(uberEatsUserSurnameColumnName);
	let sumColumn = columnNames.indexOf(uberEatsSumColumnName);

	if (sumColumn < 0) sumColumn = columnNames.indexOf("Paid to you : Your earnings");

	records = records.slice(1);

	let keys = records.map(element => element[keyColumn]);
	let names = records.map(element => formatName(element[nameColumn] + " " + element[surnameColumn]));
	let sums = records.map(element => element[sumColumn]).map(Number);

	let uberEatsFullData = [...new Array(keys.length)].map((element, index) => {return [keys[index], names[index], sums[index]];});
	uberEatsFullData = uberEatsFullData.filter(element => element[1] !== filterMykhailoHolovash);
	uberEatsFullData = uberEatsFullData.filter(element => element[1] !== filterHolovashMykhailo);
	uberEatsFullData = uberEatsFullData.filter(element => element[1] !== formatName(uberEatsUserNameColumnName + " " + uberEatsUserSurnameColumnName)); //"Imię Kierowcy Nazwisko Kierowcy"
	//uberEatsFullData = uberEatsFullData.filter(element => element[1].indexOf("Imię kierowcy") < 0);

	let uberEatsData = uberEatsFullData.reduce((result, [uberKey, uberName, money]) => {
		let userData, key, name;
		if (doliData.length > 0) {
			userData = doliData.filter(record => record.uberId === uberKey).map(item => {return [item.key, item.name];});
			key = (userData.length > 0) ? userData.at(0)[0] : uberName;
			name = (userData.length > 0) ? userData.at(0)[1] : uberName;
		} else {
			key = uberName;
			name = uberName;
		}

		result[uberKey] ??= {key, name, money: 0};
		(result[uberKey]).money += money;

		return result;
	}, {});

	return Object.values(uberEatsData);
}

//---------------------------------------------------------
// Parsing IBAN database data from CSV
//---------------------------------------------------------
function parseIbanData(csv) {
	let records = csvToArray(csv).filter(element => element.join("") != "");
	let columnNames = records[0].map(String);
	let keyColumn = columnNames.indexOf("Mobile");
	let nameColumn = columnNames.indexOf("Firstname");
	let surnameColumn = columnNames.indexOf("Lastname");
	let ibanColumn = columnNames.indexOf("Accounts_IBAN");
/*
	let zusColumn = columnNames.indexOf("ZUS");
	let debtColumn = columnNames.indexOf("Debt");
	let invColumn = columnNames.indexOf("Invoice");
	let zus = records.map(element => element[zusColumn]).map(Number);
	let debt = records.map(element => element[debtColumn]).map(Number);
	let invoices = records.map(element => element[invColumn]).map(Number);
*/
	records = records.slice(1);

	let keys = records.map(element => element[keyColumn]);
	let names = records.map(element => formatName(element[nameColumn] + " " + element[surnameColumn]));
	let ibans = records.map(element => element[ibanColumn]);

	let ibanFullData = [...new Array(keys.length)].map((element, index) => {
		return [keys[index], names[index], ibans[index]];
	});

	return ibanFullData;
}
