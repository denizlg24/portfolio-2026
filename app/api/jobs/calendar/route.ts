import { connectDB } from "@/lib/mongodb";
import { CalendarEvent, ICalendarEvent } from "@/models/CalendarEvent";

export async function GET(request: Request) {
  try {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CALENDAR_API_BEARER_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    await connectDB();
    const events = await CalendarEvent.find({
      notifyBySlack: true,
      isNotificationSent: false,
      status: "scheduled",
      notifyAt: { $lte: new Date() },
    }).lean();
    for (const event of events) {
      await sendEventToSlack(event);
      await CalendarEvent.findByIdAndUpdate(event._id, {
        isNotificationSent: true,
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

async function sendEventToSlack(event: ICalendarEvent) {
  const slackWebhookUrl = process.env.EVENTS_SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) return;
  const headerText = `⏰ *Reminder: ${
    event.title
  }* is scheduled for <!date^${Math.floor(
    event.date.getTime() / 1000
  )}^{date_long} at {time}|${event.date.toISOString()}>`;

 const blocks = [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `⏰ *Reminder*:*${event.title}*`,
    },
  },
  {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `🗓 <!date^${Math.floor(
          event.date.getTime() / 1000
        )}^{date_long} at {time}|${event.date.toISOString()}>`,
      },
    ],
  },
  ...(event.links?.length
    ? [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Links*\n${event.links
              .map(link => `• <${link.url}|${link.label}>`)
              .join("\n")}`,
          },
        },
      ]
    : []),
];

  await fetch(slackWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: headerText,
      blocks,
    }),
  });
}
