import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Register for push notifications and return token
   */
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // token = (await Notifications.getExpoPushTokenAsync({ projectId: '...' })).data;
      // console.log(token);
    } else {
      // alert('Must use physical device for Push Notifications');
      console.log('Not a physical device, skipping push token registration');
    }

    return token;
  },

  /**
   * Schedule a local notification
   */
  async scheduleReminder(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger,
    });
  },

  /**
   * Schedule a care reminder
   */
  async scheduleCareReminder(potName: string, careType: string, date: Date) {
    // Calculate seconds until date
    const now = new Date();
    const seconds = Math.floor((date.getTime() - now.getTime()) / 1000);

    if (seconds <= 0) {
      console.log('Reminder date is in the past, skipping scheduling');
      return;
    }

    await this.scheduleReminder(
      `Time to ${careType} ${potName}!`,
      `Your ${potName} needs some love.`,
      {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
      // For more complex scheduling (calendar based), use:
      // { date: date }
    );
  },

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
