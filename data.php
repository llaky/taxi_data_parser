<?php

/**
 * @author Denis Romaniko
 **/

$servername = "localhost";
$username = "";
$password = "";
$database = "";
$sql = "SELECT * FROM db_salary";
$fkUserAuthor = 4;
$sqlSalary = "";
$sqlPayment = "";
$sqlBankEntry = "";

// Get JSON data from POST request
$dataArray = json_decode($_POST['dataArray']);
$isTaxi = $_POST['isTaxi'];

// Create connection
$conn = new mysqli($servername, $username, $password, $database);
$conn->query("SET NAMES utf8");

// Check connection
if ($conn->connect_error) {
	die("Connection failed: ".$conn->connect_error);
}

if (is_array($dataArray)) {
	foreach($dataArray as $userData) {
		foreach($userData as $user) {
			$fk_user = $user->key;
			$amount = $user->payout;
			$dateep = $user->dateep;
			$datesp = date('Y-m-d', strtotime('-1 week', strtotime($dateep)));
			$note = "";

			if ($isTaxi === '1') {
				$note = "Сумма: ".$user->moneySum."<br>Наличные: ".$user->cashSum."<br>Налог: ".$user->taxSum."<br>Комиссия: ".$user->commission;
				$surcharge = floatval($user->zus) + floatval($user->debt) + floatval($user->inv) + floatval($user->rent);
				$zus = abs(floatval($user->zus));
				$debt = floatval($user->debt);
				$inv = abs(floatval($user->inv));
				$rent = abs(floatval($user->rent));
				if ($zus > 0) {
					$note = $note."<br>ZUS: ".$zus;
				} 
				if ($debt != 0) {
					$note = $note."<br>Долг: ".$debt;
				} 
				if ($inv > 0) {
					$note = $note."<br>Фактуры: ".$inv;
				} 
				if ($rent > 0) {
					$note = $note."<br>Аренда: ".$rent;
				} 
				if ($surcharge < 0) {
					$note = $note."<br>Доплата: ".abs($surcharge);
				} 
			} else {
				$note = "Сумма: ".$user->moneySum."<br>Комиссия: ".$user->commission;
			}

			if (is_numeric($fk_user)) {
				//$fk_user = 487; //testuser
				$sqlSalary = "INSERT INTO db_salary (tms, datec, label, fk_user, amount, fk_projet, datesp, dateep, note, paye, fk_typepayment, fk_account, fk_user_author) VALUES ";
				$sqlSalary = $sqlSalary."(now(), now(), 'Начислено', $fk_user, $amount, 0, '$datesp', '$dateep', '', 1, 2, 1, $fkUserAuthor)";

				$result = $conn->query($sqlSalary);

				if ($result === TRUE) {
					$salaryId = $conn->insert_id;
					$sqlBankEntry = "INSERT INTO db_bank(datec, tms, datev, dateo, amount, label, fk_account, fk_user_author, fk_type) VALUES ";
					$sqlBankEntry = $sqlBankEntry."(now(), now(), '$dateep', '$dateep', -$amount, '(SalaryPayment)', 1, $fkUserAuthor, 'VIR')";

					$result = $conn->query($sqlBankEntry);

					if ($result === TRUE) {
						$bankEntryId = $conn->insert_id;
						$sqlPayment = "INSERT INTO db_payment_salary (tms, datec, datep, amount, fk_typepayment, note, fk_bank, fk_user_author, fk_salary) VALUES ";
						$sqlPayment = $sqlPayment."(now(), now(), '$dateep', $amount, 2, '$note', $bankEntryId, $fkUserAuthor, $salaryId)";

						if ($salaryId > 0 && $bankEntryId > 0) {
							$conn->query($sqlPayment);
							$paymentId = $conn->insert_id;
						}
					}
				}
			}
		}
	}
}

$conn->close();

?>

