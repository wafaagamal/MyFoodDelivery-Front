export const environment = {
  production: false,
  apiUrl: 'http://localhost:5002',
  restaurantApiUrl: 'http://localhost:5001',
  orderingApiUrl: 'http://localhost:5002',
  deliveryApiUrl: 'http://localhost:5003',
  customerApiUrl: 'http://localhost:5004',
  signalRUrl: 'http://localhost:5002/hubs',
  auth: {
    authority: 'http://localhost:5050',
    clientId: 'angular-customer-portal',
    redirectUri: 'http://localhost:4200/callback',
    scope: 'openid profile email roles myfooddelivery'
  }
};
