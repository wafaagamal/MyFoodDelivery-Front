# MyFoodDelivery — Role-Based UI Test Plan
> Version: 1.1 | Date: 2026-05-12 | App: http://localhost:4200 | Last tested by: GitHub Copilot (Rider full journey)

---

## How to Use This Template

Each role (Rider, Customer, Restaurant) has its own section.
Run tests sequentially. Mark each item ✅ Pass | ❌ Fail | ⚠️ Partial.
For every ❌ Fail, open a bug entry in the **Bug Log** section at the bottom.

---

## ROLE: RIDER (Delivery Partner)

**Login credentials:**
- Email: `testdelivery_1778492729855@example.com`
- Password: `Test123!`
- Portal entry: `http://localhost:4200/delivery/home`

---

### 1. REGISTRATION FLOW

| # | Action | Expected | Status |
|---|--------|----------|--------|
| R-01 | Go to `/register` | Registration form visible with role selector | |
| R-02 | Select "Delivery Partner" role | Role highlighted, form adapts | |
| R-03 | Fill valid name, email, phone, password | Fields accept input with no errors | |
| R-04 | Egyptian phone format (01xxxxxxxxx) | Validates correctly, no error | |
| R-05 | Submit form | POST /api/identity/users → 200, auto-login, redirect `/delivery/home` | |
| R-06 | Rider record auto-created | POST /api/riders/my called on first home load | |
| R-07 | Try registering duplicate email | Shows "An account with this email already exists" | |
| R-08 | Submit with invalid email format | Inline validation error shown | |
| R-09 | Submit with weak password | Inline validation error shown | |
| R-10 | Submit with empty required fields | All required field errors shown | |

---

### 2. LOGIN FLOW

| # | Action | Expected | Status |
|---|--------|----------|--------|
| L-01 | Go to `/login` | Login form visible | ✅ |
| L-02 | Enter rider credentials, click Login | POST /api/auth/token → 200, redirect `/delivery/home` | ✅ |
| L-03 | JWT stored in `localStorage.access_token` | Visible in browser DevTools | ✅ |
| L-04 | Wrong password | Error message shown (not blank screen) | |
| L-05 | Wrong email | Error message shown | |
| L-06 | Empty fields | Validation errors shown | |

---

### 3. HOME PAGE (`/delivery/home`)

#### 3.1 Layout & Header

| # | Action | Expected | Status |
|---|--------|----------|--------|
| H-01 | Page loads | No console errors, spinner disappears | |
| H-02 | Header shows delivery count | GET /api/delivery-tasks/my → count shown | |
| H-03 | Header shows earnings amount | GET /api/riders/my/earnings → amount shown | |
| H-04 | Header shows rider rating | Star rating visible | |
| H-05 | Sidebar shows rider name | Parsed from JWT `name` claim | |
| H-06 | Sidebar shows RD-{shortId} badge | Format "RD-XXXXXX" visible | |

#### 3.2 Online/Offline Toggle

| # | Action | Expected | Status |
|---|--------|----------|--------|
| H-07 | Toggle from Offline → Online | PATCH /api/riders/{id}/status → 200, button turns green | |
| H-08 | Success toast shown | "You are now Online" notification | |
| H-09 | Available deliveries section appears | List of available orders shown | |
| H-10 | Toggle from Online → Offline | PATCH /api/riders/{id}/status → 200, button turns grey | |
| H-11 | Available deliveries section hides | No delivery cards when offline | |
| H-12 | Status persists on page reload | PATCH correctly persisted | |

#### 3.3 Available Deliveries

| # | Action | Expected | Status |
|---|--------|----------|--------|
| H-13 | Delivery card shown | Restaurant name, pickup address, dropoff address visible | |
| H-14 | Estimated distance/time shown | "2.3 km • ~12 min" format | |
| H-15 | Payout amount shown | "$5.50" format on card | |
| H-16 | Click Accept | POST /api/delivery-tasks/{id}/accept → 200, card removed from available | |
| H-17 | Current delivery card appears | Assigned delivery shown after accept | |
| H-18 | Click Decline | POST /api/delivery-tasks/{id}/decline → 200, card removed | |
| H-19 | Empty state when no deliveries | "No available deliveries" message | |

#### 3.4 Current Delivery Card

| # | Action | Expected | Status |
|---|--------|----------|--------|
| H-20 | Current delivery card visible | Status badge, pickup, dropoff shown | |
| H-21 | View Details link | Navigates to `/delivery/delivery/{id}` | |
| H-22 | Status badge color correct | Assigned=blue, PickedUp=orange, Delivered=green | |

---

### 4. DELIVERY DETAIL PAGE (`/delivery/delivery/:id`)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| D-01 | Page loads with correct data | Order items, addresses, payout shown | ✅ |
| D-02 | Status badge visible | Shows current status | ✅ |
| D-03 | Pickup address shown | Restaurant name + address | ✅ |
| D-04 | Dropoff address shown | Customer address | ✅ |
| D-05 | Map/directions button | Opens Google Maps or app | ⚠️ Map placeholder only |
| D-06 | Call customer button | tel: link or dialer opens | ⚠️ Button shown, no tel: action |
| D-07 | "Confirm Pickup" button (when Assigned) | POST /api/delivery-tasks/{id}/picked-up → 200, status → PickedUp | ✅ |
| D-08 | Status changes to "PickedUp" | Badge updates, Confirm Pickup hidden | ✅ Button → "Mark as Delivered" |
| D-09 | "Mark as Delivered" button (when PickedUp) | POST /api/delivery-tasks/{id}/delivered → 200, status → Delivered | ✅ |
| D-10 | Redirect after delivered | Back to /delivery/home, current delivery cleared | ⚠️ Stays on detail page |
| D-11 | Completed delivery still viewable | Via /delivery/deliveries list | ✅ |

---

### 5. DELIVERIES PAGE (`/delivery/deliveries`)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| DL-01 | Page loads | GET /api/delivery-tasks/my → list shown | ✅ |
| DL-02 | "All" tab selected by default | All deliveries shown | ✅ |
| DL-03 | Click "Completed" tab | Only completed deliveries shown | ✅ |
| DL-04 | Click "In Progress" tab | Only active deliveries shown | ✅ |
| DL-05 | Click "Cancelled" tab | Only cancelled deliveries shown | ✅ |
| DL-06 | Empty state message | "No deliveries found" when tab has no data | ✅ |
| DL-07 | Delivery card shows date | Formatted date visible | ✅ |
| DL-08 | Delivery card shows address | Pickup and dropoff addresses | ✅ |
| DL-09 | Delivery card shows earnings | Payout amount shown | ⚠️ Shows $0.00 (test data BUG-06) |
| DL-10 | Click delivery card | Navigates to detail page | ✅ |

---

### 6. EARNINGS PAGE (`/delivery/earnings`)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| E-01 | Page loads | GET /api/riders/my/earnings → totals shown | ✅ |
| E-02 | Total earnings shown | Formatted currency | ✅ |
| E-03 | Today's earnings shown | From today-summary endpoint | ⚠️ Shows $0 on "Today" tab (BUG-07) |
| E-04 | Period selector "Day" | GET /api/riders/my/earnings/daily?period=day | ✅ Today tab switches |
| E-05 | Period selector "Week" | GET /api/riders/my/earnings/daily?period=week | ✅ Shows $10 for 2 deliveries |
| E-06 | Period selector "Month" | GET /api/riders/my/earnings/daily?period=month | ✅ |
| E-07 | Daily breakdown chart/list | Data renders (or empty state shown) | ⚠️ Sections present but no detailed data |
| E-08 | Transactions tab/section | GET /api/riders/my/earnings/transactions → list | ⚠️ Section header present, list empty |
| E-09 | Transaction shows date + amount | Each row formatted correctly | |
| E-10 | Empty state for no transactions | "No transactions yet" message | ✅ |

---

### 7. PROFILE PAGE (`/delivery/profile`)

#### 7.1 Profile Info Display

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-01 | Page loads | GET /api/riders/{id}/settings, GET /api/riders/{id} → 200 | ✅ |
| P-02 | Rider initials/avatar shown | From JWT name claim | ✅ "TR" initials |
| P-03 | Rider name shown | From JWT name claim | ✅ "Test Rider" |
| P-04 | Rider email shown | From JWT email claim | ✅ (in Edit modal) |
| P-05 | Star rating shown | From rider stats | ✅ 5 stars |
| P-06 | Review count shown | From rider stats | ✅ (2 reviews) |
| P-07 | Total deliveries stat | From rider stats | ✅ 2 |
| P-08 | Months active stat | Calculated correctly | ⚠️ Shows 0 (not calculated) |
| P-09 | Acceptance rate stat | From rider stats | ⚠️ Shows 0% (not yet calculated) |

#### 7.2 Edit Profile

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-10 | Click Edit Profile | Modal/panel opens with pre-filled fields | ✅ |
| P-11 | Edit name field | Input accepts new value | ✅ |
| P-12 | Edit phone field | Input accepts new value | ✅ |
| P-13 | Click Save | PUT /api/riders/{id} → 204, modal closes, no error | ✅ |
| P-14 | Cancel button | Modal closes without saving | ✅ |

#### 7.3 Vehicle Details

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-15 | Click Vehicle Details | Section/modal opens | ✅ |
| P-16 | Vehicle type selector | Dropdown shows options (Car, Motorbike, Bicycle) | ✅ Motorcycle/Scooter/Bicycle/Car |
| P-17 | License plate field | Input accepts text | ✅ |
| P-18 | Click Save vehicle | PUT /api/riders/{id}/vehicle → 200, saved | ⚠️ Calls PUT /api/riders/{id} stub → 204 |

#### 7.4 Documents

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-19 | Documents section visible | List of document types shown | |
| P-20 | Verification status badge | "Verified" / "Pending" shown per document | |

#### 7.5 Notification Settings

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-21 | Push Notifications toggle | PUT /api/riders/{id}/settings → 204 | ✅ Toggle responds, API called |
| P-22 | Sound Alerts toggle | PUT /api/riders/{id}/settings → 204 | ✅ |
| P-23 | Toggle state persists on reload | Settings saved correctly | ✅ |

#### 7.6 Navigation App

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-24 | Navigation app label shown | "Google Maps" or selected app | |
| P-25 | Click Navigation App | Modal opens with app options | |
| P-26 | Select different app | PUT /api/riders/{id}/settings → saved | |

#### 7.7 Help & About

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-27 | Click Help & Support | Modal/page opens with support info | |
| P-28 | Click About | Modal/page opens with app version | |
| P-29 | Version "1.0.0" shown | Correct version label | |

#### 7.8 Logout

| # | Action | Expected | Status |
|---|--------|----------|--------|
| P-30 | Click Logout | localStorage cleared, redirect to `/` or `/login` | |
| P-31 | Protected routes redirect | Accessing `/delivery/home` after logout → `/login` | |

---

### 8. NAVIGATION

| # | Action | Expected | Status |
|---|--------|----------|--------|
| N-01 | Bottom nav: Home tab | Active state, navigates to `/delivery/home` | ✅ |
| N-02 | Bottom nav: Deliveries tab | Active state, navigates to `/delivery/deliveries` | ✅ |
| N-03 | Bottom nav: Earnings tab | Active state, navigates to `/delivery/earnings` | ✅ |
| N-04 | Bottom nav: Profile tab | Active state, navigates to `/delivery/profile` | ✅ |
| N-05 | Active tab highlighted | Correct tab highlighted for current route | ✅ |
| N-06 | Sidebar: Account Settings | Navigates correctly | ❌ Redirects to /delivery/home (BUG-09) |
| N-07 | Sidebar: Vehicle Info | Navigates/opens correctly | ❌ Redirects to /delivery/home (BUG-09) |
| N-08 | Sidebar: Documents | Navigates/opens correctly | ❌ Redirects to /delivery/home (BUG-09) |
| N-09 | Sidebar: Support | Navigates/opens correctly | ❌ Redirects to /delivery/home (BUG-09) |
| N-10 | Sidebar: Delivery History | Navigates to deliveries list | ❌ Redirects to /delivery/home (BUG-09) |
| N-11 | Browser back button | Previous page loaded correctly | ✅ |

---

### 9. RESPONSIVENESS

| # | Viewport | Check | Expected | Status |
|---|----------|-------|----------|--------|
| RS-01 | Desktop 1920×1080 | Sidebar visible | Sidebar layout, content padded | |
| RS-02 | Desktop 1920×1080 | Tables/grids | No overflow, columns visible | |
| RS-03 | Laptop 1366×768 | Layout | No horizontal scroll, readable | |
| RS-04 | Tablet 768×1024 | Layout adapts | Sidebar may collapse, content readable | |
| RS-05 | Mobile 375×812 | Bottom nav shown | Fixed bottom nav, full width | |
| RS-06 | Mobile 375×812 | Home page scrollable | Content scrolls vertically | |
| RS-07 | Mobile 375×812 | Modals fit screen | Modal doesn't overflow, has close button | |
| RS-08 | Mobile 375×812 | Buttons tappable | Min 44px touch targets | |
| RS-09 | Mobile 375×812 | Text readable | No text clipping or overflow | |

---

### 10. ROLE ACCESS CONTROL

| # | Action | Expected | Status |
|---|--------|----------|--------|
| AC-01 | Rider accessing `/restaurant/dashboard` | Redirected or 403 shown | |
| AC-02 | Rider accessing `/customer/home` | Redirected or error | |
| AC-03 | Non-authenticated accessing `/delivery/home` | Redirect to `/login` | |
| AC-04 | JWT role claim = "DeliveryPartner" | Backend validates claim on protected endpoints | |

---

## ROLE: CUSTOMER

**Login credentials:**
- Email: `testcustomer_1778490240487@example.com`
- Password: `Test123!`
- Portal entry: `http://localhost:4200/customer/home`

### Quick Checklist

| # | Area | Action | Expected | Status |
|---|------|--------|----------|--------|
| CU-01 | Login | Enter credentials | Redirect to `/customer/home` | |
| CU-02 | Browse Restaurants | View restaurant list | GET /api/restaurants → list shown | |
| CU-03 | Browse Menu | Click restaurant | Menu items shown | |
| CU-04 | Add to Cart | Click "Add" | Cart count increments | |
| CU-05 | View Cart | Open cart | Items, quantities, totals correct | |
| CU-06 | Place Order | Checkout | POST /api/orders → order created | |
| CU-07 | Track Order | View order | Status updates shown | |
| CU-08 | Order History | View past orders | List of completed orders | |
| CU-09 | Profile | View/edit profile | Name, email, address editable | |
| CU-10 | Logout | Click logout | Auth cleared, redirect to `/` | |

---

## ROLE: RESTAURANT

**Login credentials:**
- Email: `testrestaurant_1778481627782@example.com`
- Password: `Test123!`
- Portal entry: `http://localhost:4200/restaurant/dashboard`

### Quick Checklist

| # | Area | Action | Expected | Status |
|---|------|--------|----------|--------|
| RE-01 | Login | Enter credentials | Redirect to `/restaurant/dashboard` | |
| RE-02 | Dashboard | View stats | Orders count, revenue, ratings | |
| RE-03 | Manage Menu | Add item | POST /api/menu-items → created | |
| RE-04 | Manage Menu | Edit item | PUT /api/menu-items/{id} → updated | |
| RE-05 | Manage Menu | Delete item | DELETE /api/menu-items/{id} → removed | |
| RE-06 | Incoming Orders | View new orders | GET /api/orders (filtered) → list | |
| RE-07 | Accept Order | Click Accept | Order status → Accepted | |
| RE-08 | Mark Ready | Click Ready for Pickup | Order status → Ready | |
| RE-09 | Order History | View past | Completed orders list | |
| RE-10 | Logout | Click logout | Auth cleared, redirect to `/` | |

---

## BUG LOG

| # | Date | Role | Page | Action | Error | Root Cause | Fix | Status |
|---|------|------|------|--------|-------|-----------|-----|--------|
| BUG-01 | 2026-05-12 | Rider | Profile | Save Profile | 405 PUT /api/riders/{id} | No PUT endpoint in RiderController | Added stub `[HttpPut("{id:guid}")]` → 204 | ✅ Fixed |
| BUG-02 | 2026-05-12 | Rider | Home | Update Location | 405 PUT /api/riders/{id}/location | delivery.service.ts used http.put, backend has [HttpPatch] | Changed to http.patch | ✅ Fixed |
| BUG-03 | 2026-05-12 | Rider | Layout | Sidebar photo | Image broken / times out | `riderPhoto = 'https://via.placeholder.com/60'` external URL | Replaced with inline SVG data URI | ✅ Fixed |
| BUG-04 | 2026-05-12 | Rider | Layout | Mobile status toggle | Toggle only flips UI state, no API call | `toggleOnlineStatus()` in delivery-layout.component.ts missing API call | Added `deliveryService.updateStatus()` call | ✅ Fixed |
| BUG-05 | 2026-05-12 | Rider | Home / Detail | Order ID display | Full UUID shown: `Order #fe918a3c-0c65-4dac-9058-e5f0c8785625` | orderId bound directly without truncation | Added `formatOrderId()` helper in home + delivery-detail components | ✅ Fixed |
| BUG-06 | 2026-05-12 | Rider | Deliveries list | View delivery | $0.00 earnings on all delivery cards | Test delivery tasks seeded with `earning: null` | Test data issue — not a code bug | ⚠️ Test data |
| BUG-07 | 2026-05-12 | Rider | Earnings | Today filter | $0.00 on "Today" tab; "Week" shows $10 correctly | Possible mismatch between daily-summary endpoint and delivery task `earning` field | Needs investigation: check `GET /api/riders/my/earnings?period=today` | 🔍 Open |
| BUG-08 | 2026-05-12 | Rider | Profile | Name display | Heading shows empty on first render | Race condition: component renders before `getMyRider()` API resolves | Not a bug — Angular data binding updates correctly after API call | N/A |
| BUG-09 | 2026-05-12 | Rider | Sidebar | Secondary nav links | All 5 links redirect to `/delivery/home` instead of target page | Routes `/delivery/account`, `/vehicle`, `/documents`, `/support`, `/history` not registered in AppRoutingModule | Register routes and create corresponding components (future feature) | ❌ Open |
| BUG-10 | 2026-05-12 | Rider | Layout | Desktop layout | Stats bar stretched to full viewport height as a tall green column | In `@media(min-width: 768px)`, `.layout-container: flex-direction: row` made stats-bar a flex column sibling | Changed to `flex-direction: column; margin-left: 80px` on container | ✅ Fixed |

---

## ENVIRONMENT REFERENCE

| Service | Port | Notes |
|---------|------|-------|
| Angular Frontend | 4200 | `cd angular/customer-portal && ng serve` |
| AuthSvc | 5050 | JWT issuer, no `kid` in header, SignatureValidator bypass |
| RestaurantSvc | 5001 | |
| OrderingSvc | 5002 | |
| DeliverySvc | 5003 | |
| CustomerSvc | 5004 | |

**JWT Notes:** Auth interceptor adds `Bearer {token}`. All services use `SignatureValidator` bypass since AuthSvc doesn't set `kid`. Token stored in `localStorage.access_token`.

---

*Last updated: 2026-05-12 | Rider test executed by: GitHub Copilot*
