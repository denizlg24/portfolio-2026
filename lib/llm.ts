import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
	throw new Error("ANTHROPIC_API_KEY is not defined");
}

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHARS_PER_TOKEN = 0.3;

function charsToTokens(chars: number): number {
	return Math.ceil(chars / CHARS_PER_TOKEN);
}

export async function generateText({
	system,
	prompt,
	model = "claude-sonnet-4-5-20250929",
	maxChars = 3000,
}: {
	system: string;
	prompt?: string;
	model?: Anthropic.Model;
	maxChars?: number;
}): Promise<string> {
	const messages: Anthropic.MessageParam[] = [];

	if (prompt) {
		messages.push({ role: "user", content: prompt });
	} else {
		messages.push({ role: "user", content: "." });
	}

	const response = await anthropic.messages.create({
		model,
		max_tokens: charsToTokens(maxChars),
		system,
		messages,
	});

	const text = response.content
		.filter((block): block is Anthropic.TextBlock => block.type === "text")
		.map((block) => block.text)
		.join("");

	return text;
}
