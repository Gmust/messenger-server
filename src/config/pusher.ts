import * as process from 'process';
import * as PusherServer from 'pusher';

export const pusherServer = new PusherServer({
  appId: '1614772',
  key: 'c8616ea9644899b0e7f9',
  secret: 'ee10c956e52beb2a9f4e',
  cluster: 'eu',
  useTLS: true
});
/*
PUSHER_APP_ID=1614772
NEXT_PUBLIC_PUSHER_APP_KEY=6c24c9f8a2424c317839
PUSHER_APP_SECRET=e0793a22e86f65070bac
PUSHER_APP_CLUSTER=eu*/
