import { Injectable } from '@angular/core';
import { AuthResponse } from "../shared/types";

@Injectable()
export class AuthService {

  profile: object;
  token: string = '';

  constructor() {

  }

  /**
   * It logins user into the system.
   * @param auth {AuthResponse} AuthResponse returned by login.
   */
  public loginUser(auth: AuthResponse) {
    this.token = auth.token;
    this.profile = auth.profile;
  }

  public isLogin() {
    return this.token.length > 0;
  }

  public getToken() {
    return this.token;
  }

  public getProfile() {
    return this.profile;
  }

}
