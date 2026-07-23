# DS2 brief integration notes

The current assistant is front-end only. Keep the visible final action labelled **Send**.

When the backend is connected:

1. Notify the DS2 company Telegram account when somebody starts the brief.
2. Send a second Telegram notification when they reach the final review stage.
3. When they press **Send**, deliver the complete structured brief to the DS2 company email.

The browser `mailto:` action in `page.tsx` is temporary and should be replaced by the final secure submission endpoint. The endpoint should validate and rate-limit submissions, escape all user input, and keep Telegram credentials and email credentials server-side.
