/**
 * MailRelay - Simple Email Relay Service
 * Cloudflare Worker with MailChannels integration
 */

export interface Env {
  PERSONAL_EMAIL: string;
  WORK_EMAIL: string;
  MAILCHANNELS_API_KEY: string;
  PINCODE: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
}

interface EmailRequest {
  pincode: string;
  destination: 'personal' | 'work';
  subject: string;
  message: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle API endpoint
    if (url.pathname === '/api/send' && request.method === 'POST') {
      return handleApiSend(request, env);
    }

    // Handle web form (GET request to root)
    if (request.method === 'GET' && url.pathname === '/') {
      return handleWebForm(url, env);
    }

    // Handle form submission (POST to root)
    if (request.method === 'POST' && url.pathname === '/') {
      return handleFormSubmit(request, env);
    }

    return jsonResponse({
      success: false,
      message: 'Not found',
      data: null
    }, 404);
  },
};

async function handleApiSend(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as EmailRequest;

    console.log('API send request received', {
      destination: body.destination,
      subject: body.subject,
      hasPincode: !!body.pincode,
      hasMessage: !!body.message
    });

    // Validate pincode
    if (!body.pincode || body.pincode !== env.PINCODE) {
      console.log('Invalid pincode attempt');
      return jsonResponse({
        success: false,
        message: 'Invalid pincode',
        data: null
      }, 401);
    }

    // Validate required fields
    if (!body.subject) {
      return jsonResponse({
        success: false,
        message: 'Subject is required',
        data: null
      }, 400);
    }

    if (!body.destination || !['personal', 'work'].includes(body.destination)) {
      return jsonResponse({
        success: false,
        message: 'Destination must be "personal" or "work"',
        data: null
      }, 400);
    }

    // Determine recipient email
    const toEmail = body.destination === 'personal' ? env.PERSONAL_EMAIL : env.WORK_EMAIL;

    // Send email via MailChannels
    const result = await sendEmail({
      to: toEmail,
      subject: body.subject,
      message: body.message || '',
      fromEmail: env.FROM_EMAIL,
      fromName: env.FROM_NAME,
      apiKey: env.MAILCHANNELS_API_KEY
    });

    if (!result.success) {
      console.error('Email sending failed', result.error);
      return jsonResponse({
        success: false,
        message: `Email sending failed: ${result.error}`,
        data: null
      }, 500);
    }

    console.log('Email sent successfully', { destination: body.destination });
    return jsonResponse({
      success: true,
      message: 'Email sent successfully',
      data: {
        destination: body.destination
      }
    }, 200);

  } catch (error) {
    console.error('API error', error);
    return jsonResponse({
      success: false,
      message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    }, 500);
  }
}

async function handleWebForm(url: URL, env: Env): Promise<Response> {
  const pincode = url.searchParams.get('pincode') || '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MailRelay</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">📧 MailRelay</h1>

    <form method="POST" action="/" class="space-y-4">
      ${pincode ? `
        <input type="hidden" name="pincode" value="${escapeHtml(pincode)}">
      ` : `
        <div>
          <label for="pincode" class="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            type="password"
            id="pincode"
            name="pincode"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>
      `}

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Send To</label>
        <div class="flex gap-4">
          <label class="flex items-center">
            <input type="radio" name="destination" value="personal" checked class="mr-2">
            <span class="text-sm">Personal</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="destination" value="work" class="mr-2">
            <span class="text-sm">Work</span>
          </label>
        </div>
      </div>

      <div>
        <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
      </div>

      <div>
        <label for="message" class="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          rows="6"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Send Email
      </button>
    </form>
  </div>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

async function handleFormSubmit(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const pincode = formData.get('pincode') as string;
    const destination = formData.get('destination') as 'personal' | 'work';
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string || '';

    console.log('Form submission received', {
      destination,
      subject,
      hasPincode: !!pincode
    });

    // Validate pincode
    if (!pincode || pincode !== env.PINCODE) {
      return htmlResponse('Invalid pincode', false);
    }

    // Validate required fields
    if (!subject) {
      return htmlResponse('Subject is required', false);
    }

    // Determine recipient email
    const toEmail = destination === 'personal' ? env.PERSONAL_EMAIL : env.WORK_EMAIL;

    // Send email via MailChannels
    const result = await sendEmail({
      to: toEmail,
      subject,
      message,
      fromEmail: env.FROM_EMAIL,
      fromName: env.FROM_NAME,
      apiKey: env.MAILCHANNELS_API_KEY
    });

    if (!result.success) {
      console.error('Email sending failed', result.error);
      return htmlResponse(`Email sending failed: ${result.error}`, false);
    }

    console.log('Email sent successfully via form', { destination });
    return htmlResponse('Email sent successfully!', true);

  } catch (error) {
    console.error('Form submission error', error);
    return htmlResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
  }
}

async function sendEmail(params: {
  to: string;
  subject: string;
  message: string;
  fromEmail: string;
  fromName: string;
  apiKey: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Sending email to MailChannels', {
      to: params.to,
      subject: params.subject,
      from: params.fromEmail
    });

    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': params.apiKey,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to }],
          },
        ],
        from: {
          email: params.fromEmail,
          name: params.fromName,
        },
        subject: params.subject,
        content: [
          {
            type: 'text/plain',
            value: params.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailChannels API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        success: false,
        error: `MailChannels API returned ${response.status}: ${errorText}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending exception', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function jsonResponse(data: ApiResponse, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function htmlResponse(message: string, success: boolean): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MailRelay - ${success ? 'Success' : 'Error'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">📧 MailRelay</h1>

    <div class="${success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded p-4 mb-4">
      <p class="${success ? 'text-green-800' : 'text-red-800'} font-medium">
        ${success ? '✓' : '✗'} ${escapeHtml(message)}
      </p>
    </div>

    <a
      href="/"
      class="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
    >
      Back to Form
    </a>
  </div>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
