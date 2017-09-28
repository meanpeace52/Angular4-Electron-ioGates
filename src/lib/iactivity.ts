export interface IActivity {
  // notify();
  getType();
  type: string;
  send(payload: object);
  // channel: string;
  // setChannel(channel: string);
}