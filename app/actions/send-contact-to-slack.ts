"use server";

import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  message: z.string().min(10),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export async function sendToSlack(data: ContactFormData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { success: false, message: "Slack webhook URL is not configured" };
  }

  const parsed = contactFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Invalid form data" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "New Portfolio Submission",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📬 New Contact Form Submission",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Name:*\n${parsed.data.name}`,
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${parsed.data.email}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Message:*\n${parsed.data.message}`,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    return { success: false, message: "Failed to send message to Slack" };
  }

  return { success: true };
}
