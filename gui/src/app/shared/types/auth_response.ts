export interface AuthResponse {
  profile: {
    accountname: string;
    address: string;
    email: string;
    expires: string;
    logo: string;
    mobile: string;
    realname: string;
    status: string;
    username: string;
  };
  token: string;
}