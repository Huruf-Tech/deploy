import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.huruf.thunderui',
  appName: 'thunder-ui',
  webDir: 'www',
  plugins: {
    SystemBars: {
      insetsHandling: "disable"
    },

    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  }
};

export default config;
