<html lang="ru-RU">
<head>
	<style type="text\css">
		html {
			font-family: sans-serif;
			-webkit-locale: "ru-RU";
		}
	</style>
</head>
<body>
<style type="text/css">
    .buttons {display:-webkit-box;}
    .buttonK {background-color:#70bf44;color:white;font-size:15px;line-height:1.6;font-weight:700;border-style:solid;text-align:center;vertical-align:middle;cursor:pointer;border:0px;width:190px;height:50px;padding:6px 10px;margin:8px;}
    .buttonK:hover:enabled {opacity:0.75;}
    .buttonK:disabled {opacity:0.25;color:black;}
	.inputK {border:#999922 3px solid;color:black;font-family:sans-serif;font-size:16px;font-weight:700;text-align:center;vertical-align:middle;height:50px;width:140px;margin:8px;}
	.crm {background-color:#999922;}
    .santander {background-color:#ec0000;}
    .santander img {width:90px;margin:0px 0px 4px 0px;}
</style>
<script src="/erp/includes/jquery/js/jquery.min.js"></script>
<script type="text/javascript" src="/load_data.js"></script>
<div class="buttons">
    <input type="file" class="buttonK" onchange="loadDataFiles(event)" multiple="">
    <button class="buttonK" onclick="getDoliData()" id="krakenSalary" disabled="">Расчёт выплат</button>
    <button class="buttonK" onclick="" id="krakenExportCSV" disabled="">Экспорт в CSV</button>
    <button class="buttonK santander" onclick="userData2Santander();" id="krakenExport2Bank" disabled=""><img src="/santander_logo.svg" alt="Santander" loading="lazy"></button>
    <button class="buttonK" onclick="printData('krakenData');" id="krakenPrint" disabled="">Печать таблицы</button>
	<input type="date" class="inputK" id="krakenSalaryDate" value="">
	<button class="buttonK crm" onclick="saveSalaries()" name="krakenPostSalaries" id="krakenPostSalaries" disabled="">Экспорт в CRM</button>
</div>

<div id="krakenData">
    <style type="text/css">
        @media print{@page {size:A4 landscape;}}
        .krakenDataTable {color:black;border-collapse:collapse; width: 100%;}
        .krakenDataTable td {font-size:11pt;font-weight:normal;border:0.2px solid #70bf44;padding:2px 5px 2px 5px;font-family:ui-monospace;}
        .krakenHeader td, .krakenIndex {font-size:12pt;font-weight:bold !important;background-color:lightgray;cursor:pointer;text-align:center;padding:4px 6px 4px 6px;}
        .krakenDataTable td:hover {border: solid 0.9px darkgreen;}
        .krakenDataRow:hover {opacity:0.85;}
        .krakenNegative {color:red;font-weight:bold !important;}
		.krakenNoIban {color:mediumorchid;font-weight:normal !important;}
        .name {background-color:linen;text-align:left;}
        .moneyUber, .taxUber, .cashUber {background-color:lightcyan;text-align:right;}
        .moneyBolt, .taxBolt, .cashBolt {background-color:cornsilk;text-align:right;}
        .moneyWolt, .taxWolt, .tipsWolt {background-color:cornsilk;text-align:right;}
        .moneyFree, .taxFree, .cashFree {background-color:honeydew;text-align:right;}
        .moneySum, .taxSum, .cashSum {background-color:ivory;text-align:right;}
        .commission {background-color:lavender;text-align:right;}
        .zus, .debt, .inv, .rent {background-color:mistyrose;text-align:right;}
        .payout {background-color:beige;text-align:right;}
        .iban {background-color:floralwhite;text-align:center;padding:2px;}
        .showCell {display:table-cell !important;}
        .hideCell, .key {display:none !important;}
        #krakenNoData {border:solid 2px red;padding:10px 50px 10px 50px;margin:20px 0px;display:none;}
    </style>
	<table id="krakenTable"></table>
    <span id="krakenNoData"></span>
</div>

</body>
</html>

<!--
<style type="text/css">
    .buttons {display:-webkit-box;}
    .buttonK {background-color:#70bf44;color:white;font-size:15px;line-height:1.6;font-weight:700;border-style:solid;text-align:center;vertical-align:middle;cursor:pointer;border:0px;width:200px;height:40px;padding:4px 8px;margin:10px;}
    .buttonK:hover:enabled {opacity:0.75;}
    .buttonK:disabled {opacity:0.25;color:black;}
    .buttonLogout {float:right;margin-left:auto; display:none;}
</style>
<script>
    function addCss2Dolibarr() {
        let link = document.createElement('link');
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "/kraken_erp.css";
        document.getElementById('clientPanel').contentDocument.head.appendChild(link);
    }
</script>
<div class="buttons">
    <button id="krakenSalaries" class="buttonK" onclick="document.getElementById('clientPanel').src='/erp/salaries/list.php';">Moje wypłaty</button>
    <button id="krakenPersonalData" class="buttonK" onclick="document.getElementById('clientPanel').src=document.getElementById('clientPanel').contentDocument.getElementsByClassName('dropdown-toggle login-dropdown-a')[0].href;">Mój profil</button>
    <button id="krakenUserLogout" class="buttonK buttonLogout" onclick="document.getElementById('clientPanel').src='/erp/user/logout.php';">Wyloguj</button>
</div>
<iframe id="clientPanel" src="/erp/salaries/list.php" style="width: 100%;" onload="this.height = this.contentWindow.document.body.scrollHeight + 'px';addCss2Dolibarr();">
</iframe>
-->
