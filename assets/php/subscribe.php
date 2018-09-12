<?php

  define('API_KEY', 'd9116b8eee1cba976f008beef8ff20cf-us16');
  define('LIST_ID', '7aa10df196');

  require_once('MailChimp.php');

  $email = isset($_POST['email']) ? $_POST['email'] : '';

  $MailChimp = new Mailchimp(API_KEY);

  $result = $MailChimp->call('lists/subscribe', array(
      'id'     => LIST_ID,
      'email'  => array( 'email' => $email ),
      'double_optin' => false,
      'update_existing' => true,
      'replace_interests' => false,
      'send_welcome' => false
  ));

  echo json_encode($result);

?>