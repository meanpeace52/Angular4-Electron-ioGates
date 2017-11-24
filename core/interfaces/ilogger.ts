export interface ILogger {
  info(message: string);
  error(message: string);
  warning(message: string);
  debug(message: string);
}
