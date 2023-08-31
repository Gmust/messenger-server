import * as PusherServer from 'pusher';

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: 'eu',
  useTLS: true
});
/*
PUSHER_APP_ID=1614772
NEXT_PUBLIC_PUSHER_APP_KEY=6c24c9f8a2424c317839
PUSHER_APP_SECRET=e0793a22e86f65070bac
PUSHER_APP_CLUSTER=eu*/
