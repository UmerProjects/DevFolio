const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
	if (req.method !== 'POST') {
		return res.status(405).send('Method Not Allowed');
	}

	try {
		let name = '';
		let email = '';
		let subject = '';
		let message = '';
		const contentType = req.headers['content-type'] || '';

		if (contentType.includes('application/json')) {
			({ name = '', email = '', subject = '', message = '' } = req.body || {});
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			({ name = '', email = '', subject = '', message = '' } = req.body || {});
		} else {
			return res.status(400).send('Unsupported Content-Type.');
		}

		name = String(name || '').trim();
		email = String(email || '').trim();
		subject = String(subject || '').trim();
		message = String(message || '').trim();

		if (!name || !email || !subject || !message) {
			return res.status(400).send('All fields are required.');
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).send('Invalid email address.');
		}

		const toEmail = process.env.TO_EMAIL;
		const smtpHost = process.env.SMTP_HOST;
		const smtpPort = Number(process.env.SMTP_PORT || 587);
		const smtpUser = process.env.SMTP_USER;
		const smtpPass = process.env.SMTP_PASS;
		if (!toEmail || !smtpHost || !smtpUser || !smtpPass) {
			return res.status(500).send('Server not configured for email.');
		}

		const transporter = nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort,
			secure: smtpPort === 465,
			auth: { user: smtpUser, pass: smtpPass }
		});

		await transporter.sendMail({
			from: `Portfolio Contact <${smtpUser}>`,
			to: toEmail,
			subject: `New contact form message: ${subject}`,
			text: [
				`You have received a new message from your website contact form.`,
				'',
				`Name: ${name}`,
				`Email: ${email}`,
				`Subject: ${subject}`,
				'',
				'Message:',
				message
			].join('\n'),
			replyTo: `${name} <${email}>`
		});

		return res.status(200).send('OK');
	} catch (err) {
		return res.status(500).send(err?.message || 'Failed to send your message.');
	}
};
