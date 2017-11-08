import { ShareViewComponent } from './components/shareview/shareview.component';
import { LoginComponent } from './components/login/login.component';
import { SharesComponent } from './components/shares/shares.component';
import { HomeComponent } from './components/home/home.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {FileComponent} from "./components/file/file.component";

const routes: Routes = [
	{
		path: '',
		component: HomeComponent
	},
	// {
	// 	path: 'shares',
	// 	component: SharesComponent
	// },
	{
		path: 'login',
		component: LoginComponent
	},
	{
		path: 'shares/:id',
		component: ShareViewComponent
	},
  {
    path: 'file',
    component: FileComponent
  }
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
	exports: [RouterModule]
})
export class AppRoutingModule { }
