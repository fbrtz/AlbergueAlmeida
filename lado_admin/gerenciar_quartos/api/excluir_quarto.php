<?php
$con = new mysqli("localhost", "root", "", "albergue_almeida");

$id = $_POST["id"];

$con->query("DELETE FROM quartos WHERE id = $id");

echo "OK";
