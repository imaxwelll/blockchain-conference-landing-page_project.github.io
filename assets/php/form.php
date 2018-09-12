<?php

  define('ADMIN', 'imaxvelll@gmail.com');
  define('COMPANY', 'blockchain-course');
  define('DEFAULT_SUBJECT', 'E-mail Blockchain-course');
  
  include 'mailsend.php';

  $url = 'http://'.$_SERVER['SERVER_NAME'];

  $name = isset($_POST['name']) ? $_POST['name'] : null;
  $phone = isset($_POST['phone']) ? $_POST['phone'] : null;
  $email = isset($_POST['email']) ? $_POST['email'] : null;
  $company = isset($_POST['company']) ? $_POST['company'] : null;
  $msg = isset($_POST['msg']) ? $_POST['msg'] : null;

  $ticket = isset($_POST['ticket']) ? $_POST['ticket'] : null;
  $ticketValidity = isset($_POST['validity']) ? $_POST['validity'] : null;
  $subject = isset($_POST['subject']) ? $_POST['subject'] : DEFAULT_SUBJECT;

  $messageHtml = '
      <html> 
          <head><title>'.$subject.'</title></head>
      <body>
          <h1>'.$subject.'</h1>';

          // Text before data table
          $messageHtml .= '';

          // Order table html
          $messageHtml .= '<br /><table>';

          if(isset($name) && $name !== null) { $messageHtml .= '<tr><td width="300">Name: </td><td>'.$name.'</td></tr>'; }
          if(isset($company) && $company !== null) { $messageHtml .= '<tr><td width="300">Company: </td><td>'.$company.'</td></tr>'; }
          if(isset($phone) && $phone !== null) { $messageHtml .= '<tr><td width="300">Phone: </td><td>'.$phone.'</td></tr>'; }
          if(isset($email) && $email !== null) { $messageHtml .= '<tr><td width="300">E-mail: </td><td>'.$email.'</td></tr>'; }
          if(isset($msg) && $msg !== null) { $messageHtml .= '<tr><td width="300">Message: </td><td>'.$msg.'</td></tr>'; }
          if(isset($ticket) && $ticket !== null) { $messageHtml .= '<tr><td width="300">Ticket: </td><td>'.$ticket.'</td></tr>'; }
          if(isset($ticketValidity) && $ticketValidity !== null) { $messageHtml .= '<tr><td width="300">Ticket validity: </td><td>'.$ticketValidity.'</td></tr>'; }
          $messageHtml .= '<tr><td width="300">Date:</td><td>'.date('d.m.Y H:i').'</td></tr>';

          $messageHtml .= '</table><br />';
          // End order table html

          // Text after data table
          $messageHtml .= '';

          $messageHtml .= '</body></html>';

  $emailAddr = ADMIN;

  $mail = new Mail(ADMIN); // Create an instance of class
  $mail->setFromName(COMPANY); // Set up a name in the return address

  $response = Array(

    'fields' => $mail->send($emailAddr, $subject, $messageHtml),
    'captcha' => true,
    'hideForm' => true,

    'msg' => '
        <h3>Дякуємо!</h3>
        <p>Ваше повідомлення успішно відправлено.</p>
    '

  );

  if ($response['fields']) {

      // Success message

      $response['msg'] = '
          <h3>Дякуємо!</h3>
        <p>Ваше повідомлення успішно відправлено.</p>
      ';

  } else {

      // Error message

      $response['msg'] = '
        <h3>Упс</h3>
        <p>Лист не відправлено.</p>
      ';

  }

  echo json_encode($response);

?>