export const config = { runtime: 'edge' };

export default async function handler(req) {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	try {
		const formData = await req.formData();
		const name = (formData.get('name') || '').toString().trim();
		const email = (formData.get('email') || '').toString().trim();
		const subject = (formData.get('subject') || '').toString().trim();
		const message = (formData.get('message') || '').toString().trim();

		if (!name || !email || !subject || !message) {
			return new Response('All fields are required.', { status: 400 });
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return new Response('Invalid email address.', { status: 400 });
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
				'Authorization': `Bearer ${resendApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'Portfolio Contact <onboarding@resend.dev>',
				to: toEmail,
				subject: `New contact form message: ${subject}`,
				text: bodyText,
				reply_to: `${name} <${email}>`
			})
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
