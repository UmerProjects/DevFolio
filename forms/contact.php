<?php
// Email recipient (replace with your actual email address)
$receiving_email_address = 'uqazi844@gmail.com';

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
	// Collect and sanitize form inputs
	$name = isset($_POST['name']) ? htmlspecialchars(strip_tags(trim($_POST['name']))) : '';
	$email = isset($_POST['email']) ? htmlspecialchars(strip_tags(trim($_POST['email']))) : '';
	$subject = isset($_POST['subject']) ? htmlspecialchars(strip_tags(trim($_POST['subject']))) : '';
	$message = isset($_POST['message']) ? htmlspecialchars(strip_tags(trim($_POST['message']))) : '';

	// Validate the inputs
	if (empty($name) || empty($email) || empty($subject) || empty($message)) {
		echo "All fields are required.";
		exit;
	}
	if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
		echo "Invalid email address.";
		exit;
	}

	// Build email
	$domain = isset($_SERVER['SERVER_NAME']) ? preg_replace('/^www\./', '', $_SERVER['SERVER_NAME']) : 'localhost';
	$fromAddress = 'no-reply@' . $domain;
	$emailSubject = "New contact form message: " . $subject;
	$bodyLines = [
		"You have received a new message from your website contact form.",
		"",
		"Name: " . $name,
		"Email: " . $email,
		"Subject: " . $subject,
		"",
		"Message:",
		$message,
		"",
		"Sender IP: " . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown'),
	];
	$body = implode("\r\n", $bodyLines);

	// Email headers (use domain From and set Reply-To to the user for better deliverability)
	$headers = "From: Website Contact <{$fromAddress}>\r\n";
	$headers .= "Reply-To: {$name} <{$email}>\r\n";
	$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
	$headers .= "X-Mailer: PHP/" . phpversion();

	// Send the email
	$mail_sent = @mail($receiving_email_address, $emailSubject, $body, $headers);

	if ($mail_sent) {
		// The frontend validate.js expects exactly 'OK' on success
		echo 'OK';
	} else {
		echo "Failed to send your message. This server may not be configured to send mail.";
	}
} else {
	echo "Invalid request.";
}
?>
