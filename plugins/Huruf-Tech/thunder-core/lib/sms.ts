export type TSMSData = {
  to: string;
  text: string;
};

export class SMS {
  static onSendSms?: (data: TSMSData) => void | Promise<void>;

  static async send(data: TSMSData) {
    if (!this.onSendSms) {
      throw new Error(
        "SMS sending is not configured. Please set SMS.onSendSms to a function that sends SMS messages.",
      );
    }

    await this.onSendSms(data);
  }
}
