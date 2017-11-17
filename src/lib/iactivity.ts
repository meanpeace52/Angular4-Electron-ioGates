export interface IActivity {
  type: string;
  // notify();
  getType();
  send(payload: object);
  // channel: string;
  // setChannel(channel: string);
}
