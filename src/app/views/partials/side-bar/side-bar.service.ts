import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { link } from 'fs';
import { title } from 'process';

@Injectable({
  providedIn: 'root',
})
export class SideBarService {
  constructor(private router: Router) { }
  ngOnInit(): void { }

  list: any[] = [
    {
      moduleName: 'Startup Weaver',
      menus: [
        {
          title: 'Dashboard',
          link: 'dashboard',
          icon: 'home',
        },
        {
          title: 'All Members',
          link: 'users',
          icon: 'users',
        },
        {
          title: 'OTP Records',
          link: 'otp',
          icon: 'key',
        },
        {
          title: 'User Management',
          icon: 'user-cog',
          hasSubmenu: true,
          submenu: [
            {
              title: 'Registration',
              link: 'newUsersRegistration',
              icon: 'user-plus',
            },
            // {
            //   title: 'Conveted mobile User',
            //   link: 'applicationForm',
            //   icon: 'file-text',
            // },
            // {
            //   title: 'Membership Form',
            //   link: 'application',
            //   icon: 'file-text',
            // },
            // {
            //   title: 'Import Users',
            //   link: 'importUsers',
            //   icon: 'file-import',
            // },
          ]
        },
        {
          title: 'Add Events',
          link: 'newEvents',
          icon: 'calendar',
        },
        {
          title: 'Event Registration',
          link: 'payment',
          icon: 'p'
        },
        {
          title: 'Travel Ask Management',
          link: 'askManagement',
          icon: 'question-circle',
        },
        {
          title: 'Travel Lead Management',
          link: 'leadManagement',
          icon: 'briefcase',
        },
        // {
        //   title: ' Event And participation ',
        //   icon: 'calendar',
        //   hasSubmenu: true,
        //   submenu: [
        //     {
        //       title: 'Bardoli Event',
        //       link: 'registrationForm',
        //       icon: 'calendar-check',
        //     },
        //     {
        //       title: 'GBS Launch Event',
        //       link: 'eventRegistration',
        //       icon: 'calendar-check',
        //     },

        //     {
        //       title: 'Participation',
        //       link: 'participation',
        //       icon: 'check-circle',
        //     },
        //     {
        //       title: 'Attendance',
        //       link: 'attendence',
        //       icon: 'check-square',
        //     },
        //   ]
        // },
        {
          title: 'Master Data',
          icon: 'settings',
          hasSubmenu: true,
          submenu: [
            {
              title: 'Countries',
              link: 'country',
              icon: 'globe',
            },
            {
              title: 'States',
              link: 'states',
              icon: 'map',
            },
            {
              title: 'Cities',
              link: 'city',
              icon: 'map-pin',
            },
            {
              title: 'Regions',
              link: 'regions',
              icon: 'map-signs',
            },
            {
              title: 'Banner rates',
              link: 'bannerRates',
              icon: 'advertisement'
            },
            {
              title: 'Banner Request',
              link: 'bannerRequest',
              icon: 'banner'
            },
            {
              title: 'Coupon Master',
              link: 'couponMaster',
              icon: 'ticket-perforated'
            },

            {
              title: 'Brand Templates',
              link: 'photoCategories',
              icon: 'image',
            },
            {
              title: 'DMC List',
              link: 'dmc-list',
              icon: 'list',
            },
            // {
            //   title: 'Chapters',
            //   link: 'chapter',
            //   icon: 'layers',
            // },
            // {
            //   title: 'Categories',
            //   link: 'category',
            //   icon: 'tag',
            // },
            // {
            //   title: 'Sub Categories',
            //   link: 'subcategory',
            //   icon: 'list',
            // },
          ]
        },
        // {
        //   title: 'Reports Sections',
        //   icon: 'file-text',
        //   hasSubmenu: true,
        //   submenu: [
        //     // {
        //     //   title: 'Referral Given Report',
        //     //   link: 'referralReport',
        //     //   icon: 'corner-up-right',
        //     // },
        //     // {
        //     //   title: 'Referral Received Report',
        //     //   link: 'referralReportRecieved',
        //     //   icon: 'corner-down-left',
        //     // },
        //     // {
        //     //   title: 'Testimonial Report',
        //     //   link: 'testimonialReport',
        //     //   icon: 'message-square',
        //     // },
        //     // {
        //     //   title: 'One To One Report',
        //     //   link: 'oneTooneReport',
        //     //   icon: 'user-check',
        //     // },
        //     // {
        //     //   title: 'TYFCB Report',
        //     //   link: 'tyfcb',
        //     //   icon: 'trending-up',
        //     // },
        //     // {
        //     //   title: 'Visitors Report',
        //     //   link: 'VisitorsReport',
        //     //   icon: 'user',
        //     // },
        //     // {
        //     //   title: 'Ask Management',
        //     //   link: 'askManagement',
        //     //   icon: 'question-circle',
        //     // },
        //     // {
        //     //   title: 'Points History',
        //     //   link: 'pointHistory',
        //     //   icon: 'history',
        //     // },
        //     {
        //       title: 'Attendance Record',
        //       link: 'attendanceRecord',
        //       icon: 'clipboard',
        //     },
        // {
        //   title: 'Fees Record',
        //   link: 'fees',
        //   icon: 'credit-card',
        // },
        //   ]
        // },
        {
          title: 'Content Management',
          icon: 'layout',
          hasSubmenu: true,
          submenu: [
            {
              title: 'Banners',
              link: 'banners',
              icon: 'banner',
            },
            // {
            //   title: 'Badges',
            //   link: 'badges',
            //   icon: 'award',
            // },
            // {
            //   title: 'Badge Management',
            //   link: 'badgeManagement',
            //   icon: 'cog',
            // },
            // {
            //   title: 'Podcasts',
            //   link: 'podcasts',
            //   icon: 'podcast',
            // },
            // {
            //   title: 'Podcast Booking',
            //   link: 'podcastBooking',
            //   icon: 'calendar-check',
            // },  
          ]
        },


        {
          title: 'Complaints & Feedbacks',
          icon: 'file-earmark-text',
          hasSubmenu: true,
          submenu: [
            {
              title: 'Complaints',
              link: 'complaint',
              icon: 'question-circle',
            },
            {
              title: 'Feedbacks',
              link: 'feedback',
              icon: 'message-square',
            },
          ]
        },
        // {
        //   title: 'Expense',
        //   link: 'expense',
        //   icon: 'credit-card',
        // },
        // {
        //   title: 'Analytics',
        //   icon: 'bar-chart',
        //   hasSubmenu: true,
        //   submenu: [
        //     // {
        //     //   title: 'LeaderBoard',
        //     //   link: 'leaderboard',
        //     //   icon: 'award',
        //     // },
        //     {
        //       title: 'Analytics',
        //       link: 'analytics',
        //       icon: 'chart-bar',
        //     },
        //     {
        //       title: 'Attendance Data',
        //       link: 'attendanceRecord',
        //       icon: 'clipboard-list',
        //     },




        //   ]
        // // },{
        // // title:'Business Data',
        // // link:'LTPoints',
        // // icon:'history'
        // }
      ],
    },
  ];

  isMobile: boolean = false;
  activeSubMenuIndex: number | null = null;

  toggleSubMenu(index: number) {
    if (this.activeSubMenuIndex === index) {
      this.activeSubMenuIndex = null;
    } else {
      this.activeSubMenuIndex = index;
    }

  }

  navigateWithQueryParams(submenu: any) {
    this.router.navigate([submenu.link], { queryParams: submenu.queryParams });
  }

  onNavSwitch(item: string) {
    this.router.navigateByUrl(`/${item}`);
  }
}