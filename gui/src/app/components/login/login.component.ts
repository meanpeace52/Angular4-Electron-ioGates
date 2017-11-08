import { ApiService } from '../../providers/api.service';
import { AuthResponse } from '../../shared/types/auth_response';
import { AuthService } from '../../providers/auth.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { IOGates } from "../../shared/iogate";
import { Share } from "../../shared/types";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  title = 'Paste in the shared link folder below';
  description = 'You should have recieved a link when an ioGates folder was shared with you. ' +
  'If you don’t have it please contact them and ask for it to be resent';
  url: string = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private api: ApiService
  ) {
  }

  ngOnInit() {
  }

  authenticateViaUrl() {
    if (!this.isValidUrl(this.url)) {
      return alert('INVALID URL');
    }
    let share: Share = new Share();
    share.url = this.url;
    this
      .api
      .authenticateFromUrl(share)
      .then((auth: AuthResponse) => {
        this.auth.loginUser(auth);
        // TODO: Store share in database.
        this.router.navigateByUrl('/shares/10'); // make it dynamic.
      });
  }

  private isValidUrl(url: string) {
    return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(url);
  }

}
