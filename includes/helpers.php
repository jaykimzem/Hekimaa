<?php

function generateBibNumber($race_category, $gender, $pdo) {
    $prefix = '';
    $gender = strtolower($gender);
    
    if ($race_category == '21k') {
        $prefix = ($gender == 'female') ? '12' : '11';
    } elseif ($race_category == '10k') {
        $prefix = ($gender == 'female') ? '22' : '21';
    } elseif ($race_category == 'corporate') {
        $prefix = ($gender == 'female') ? '32' : '31';
    } elseif ($race_category == 'community') {
        $prefix = ($gender == 'female') ? '42' : '41';
    } else {
        $prefix = '50';
    }

    // Find the next available number in that range
    // E.g. for 21k Male, range is 11000 to 11999
    $start = (int)($prefix . '000');
    $end = (int)($prefix . '999');

    $stmt = $pdo->prepare("SELECT MAX(CAST(bib_number AS UNSIGNED)) FROM registrations WHERE bib_number BETWEEN ? AND ?");
    $stmt->execute([$start, $end]);
    $max = $stmt->fetchColumn();

    if (!$max) {
        return $start + 1;
    } else {
        return $max + 1;
    }
}
?>
