export const config = { runtime: 'edge' };

function badRequest(message) {
	return new Response(message, { status: 400 });
}

export default async function handler(req) {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	try {
		const contentType = req.headers.get('content-type') || '';
		let name = '';
		let email = '';
		let subject = '';
		let message = '';

		if (contentType.includes('application/x-www-form-urlencoded')) {
			const text = await req.text();
			const params = new URLSearchParams(text);
			name = (params.get('name') || '').toString().trim();
			email = (params.get('email') || '').toString().trim();
			subject = (params.get('subject') || '').toString().trim();
			message = (params.get('message') || '').toString().trim();
		} else if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			name = (formData.get('name') || '').toString().trim();
			email = (formData.get('email') || '').toString().trim();
			subject = (formData.get('subject') || '').toString().trim();
			message = (formData.get('message') || '').toString().trim();
		} else {
			return badRequest('Unsupported Content-Type.');
		}

		if (!name || !email || !subject || !message) {
			return badRequest('All fields are required.');
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return badRequest('Invalid email address.');
		}

		const toEmail = process.env.TO_EMAIL;
		const resendApiKey = process.env.RESEND_API_KEY;
		if (!toEmail || !resendApiKey) {
			return new Response('Server not configured for email.', { status: 500 });
		}

		const bodyText = [
			`You have received a new message from your website contact form.`,
			'',
			`Name: ${name}`,
			`Email: ${email}`,
			`Subject: ${subject}`,
			'',
			'Message:',
			message,
		].join('\n');

		const resendResponse = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${resendApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: 'Portfolio Contact <onboarding@resend.dev>',
				to: [toEmail],
				subject: `New contact form message: ${subject}`,
				text: bodyText,
				reply_to: `${name} <${email}>`,
			}),
		});

		if (!resendResponse.ok) {
			const errText = await resendResponse.text();
			return new Response(errText || 'Failed to send your message.', { status: 502 });
		}

		return new Response('OK', { status: 200 });
	} catch (err) {
		return new Response(err?.message || 'Unexpected error.', { status: 500 });
	}
}
