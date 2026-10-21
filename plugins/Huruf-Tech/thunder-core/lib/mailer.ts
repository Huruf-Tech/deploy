// @deno-types=@types/nodemailer
import nodemailer from "nodemailer";
import { Env, EnvType } from "@/core/utils/env.ts";
import { handlebarsRender } from "@/core/utils/textRender.ts";

export type TEmailTemplate = { subject?: string; html?: string; text?: string };
export type TFetchEmailTemplate = () =>
  | TEmailTemplate
  | Promise<TEmailTemplate>;

export type TMailData = {
  template?: string;
  to: string;
  subject?: string;
  html?: string;
  text?: string;
};

export class Mailer {
  protected static instance?: ReturnType<typeof nodemailer["createTransport"]>;
  protected static blankTemplateId = "_blank";
  protected static templates = new Map<
    string,
    TFetchEmailTemplate
  >();
  protected static templatesCache = new Map<string, TEmailTemplate>();

  static async get() {
    return (this.instance ??= nodemailer.createTransport({
      host: await Env.get("SMTP_HOST"),
      port: await Env.number("SMTP_PORT"),
      secure: await Env.enabled("SMTP_SECURE"),
      auth: {
        user: await Env.get("SMTP_USERNAME"),
        pass: await Env.get("SMTP_PASSWORD"),
      },
      logger: !Env.is(EnvType.PRODUCTION),
      debug: await Env.enabled("SMTP_DEBUG"),

      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    }));
  }

  static addTemplate(id: string, fetcher: TFetchEmailTemplate) {
    this.templates.set(id, fetcher);

    return this;
  }

  static async renderTemplate(
    id: string,
    data: Record<string, string | number | boolean>,
  ) {
    const fetchBlankTemplate = this.templates.get(this.blankTemplateId);
    const fetchTemplate = this.templates.get(id);

    const template = this.templatesCache.get(id) ??
      await (async () => {
        const results = await fetchTemplate?.();

        if (results) {
          this.templatesCache.set(id, results);

          return results;
        }

        return this.templatesCache.get(this.blankTemplateId) ??
          await (async () => {
            const blank = await fetchBlankTemplate?.();

            if (blank) this.templatesCache.set(this.blankTemplateId, blank);

            return blank;
          })();
      })();

    if (!template) return {};

    const { subject, html, text } = template;

    return {
      subject: subject && handlebarsRender(subject, data),
      html: html && handlebarsRender(html, data),
      text: text && handlebarsRender(text, data),
    };
  }

  static onSendMail?: (data: TMailData) => void | Promise<void>;

  static async send(
    data: TMailData & {
      [K: string]: string | number | boolean;
    },
  ) {
    const template = await Mailer.renderTemplate(
      data.template ?? this.blankTemplateId,
      data,
    );

    const subject = template.subject ?? data.subject;
    const html = template.html ?? data.html;
    const text = template.text ?? data.text;
    const payload = {
      from: `"${await Env.get("SMTP_SENDER_NAME")}" <${await Env.get(
        "SMTP_SENDER",
      )}>`,
      to: data.to,
      subject,
      html,
      text,
    };

    if (this.onSendMail) {
      await this.onSendMail(payload);

      return;
    }

    const mailer = await this.get();

    await mailer.sendMail(payload);
  }
}
