const routes = {
  notificationCounter: '/api/notification-counter/:userId',
  markAsRead: '/api/mark-notifications-as-read/:userId',
  markAsReadByType: '/api/mark-notifications-as-read-by-type/:userId/:type',
  markAsUnRead: '/api/mark-notifications-as-unread/:userId',
  delete: '/api/delete-notifications/:userId',
  getNotifications: '/api/notifications/:userId/:page/:size',
}

export default routes
