<?php

// CONFIG: Enable debug mode. This means we'll log requests into 'ipn.log' in the same directory.
// Especially useful if you encounter network errors or other intermittent problems with IPN (validation).

// Set this to 0 once you go live or don't require logging.
define("DEBUG", 1);

// Set to 0 once you're ready to go live
define("USE_SANDBOX", 1);

define("PAYPAL_EMAIL", "luzifiero-facilitator@gmail.com");
define("ADMIN", "luzifiero@gmail.com");
define("EVENT", "eVentual Conference");

define("LOG_FILE", "./ipn.log");

include 'mailsend.php';

// Read POST data
// reading posted data directly from $_POST causes serialization
// issues with array data in POST. Reading raw POST data from input stream instead.
$raw_post_data = file_get_contents('php://input');
$raw_post_array = explode('&', $raw_post_data);
$myPost = array();
foreach ($raw_post_array as $keyval) {
	$keyval = explode ('=', $keyval);
	if (count($keyval) == 2)
		$myPost[$keyval[0]] = urldecode($keyval[1]);
}
// read the post from PayPal system and add 'cmd'
$req = 'cmd=_notify-validate';
if(function_exists('get_magic_quotes_gpc')) {
	$get_magic_quotes_exists = true;
}
foreach ($myPost as $key => $value) {
	if($get_magic_quotes_exists == true && get_magic_quotes_gpc() == 1) {
		$value = urlencode(stripslashes($value));
	} else {
		$value = urlencode($value);
	}
	$req .= "&$key=$value";
}

// Post IPN data back to PayPal to validate the IPN data is genuine
// Without this step anyone can fake IPN data

if(USE_SANDBOX == true) {
	$paypal_url = "https://www.sandbox.paypal.com/cgi-bin/webscr";
} else {
	$paypal_url = "https://www.paypal.com/cgi-bin/webscr";
}

$ch = curl_init($paypal_url);
if ($ch == FALSE) {
	return FALSE;
}

curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $req);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);

if(DEBUG == true) {
	curl_setopt($ch, CURLOPT_HEADER, 1);
	curl_setopt($ch, CURLINFO_HEADER_OUT, 1);
}

// CONFIG: Optional proxy configuration
//curl_setopt($ch, CURLOPT_PROXY, $proxy);
//curl_setopt($ch, CURLOPT_HTTPPROXYTUNNEL, 1);

// Set TCP timeout to 30 seconds
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Connection: Close'));

// CONFIG: Please download 'cacert.pem' from "http://curl.haxx.se/docs/caextract.html" and set the directory path
// of the certificate as shown below. Ensure the file is readable by the webserver.
// This is mandatory for some environments.

//$cert = __DIR__ . "./cacert.pem";
//curl_setopt($ch, CURLOPT_CAINFO, $cert);

$res = curl_exec($ch);
if (curl_errno($ch) != 0) // cURL error
	{
	if(DEBUG == true) {	
		error_log(date('[Y-m-d H:i e] '). "Can't connect to PayPal to validate IPN message: " . curl_error($ch) . PHP_EOL, 3, LOG_FILE);
	}
	curl_close($ch);
	exit;

} else {
		// Log the entire HTTP response if debug is switched on.
		if(DEBUG == true) {
			error_log(date('[Y-m-d H:i e] '). "HTTP request of validation request:". curl_getinfo($ch, CURLINFO_HEADER_OUT) ." for IPN payload: $req" . PHP_EOL, 3, LOG_FILE);
			error_log(date('[Y-m-d H:i e] '). "HTTP response of validation request: $res" . PHP_EOL, 3, LOG_FILE);
		}
		curl_close($ch);
}

// Inspect IPN validation result and act accordingly

// Split response headers and payload, a better way for strcmp
$tokens = explode("\r\n\r\n", trim($res));
$res = trim(end($tokens));

if (strcmp ($res, "VERIFIED") == 0) {

	// assign posted variables to local variables
	//$item_name = $_POST['item_name'];
	//$item_number = $_POST['item_number'];
	//$payment_status = $_POST['payment_status'];
	//$payment_amount = $_POST['mc_gross'];
	//$payment_currency = $_POST['mc_currency'];
	//$txn_id = $_POST['txn_id'];
	//$receiver_email = $_POST['receiver_email'];
	//$payer_email = $_POST['payer_email'];
	
	if (DEBUG == true) {
		error_log(date('[Y-m-d H:i e] '). "Verified IPN: $req ". PHP_EOL, 3, LOG_FILE);
	}

    if ($_POST['receiver_email'] == PAYPAL_EMAIL) {

        // Send to customer
        notification(Array(
            'subject' => 'Your payment is completed',
            'before' => 'Congratulations! Your payment has been completed successfully! We will register you in our event.',
            'after' => '<p>Thank you for using our service. We are waiting for you again!</p>'
        ), $_POST['payer_email']);

        // Send to admin
        notification(Array(
            'subject' => 'Register new member',
            'before' => 'Register new member of .'.EVENT.'. Payment details:',
            'after' => ''
        ), ADMIN);

    }

}
else if (strcmp ($res, "INVALID") == 0) {

	// log for manual investigation
	// Add business logic here which deals with invalid IPN messages
	if (DEBUG == true) {
		error_log(date('[Y-m-d H:i e] '). "Invalid IPN: $req" . PHP_EOL, 3, LOG_FILE);
	}

    // Error
    notification(Array(
        'subject' => 'Payment Failure!',
        'before' => 'Payment details:',
        'after' => ''
    ), ADMIN);

}

function notification($content, $address) {

    $messageHtml = '
        <html>
            <head><title>'.$content['subject'].'</title></head>
            <body>
            <h1>'.$content['subject'].'</h1>';

    // Custom text before data table
    $messageHtml .= $content['before'];

    // Order table html
    $messageHtml .= '
            <br />
            <h2>Payment information:</h2>
            <table>
                <tr><td width="300">Transaction: </td><td>'.$_POST['txn_id'].'</td></tr>

                <tr><td width="300">Item name: </td><td>'.$_POST['item_name'].'</td></tr>
                <tr><td width="300">Amount: </td><td>'.$_POST['mc_gross'].' '.$_POST['mc_currency'].'</td></tr>

                <tr><td width="300">Payment date:</td><td>'.$_POST['payment_date'].'</td></tr>
                <tr><td width="300">Payment status: </td><td>'.$_POST['payment_status'].'</td></tr>';

    if (isset($_POST['pending_reason']) && $_POST['payment_status'] == 'Pending') {

        $messageHtml .= '<tr><td width="300">Pending reason:</td><td>' . pendingReasonTranscript() . '</td> </tr>';

    }

    $messageHtml .= '
            </table><br />

            <h2>Buyer information:</h2>
            <table>
                <tr><td width="300">First Name: </td><td>'.$_POST['first_name'].'</td></tr>
                <tr><td width="300">Last Name: </td><td>'.$_POST['last_name'].'</td></tr>
                <tr><td width="300">E-mail Name: </td><td>'.$_POST['payer_email'].'</td></tr>
            </table><br />';

    // End order table html

    // Text after data table
    $messageHtml .= $content['after'];

    $messageHtml .= '</body></html>';

    $mail = new Mail(ADMIN); // Create an instance of class
    $mail->setFromName(EVENT); // Set up a name in the return address

    $mail->send($address, $content['subject'], $messageHtml);

}

function pendingReasonTranscript() {

    switch ($_POST['pending_reason']) {

        default:
            $pending = '';
            break;

        case 'echeck':
            $pending = 'The payment is pending because it was made by an eCheck that has not yet cleared.';
            break;

        case 'multi_currency':
            $pending = 'You do not have a balance in the currency sent, and you do not have your profiles&#39;s Payment Receiving Preferences option set to automatically convert and accept this payment. As a result, you must manually accept or deny this payment.';
            break;

        case 'intl':
            $pending = 'The payment is pending because you hold a non-U.S. account and do not have a withdrawal mechanism. You must manually accept or deny this payment from your Account Overview.';
            break;

        case 'verify':
            $pending = 'The payment is pending because you are not yet verified. You must verify your account before you can accept this payment.';
            break;

        case 'address':
            $pending = 'The payment is pending because your customer did not include a confirmed shipping address and your Payment Receiving Preferences is set yo allow you to manually accept or deny each of these payments. To change your preference, go to the Preferences section of your Profile.';
            break;

        case 'upgrade':
            $pending = 'The payment is pending because it was made via credit card and you must upgrade your account to Business or Premier status before you can receive the funds. upgrade can also mean that you have reached the monthly limit for transactions on your account.';
            break;

        case 'authorization':
            $pending = 'You set the payment action to Authorization and have not yet captured funds.';
            break;

        case 'unilateral':
            $pending = 'The payment is pending because it was made to an email address that is not yet registered or confirmed.';
            break;

        case 'order':
            $pending = 'You set the payment action to Order and have not yet captured funds.';
            break;

        case 'paymentreview':
            $pending = 'The payment is pending while it is reviewed by PayPal for risk.';
            break;

        case 'regulatory_review':
            $pending = 'The payment is pending because PayPal is reviewing it for compliance with government regulations. PayPal will complete this review within 72 hours. When the review is complete, you will receive a second IPN message whose payment_status/reason code variables indicate the result.';
            break;

        case 'other':
            $pending = 'The payment is pending for a reason other than those listed above. For more information, contact PayPal Customer Service.';
            break;

    }

    return $pending;

}

?>
