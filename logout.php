<?php
session_start();
sesson_unset();
session_destroy();
header("Location: index.php");
?>