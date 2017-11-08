import { ApiService } from './providers/api.service';
import { AuthService } from './providers/auth.service';
import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import 'polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatSidenavModule,
  MatCardModule,
  MatInputModule,
  MatSelectModule,
  MatFormFieldModule,
  MatGridListModule,
  MatListModule,
  MatIconModule,
  MatTabsModule,
  MatSlideToggleModule
} from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';

import { AppRoutingModule } from './app-routing.module';

import { ElectronService } from './providers/electron.service';

import { SharesComponent } from './components/shares/shares.component';
import { LoginComponent } from './components/login/login.component';
import { ShareComponent } from './components/share/share.component';
import { NodeComponent } from './components/node/node.component';
import { ShareViewComponent } from './components/shareview/shareview.component';
import { FileComponent } from './components/file/file.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SharesComponent,
    LoginComponent,
    ShareComponent,
    NodeComponent,
    ShareViewComponent,
    FileComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatSidenavModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatGridListModule,
    MatListModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
    FlexLayoutModule
  ],
  providers: [ElectronService, AuthService, ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
