import { Routes } from '@angular/router';
import { MemberApplicationsComponent } from './views/pages/applicationForm/application.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

import { HomeLayoutComponent } from './views/partials/home-layout/home-layout.component';
import { BannersComponent } from './views/pages/banner/banner.component';

import { RegistrationFormComponent1 } from './views/pages/registerApplication/register.component';

import { EventRegistrationComponent } from './views/pages/eventRegistration/eventRegistration.component';


import { UsersComponent } from './views/pages/users/users.component';
import { CountriesComponent } from './views/pages/country/country.component';
import { StatesComponent } from './views/pages/states/states.component';
import { DashboardComponent } from './views/pages/dashboard/dashboard.component';
import { EventsComponent } from './views/pages/events/events.component';
import { AttendanceComponent } from './views/pages/attendence/attendence.component';

import { ChaptersComponent } from './views/pages/chapter/chapter.component';
import { CategoriesComponent } from './views/pages/category/category.component';
import { CitiesComponent } from './views/pages/city/city.component';
import { LeaderboardComponent } from './views/pages/leaderboard/leaderboard.component';
import { ReferralsComponent } from './views/pages/referralReport/referralReport.component';
import { TestimonialsComponent } from './views/pages/testimonialReport/testimonialReport.component';
import { ReferralsComponentRecieved } from './views/pages/referralReportRecieved/referralReportRecieved.component';
import { OneToOneComponent } from './views/pages/oneToone/oneToone.component';
import { TyfcbComponent } from './views/pages/tyfcb/tyfcb.component';
import { VisitorsComponent } from './views/pages/visitors/visitors.component';
import { AttendanceDataComponent } from './views/pages/attendenceRecord/attendenceRecord.component';
import { RegisterComponent } from './views/pages/userRegisteration/userRegisteration.component';
import { PointsHistoryComponent } from './views/pages/pointHistory/pointhistory.component';
import { AdminLoginComponent } from './views/pages/login/login.component';
import { SubCategoriesComponent } from './views/pages/subcategory/subcategory.component';
import { ParticipationComponent } from './views/pages/participation/participation.component';
import { ImportUsersComponent } from './views/pages/importUser/import-users.component';
import { FeesComponent } from './views/pages/feesRecord/fees.component';
import { BadgesComponent } from './views/pages/badges/badges.component';
import { BadgeManagementComponent } from './views/pages/usersbadge/usersbadge.component';
import { AskManagementComponent } from './views/pages/ask/ask.component';
import { PodcastsComponent } from './views/pages/podcast/podcast.comonent';
import { OtpRecordsComponent } from './views/pages/otp/otp.component';
import { BookingsComponent } from './views/pages/podcastBooking/podcastBooking.component';

import { FinanceComponent } from './views/pages/financeModule/finance.component';
import { ExpenseComponent } from './views/pages/expense/expense.component';
import { AnalyticsComponent } from './views/pages/analytics/analytics.component';
import { RegionsComponent } from './views/pages/regions/regions.component';
import {BannerRatesComponent} from './views/pages/BannerRates/bannerRates.component';
import { PhotoCategoriesComponent } from './views/pages/PhotoCategory/photo-categories.component';



import { LTPointsComponent } from './views/pages/LT Points/ltPoints.component';
import { AdminComplaintComponent } from './views/pages/admin-complaint/admin-complaint.component';
import { AdminFeedbackComponent } from './views/pages/admin-feedback/admin-feedback.component';
import { NewUserRegistrationComponent } from './views/pages/new-user-registration/new-user-registration.component';
import { NewEventsComponent } from './views/pages/new-events/new-events.component';
import {EventPaymentsComponent} from './views/pages/paymentStatus/payment.component';
import { BannerRequestsComponent } from './views/pages/bannerRequest/bannerRequest.component';
import { CouponMasterComponent } from './views/pages/couponMaster/coupon-master.component';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'adminLogin' },
  { path: 'adminLogin', component: AdminLoginComponent },


  {
    path: '',
    component: HomeLayoutComponent,
    canActivate: [AuthGuard],
    children: [


      { path: 'registrationForm', component: RegistrationFormComponent1, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'eventRegistration', component: EventRegistrationComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'application', component: MemberApplicationsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'users', component: UsersComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'importUsers', component: ImportUsersComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'country', component: CountriesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'states', component: StatesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'events', component: EventsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'attendence', component: AttendanceComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'chapter', component: ChaptersComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'category', component: CategoriesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] }, },
      { path: 'subcategory', component: SubCategoriesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] }, },
      { path: 'otp', component: OtpRecordsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },

      { path: 'city', component: CitiesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {path:'regions', component: RegionsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {path:'photoCategories', component: PhotoCategoriesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'leaderboard', component: LeaderboardComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'referralReport', component: ReferralsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'testimonialReport', component: TestimonialsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'referralReportRecieved', component: ReferralsComponentRecieved, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'oneTooneReport', component: OneToOneComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'tyfcb', component: TyfcbComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'VisitorsReport', component: VisitorsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] }, },

      { path: 'attendanceRecord', component: AttendanceDataComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'registerComponent', component: RegisterComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'pointHistory', component: PointsHistoryComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'adminLogin', component: AdminLoginComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'participation', component: ParticipationComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {
        path: 'banners', component: BannersComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] }
      },
      { path: 'fees', component: FeesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'badges', component: BadgesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {
        path: 'badgeManagement', component: BadgeManagementComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] },
      },
      {path:'bannerRequest', component: BannerRequestsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] }},
      {path:'couponMaster', component: CouponMasterComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] }},


      { path: 'finance', component: FinanceComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
{path:'payment', component: EventPaymentsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },

      {path:'complaint', component: AdminComplaintComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {path:'feedback', component: AdminFeedbackComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {path:'newUsersRegistration', component: NewUserRegistrationComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      {path:'newEvents', component: NewEventsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },


{path:'analytics', component: AnalyticsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },

      { path: 'askManagement', component: AskManagementComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'podcasts', component: PodcastsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
      { path: 'LTPoints', component: LTPointsComponent, canActivate: [RoleGuard], data: { roles: ['LT', 'admin'] } },
      { path: 'finance', component: FinanceComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },

{path: 'podcastBooking', component: BookingsComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
{path: 'expense', component: ExpenseComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } },
{path:'bannerRates',component: BannerRatesComponent,canActivate: [RoleGuard], data: { roles: ['admin', 'advisoryBoard', 'supportDirector', 'supportAmbassador'] } } 
    ],
  },
];
