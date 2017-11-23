export interface IActivity {
  action: string;
  // notify();
  getType();
  send(payload: object);
  // channel: string;
  // setChannel(channel: string);
}
