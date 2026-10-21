import { PushNotifications } from "@capacitor/push-notifications"

export const useRegisterPushNotification = () => {
  const registerPushNotification = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== "granted") {
        // You might want to handle this more gracefully than a throw
        console.warn("User denied push permissions")
        return
      }

      await PushNotifications.register()
    } catch (error) {
      console.error("Push registration failed", error)
    }
  }

  return { registerPushNotification }
}
