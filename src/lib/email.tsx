import { Resend } from "resend";
import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

// --- Confirmation email template ---

interface ConfirmEmailProps {
  confirmUrl: string;
}

function ConfirmEmail({ confirmUrl }: ConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your Bedrock Digest subscription</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "40px auto", padding: "32px" }}>
          <Heading style={{ fontSize: "24px", color: "#111", marginBottom: "8px" }}>
            One click to confirm
          </Heading>
          <Text style={{ color: "#444", lineHeight: "1.6" }}>
            Thanks for signing up for Bedrock Digest — the weekly roundup of
            Product Design news from the AI space, curated for practitioners.
          </Text>
          <Text style={{ color: "#444", lineHeight: "1.6" }}>
            Click the button below to confirm your email address and complete
            your subscription.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={confirmUrl}
              style={{
                backgroundColor: "#111",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Confirm subscription
            </Button>
          </Section>
          <Text style={{ color: "#888", fontSize: "13px" }}>
            If you didn&apos;t sign up for Bedrock Digest, you can safely ignore
            this email.
          </Text>
          <Text style={{ color: "#bbb", fontSize: "12px", marginTop: "32px" }}>
            Bedrock Digest · {baseUrl()}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function sendConfirmationEmail(
  toEmail: string,
  confirmToken: string
): Promise<void> {
  const confirmUrl = `${baseUrl()}/confirm?token=${confirmToken}`;
  const client = resend();
  const { error } = await client.emails.send({
    from: fromAddress(),
    to: toEmail,
    subject: "Confirm your Bedrock Digest subscription",
    react: <ConfirmEmail confirmUrl={confirmUrl} />,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
