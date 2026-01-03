import { Referral } from './../../services/auth.service';
import { environment } from '../../../env/env.local';

class ApiEndpoints {
  public PATH: string = `${environment.baseURL}/${environment.route}`;
  private PATH1: string = `${environment.baseURL}`;

  // User Management
  public GET_USERS: string = `${this.PATH}/get-all-members`;
  public UPDATE_USER_STATUS: string = `${this.PATH}/isActiveStatus`;
  public UPDATE_USER: string = `${this.PATH}/updateUser`;
  public DELETE_USER: string = `${this.PATH}/users/delete`;
  public GET_ALL_APPLICATIONS: string = `${this.PATH1}/users/applications`
  public GET_ALL_APPLICATIONS1: string = `${this.PATH1}/users/getActiveApplications1`
  public EDIT_APPLICATION: string = `${this.PATH1}/users/editApplication`
  public GET_ALL_EVENT_REGISTRATIONS: string = `${this.PATH1}/users/getEventRegistrations`

  public GET_USER_DETAILS: string = `${this.PATH}/details`;
  public GET_ALL_COUNTRIES: string = `${this.PATH}/getAllCountries`
  public CREATE_COUNTRY: string = `${this.PATH}/createCountry`
  public DELETE_COUNTRY: string = `${this.PATH}/deleteCountry`
  public GET_COUNTRY_BY_ID: string = `${this.PATH}/getCountryById`
  public UPDATE_COUNTRY: string = `${this.PATH}/updateCountry`
  public CONVERT_TO_USER: string = `${this.PATH}/convert-to-user`
  public GET_OTP: string = `${this.PATH}/getOtpRecords`

  public GET_ANALYTICS_BY_DATE_RANGE = `${this.PATH}/getAnalyticsByDateRange`

  public GET_ALL_STATES: string = `${this.PATH}/getAllStates`
  public CREATE_STATE: string = `${this.PATH}/createState`
  public DELETE_STATE: string = `${this.PATH}/deleteState`
  public GET_STATE_BY_ID: string = `${this.PATH}/getStateById`
  public UPDATE_STATE: string = `${this.PATH}/updateState`
  public IMPORT_USERS: string = `${this.PATH}/import`;
  public PREVIEW_EXCEL_FILE: string = `${this.PATH}/previewExcelFile`;
  public IMPORT_USER_REGISTRATIONS: string = `${this.PATH}/importUserRegistrations`;

  public GET_DASHBOARD_COUNTS: string = `${this.PATH}/getdata/counts`;
  public FORGOT_PASSWORD: string = `${this.PATH}/forgotPassword`;
  public UPDATE_PASSWORD: string = `${this.PATH}/VerifyCode`;



  public GET_ALL_EVENTS: string = `${this.PATH}/getAllEvents`
  public CREATE_EVENT: string = `${this.PATH}/createEvent`


  public DELETE_EVENT: string = `${this.PATH}/deleteEvent`

  public ADD_PHOTOS_TO_EVENT: string = `${this.PATH}/events`

  public ADD_VIDEOS_TO_EVENT: string = `${this.PATH}/events`
  public GET_EVENT_GALLERY: string = `${this.PATH}/getEventGallery`
  public GET_ALL_PARTICIPANTS: string = `${this.PATH}/getAllParticipant`




  public UPDATE_EVENT: string = `${this.PATH}/updateEvent`
  public GET_ALL_ATTENDANCE: string = `${this.PATH}/getAllAttendance`



  public DELETE_ATTENDANCE: string = `${this.PATH}/deleteAttendance/:attendanceId`

  public CREATE_CHAPTER: string = `${this.PATH}/createChapter`
  public UPDATE_CHAPTER: string = `${this.PATH}/updateChapter`
  public GET_CHAPTER_BY_ID: string = `${this.PATH}/getChapterById`
  public DELETE_CHAPTER: string = `${this.PATH}/deleteChapter`
  public GET_ALL_CHAPTERS: string = `${this.PATH}/getChapters`

  public CREATE_CATEGORY: string = `${this.PATH}/createCategory`
  public GET_CATEGORIES: string = `${this.PATH}/getCategories`
  public UPDATE_CATEGORY: string = `${this.PATH}/updateCategory`
  public DELETE_CATEGORY: string = `${this.PATH}/deleteCategory`
  public GET_CATEGORY_BY_ID: string = `${this.PATH}/getCategoryById`
  public CREATE_CITY: string = `${this.PATH}/createCity`
  public GET_ALL_CITIES: string = `${this.PATH}/getCities`
  public GET_CITY_BY_ID: string = `${this.PATH}/getCityById`
  public UPDATE_CITY: string = `${this.PATH}/updateCity`
  public DELETE_CITY: string = `${this.PATH}/deleteCity`

  public CREATE_LEADERBOARD: string = `${this.PATH}/createLeaderboard`
  public GET_ALL_LEADERBOARDS: string = `${this.PATH}/getAllLeaderboards`
  public GET_LEADERBOARD_BY_ID: string = `${this.PATH}/getLeaderboardById`
  public UPDATE_LEADERBOARD: string = `${this.PATH}/updateLeaderboard`
  public DELETE_LEADERBOARD: string = `${this.PATH}/deleteLeaderboard`
  public GET_ALL_REFERRALS: string = `${this.PATH}/referrals/`
  public GET_ALL_TESTIMONIALS: string = `${this.PATH}/testimonials/`
  public GET_ALL_REFERRALS_RECIEVED: string = `${this.PATH}/referrals/received`

  public GET_ALL_ONE_TO_ONE: string = `${this.PATH}/oneToOnes/getAllOneToOne`
  public GET_ALL_TYFCBS: string = `${this.PATH}/getAllTyfcb`
  public GET_ALL_VISITORS: string = `${this.PATH}/getAllVisitors`
  public UPDATE_VISITOR: string = `${this.PATH}/updateVisitor`
  public REFERRAL_RECEIVED: string = `${this.PATH}/referrals/received`
  public REFERRAL_GIVEN: string = `${this.PATH}/referrals/given`
  public GET_CHAPTER_BY_CITY: string = `${this.PATH}/getChapterByCity`
  public DELETE_SUBCATEGORY: string = `${this.PATH}/deleteSubCategory`
  public GET_SUBCATEGORIES: string = `${this.PATH}/getSubCategories`
  public CREATE_SUBCATEGORY: string = `${this.PATH}/createSubCategory`
  public UPDATE_SUBCATEGORY: string = `${this.PATH}/updateSubCategory`
  public UPDATE_FEE: string = `${this.PATH}/Feeupdate`
  public GET_ALL_USERS_FEE: string = `${this.PATH}/getAllFeesUsers`



  public TOGGLE_USER_STATUS: string = `${this.PATH}/isActiveStatus`


  public REGISTER_USER: string = `${this.PATH1}/admin/register`


  public GET_ATTENDANCE_RECORDS: string = `${this.PATH}/getAttendanceRecords`

  public GET_POINT_HISTORY: string = `${this.PATH}/getPointsHistory`

  public ADMIN_LOGIN: string = `${this.PATH}/login`

  public GET_EVENTS_BY_CHAPTER: string = `${this.PATH}/getEventByChapter`

  public TOGGLE_ATTENDANCE_STATUS: string = `${this.PATH}/toggleAttendanceStatus`
  public TOGGLE_VISITOR_ATTENDANCE: string = `${this.PATH}/toggleVisitorAttendance`
  public GET_COUNTS_BY_CHAPTER: string = `${this.PATH}/getCountsByChapter`


  public GET_ALL_BANNER: string = `${this.PATH}/getAllBanner`
  public BANNER_CREATE: string = `${this.PATH}/bannerCreate`
  public BANNER_UPDATE: string = `${this.PATH}/bannerUpdate`
  public GET_BANNER_BY_ID: string = `${this.PATH}/banners`
  public DELETE_BANNER: string = `${this.PATH}/bannerdelete`

  public GET_ALL_BADGES: string = `${this.PATH}/getAllBadges`
  public CREATE_BADGE: string = `${this.PATH}/createBadge`
  public UPDATE_BADGE: string = `${this.PATH}/updateBadges`
  public DELETE_BADGE: string = `${this.PATH}/deleteBadge`
  public GET_ALL_USERS_BADGES = `${this.PATH}/getAllBadgesUsers`
  public ASSIGN_BADGE: string = `${this.PATH}/assignBadge`
  public UNASSIGN_BADGE: string = `${this.PATH}/unassignBadge`
  public GET_ALL_POINTS_HISTORY: string = `${this.PATH}/getAllPointsHistory`
  public CREATE_PODCAST: string = `${this.PATH}/createPodcast`


  public GET_ALL_ASK: string = `${this.PATH1}/mobile/getAllAsksForAdmin`
  public CREATE_VISITOR: string = `${this.PATH}/createVisitor`
  public USER_BY_CHAPTER: string = `${this.PATH}/userListByParticularChapter`
  public SEND_NOTIFICATION_T0_USER = `${this.PATH}/sendNotificationToUser`



  public GET_All_PODCAST = `${this.PATH}/getAllPodcasts`
  public UPDATE_PODCAST = `${this.PATH}/updatePodcast`
  public DELETE_PODCAST = `${this.PATH}/deletePodcast`

  public BOOKING_BY_PODCASTID = `${this.PATH}/bookingByPodcastId`
  public STATUS_UPDATE_BOOKING = `${this.PATH}/statusUpdateBooking`


  public SLOT_BY_PODCASTID = `${this.PATH}/getSlotByPodcastId`
  public GENERATE_SLOTS = `${this.PATH}/generateslots`
  public DELETE_SLOT = `${this.PATH}/deleteSlot`
  public BULK_DELETE_SLOTS = `${this.PATH}/bulkDeleteSlots`



  public ADD_COLLECTION = `${this.PATH}/addCollection`
  public GET_COLLECTION_HISTORY = `${this.PATH}/getCollectionHistory`
  public REMOVE_LAST_COLLECTION = `${this.PATH}/removeLastCollection`
  public ADD_EXPENSE = `${this.PATH}/add-expense`
  public UPDATE_EXPENSE = `${this.PATH}/update-expense`
  public DELETE_EXPENSE = `${this.PATH}/delete-expense`
  public GET_EXPENSE_BY_ID = `${this.PATH}/getExpenseById`
  public GET_CHAPTER_FINANCE_SUMMARY = `${this.PATH}/getChapterFinanceSummary`


  //complaints and feedbacks
  public GET_ALL_COMPLAINTS = `${this.PATH}/getComplaints`
  public GET_ALL_FEEDBACKS = `${this.PATH}/getFeedbacks`
  public UPDATE_COMPLAINT_STATUS = `${this.PATH}/updateComplaintStatus`
  public UPDATE_FEEDBACK_STATUS = `${this.PATH}/updateFeedbackStatus`
  public DELETE_COMPLAINT = `${this.PATH}/deleteComplaint`
  public DELETE_FEEDBACK = `${this.PATH}/deleteFeedback`
  public GET_ALL_REGIONS = `${this.PATH}/getAllRegions`
  public CREATE_REGION = `${this.PATH}/createRegion`

  public UPDATE_REGION = `${this.PATH}/updateRegion`
  public GET_REGION_BY_ID = `${this.PATH}/getRegion`
  public DELETE_REGION = `${this.PATH}/deleteRegion`


  public GET_BANNER_RATES = `${this.PATH}/getRates`
  public CREATE_BANNER_RATES = `${this.PATH}/createRates`
  public UPDATE_BANNER_RATES = `${this.PATH}/updateRates`
  public DELETE_BANNER_RATES = `${this.PATH}/deleteRates`

  public CREATE_COMPLAINT = `${this.PATH}/createComplaint`
  public CREATE_FEEDBACK = `${this.PATH}/createFeedback`

  //newUserRegistation

  public NEW_USER_REGISTRATION = `${this.PATH}/update-register-user`
  public GET_ALL_NEW_USER_REGISTRATION = `${this.PATH}/users`
  public ADD_USER_TO_MEMBER = `${this.PATH}/add-to-member`

  //events 
  public NEW_GET_EVENTS = `${this.PATH}/event/list`;
  public NEW_GET_EVENT_BY_ID = `${this.PATH}/event/get`;
  public NEW_CREATE_EVENT = `${this.PATH}/event/create`;
  public NEW_UPDATE_EVENT = `${this.PATH}/event/update`;
  public NEW_DELETE_EVENT = `${this.PATH}/event/delete`;

  // Stall booking endpoints
  public BOOK_STALL = `${this.PATH}/bookStall`;
  public APPROVE_STALL_BOOKING = `${this.PATH}/approveStallBooking`;
  public GET_EVENT_STALL_BOOKINGS = `${this.PATH}/getEventStallBookings`;



  public GET_PAYMENT_DETAILS = `${this.PATH}/event/payment-details/event/:eventId`
  public CREATE_OR_UPDATE_PAYMENT = `${this.PATH}/event/payment-details`
  public DELETE_PAYMENT_DETAILS = `${this.PATH}/deletePaymentDetails`

  public UPDATE_EVENT_GALLERY = `${this.PATH}/event/gallery`
  public NEW_GET_EVENT_GALLERY = `${this.PATH}/events/gallery`;
  public UPLOAD_GALLERY_ITEM = `${this.PATH}/events/upload-gallery`;
  public DELETE_GALLERY_ITEM = `${this.PATH}/events/delete-gallery-item`;
  public UPDATE_GALLERY_ITEM = `${this.PATH}/events/update-gallery-item`;
  public REGISTER_USERS = `${this.PATH}/update-register-user`;


  public CREATE_PHOTO_CATEGORY = `${this.PATH}/category-photos`;

  public UPDATE_PAYMENT_STATUS = `${this.PATH1}/mobile/updatePaymentStatus`
  public GET_REGISTRATIONS_BY_EVENT_ID = `${this.PATH1}/mobile/getRegistrationsByEventId`
  public UPDATE_REGISTRATION_STATUS = `${this.PATH1}/admin/registerationStatusUpdate`


  GET_ALL_CATEGORIES = `${this.PATH}/category-photos/list`;
  UPDATE_PHOTO_CATEGORY = `${this.PATH}/category-photos`; // append /:id
  GET_PHOTO_CATEGORY_BY_ID = `${this.PATH}/category-photos`; // append /:id
  DELETE_PHOTO_CATEGORY = `${this.PATH}/category-photos`; // append /:id
  REMOVE_IMAGE = `${this.PATH}/category-photos`;



  public UPDATE_BANNER_REQUEST_STATUS = `${this.PATH1}/mobile/updateBannerRequestStatus`;
  public GET_BANNER_REQUESTS = `${this.PATH1}/mobile/getBannerRequests`;

  // Travel Ask Management
  public GET_ALL_ASKS = `${this.PATH1}/mobile/getAllAsks`;
  public GET_ASK_DETAIL = `${this.PATH1}/mobile/getAskDetail`;

  // Travel Lead Management
  public GET_ALL_LEADS = `${this.PATH1}/mobile/getAllLeads`;
  public GET_LEAD_DETAIL = `${this.PATH1}/mobile/getLeadDetail`;
  public APPROVE_LEAD = `${this.PATH1}/mobile/approveLeadByAdmin`;
  public REJECT_LEAD = `${this.PATH1}/admin/rejectLead`;


  // Coupon Management
  public CREATE_COUPON = `${this.PATH1}/admin/createCoupon`;
  public UPDATE_COUPON = `${this.PATH1}/admin/updateCoupon/:id`;
  public GET_COUPONS = `${this.PATH1}/admin/getCoupons`;
  public GET_COUPON_BY_ID = `${this.PATH1}/admin/coupon/:couponId`;
  public DELETE_COUPON = `${this.PATH1}/admin/deleteCoupon/:couponId`;

  // DMC List Management
  public GET_DMC_LISTS = `${this.PATH}/dmc/list`;
  public CREATE_DMC_LIST = `${this.PATH}/dmc/create`;
  public UPDATE_DMC_LIST = `${this.PATH}/dmc/update`;
  public DELETE_DMC_LIST = `${this.PATH}/dmc/delete`;

  // ReportsEndpoints
  public GET_REGISTRATION_REPORT: string = `${this.PATH}/event/reports/registration`;
  public GET_PAYMENT_REPORT: string = `${this.PATH}/event/reports/payment`;
  public GET_STALL_REPORT: string = `${this.PATH}/event/reports/stalls`;
  public GET_ONE_TO_ONE_REPORT: string = `${this.PATH}/event/reports/one-to-one`;

  //review
  public GET_REVIEW_LIST: string = `${this.PATH1}/mobile/event/list`;
};

export let apiEndpoints = new ApiEndpoints();



