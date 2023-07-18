<?php
    $title = _( "Home Page" );
?>

<h1><?= _( "Welcome" ) ?></h1>

<?php if ( $messages > 0 ): ?>
    <p><?php echo _n( "You have one new message.", "You have {0} new messages.", $messages, $messages ); ?></p>
<?php endif ?>
