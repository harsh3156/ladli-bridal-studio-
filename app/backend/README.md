# 🌸 Ladli Bridal Studio — Backend API

Production-ready MERN backend for a luxury bridal & beauty salon. Built with Node.js, Express, MongoDB Atlas, Socket.io, and more.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB Atlas connection
│   │   ├── cloudinary.js        # Cloudinary + Multer config
│   │   └── swagger.js           # OpenAPI 3.0 docs config
│   ├── controllers/
│   │   ├── authController.js        # Login, logout, JWT, reset password
│   │   ├── userController.js        # Admin user CRUD
│   │   ├── appointmentController.js # Booking with email + WhatsApp
│   │   ├── serviceController.js     # Beauty services catalogue
│   │   ├── galleryController.js     # Image gallery + bulk upload
│   │   ├── miscControllers.js       # Team, Testimonials, Reviews, Contact
│   │   └── dashboardController.js   # Analytics & KPIs
│   ├── models/
│   │   ├── User.js              # Roles: super_admin, manager, staff
│   │   ├── Appointment.js       # Bookings with soft delete
│   │   ├── Service.js           # Service catalogue
│   │   ├── Gallery.js           # Before/after image gallery
│   │   ├── Team.js              # Staff profiles
│   │   ├── Testimonial.js       # Customer testimonials
│   │   ├── Review.js            # Multi-source reviews
│   │   └── ContactMessage.js    # Enquiry messages
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── appointmentRoutes.js
│   │   └── miscRoutes.js        # Gallery, Team, Testimonials, Reviews, Contact, Dashboard
│   ├── middleware/
│   │   ├── auth.js              # JWT protect + role-based access
│   │   ├── errorHandler.js      # Global error handler + AppError class
│   │   ├── rateLimiter.js       # Multiple rate limit profiles
│   │   └── validate.js          # express-validator result handler
│   ├── validators/
│   │   └── index.js             # All validation rule chains
│   ├── services/                # (extend here: payment, SMS, etc.)
│   ├── sockets/
│   │   └── socketHandler.js     # Real-time admin notifications
│   ├── jobs/
│   │   └── appointmentJobs.js   # Cron: reminders + no-show marking
│   ├── utils/
│   │   ├── logger.js            # Winston + daily rotating logs
│   │   ├── apiResponse.js       # Standardized response helpers
│   │   ├── jwt.js               # Token generation & cookie helpers
│   │   ├── emailService.js      # Nodemailer + branded email templates
│   │   ├── whatsappService.js   # Twilio WhatsApp notifications
│   │   └── seeder.js            # Database seed / destroy script
│   └── app.js                   # Express app (middleware, routes)
├── server.js                    # HTTP server + Socket.io entry point
├── .env                         # Environment variables (DO NOT COMMIT)
├── .env.example                 # Template for env vars
├── .gitignore
├── package.json
├── Dockerfile                   # Multi-stage production Docker build
├── docker-compose.yml           # Full stack: API + MongoDB + Nginx
└── docker/
    ├── nginx.conf               # Reverse proxy + SSL + rate limiting
    └── mongo-init.js            # MongoDB init script for Docker
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Gmail account (or SMTP)
- Twilio account (for WhatsApp — optional)

### 1. Clone & Install

```bash
git clone <repo-url> ladli-backend
cd ladli-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Seed Database

```bash
npm run seed
```

This creates:
- Super Admin: `admin@ladlibridalstudio.com` / `Admin@123456`
- Manager: `manager@ladlibridalstudio.com` / `Manager@123456`
- Staff: `staff@ladlibridalstudio.com` / `Staff@123456`
- 8 sample services, 4 testimonials, 3 team members

### 4. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:5000`

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`

### 🔐 Auth — `/api/v1/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/login` | Public | Admin login → returns JWT tokens |
| POST | `/logout` | Private | Invalidate session |
| POST | `/refresh-token` | Public | Get new access token |
| GET | `/me` | Private | Get own profile |
| PUT | `/update-profile` | Private | Update name / phone |
| PUT | `/change-password` | Private | Change password |
| POST | `/forgot-password` | Public | Send reset email |
| POST | `/reset-password/:token` | Public | Reset with token |

### 👤 Users — `/api/v1/users`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | List users (search, filter, paginate) |
| POST | `/` | Super Admin | Create admin user |
| GET | `/:id` | Admin | Get user by ID |
| PUT | `/:id` | Admin | Update user |
| DELETE | `/:id` | Super Admin | Soft delete user |
| PUT | `/:id/toggle-active` | Super Admin | Activate / deactivate |

### 💄 Services — `/api/v1/services`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List services (filter, search, paginate) |
| GET | `/categories` | Public | All unique categories |
| GET | `/:id` | Public | Single service |
| POST | `/` | Admin | Create with image upload |
| PUT | `/:id` | Admin | Update with image replace |
| DELETE | `/:id` | Admin | Soft delete |
| PUT | `/:id/toggle-active` | Admin | Toggle visibility |

### 📅 Appointments — `/api/v1/appointments`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/availability?date=&serviceId=` | Public | Check available slots |
| POST | `/` | Public | Book appointment → Email + WhatsApp + Socket alert |
| GET | `/` | Admin | List all (filter by status, date, service, search) |
| GET | `/today` | Admin | Today's schedule |
| GET | `/:id` | Admin | Appointment detail |
| PUT | `/:id/status` | Admin | Update status + payment |
| PUT | `/:id/reschedule` | Admin | Reschedule booking |
| DELETE | `/:id` | Admin | Soft delete |

### 🖼 Gallery — `/api/v1/gallery`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Paginated gallery (filter by category, featured) |
| GET | `/:id` | Public | Single item |
| POST | `/` | Admin | Upload single image to Cloudinary |
| POST | `/bulk` | Admin | Upload up to 20 images |
| PUT | `/:id` | Admin | Update metadata |
| DELETE | `/:id` | Admin | Delete + Cloudinary cleanup |

### 👥 Team — `/api/v1/team`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | All active team members |
| GET | `/:id` | Public | Team member detail |
| POST | `/` | Admin | Add with profile image |
| PUT | `/:id` | Admin | Update |
| DELETE | `/:id` | Admin | Soft delete |

### ⭐ Testimonials — `/api/v1/testimonials`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Approved testimonials |
| POST | `/` | Public | Submit (pending approval) |
| PUT | `/:id` | Admin | Edit |
| PUT | `/:id/approve` | Admin | Toggle approval |
| DELETE | `/:id` | Admin | Soft delete |

### 📝 Reviews — `/api/v1/reviews`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Approved reviews |
| POST | `/` | Public | Submit review |
| PUT | `/:id/approve` | Admin | Approve/unapprove |
| DELETE | `/:id` | Admin | Soft delete |

### 📬 Contact — `/api/v1/contact`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Public | Submit enquiry → ack email + socket alert |
| GET | `/` | Admin | All messages |
| GET | `/unread-count` | Admin | Unread badge count |
| PUT | `/:id/read` | Admin | Mark read |
| PUT | `/:id/replied` | Admin | Mark replied |
| DELETE | `/:id` | Admin | Soft delete |

### 📊 Dashboard — `/api/v1/dashboard`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/stats` | Admin | KPIs: bookings, revenue, growth |
| GET | `/monthly-revenue` | Admin | Last 12 months chart data |
| GET | `/popular-services` | Admin | Top booked services |
| GET | `/booking-analytics` | Admin | By status / day / source / category |
| GET | `/review-analytics` | Admin | Rating distribution |
| GET | `/active-customers` | Admin | Top customers by bookings |

---

## 🔴 Real-time Socket Events (Socket.io)

Connect with Bearer token in `socket.handshake.auth.token`.

### Server → Client (Admin Room)
| Event | Payload | Trigger |
|-------|---------|---------|
| `connected` | `{ message, room, time }` | On connect |
| `new-appointment` | `{ message, appointment }` | New public booking |
| `appointment-updated` | `{ appointment }` | Status change |
| `new-contact` | `{ message, contact }` | Contact form submitted |

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `appointment:watch` | `appointmentId` | Join appointment room |
| `appointment:unwatch` | `appointmentId` | Leave appointment room |
| `notification:acknowledge` | `data` | Ack a notification |
| `ping` | — | Heartbeat check |

---

## 🛡 Security Features

| Feature | Implementation |
|---------|----------------|
| JWT Auth | Access token (7d) + Refresh token (30d) |
| Password hashing | bcryptjs, 12 rounds |
| Account lockout | 5 failed attempts → 2hr lock |
| Rate limiting | General (100/15min), Auth (10/15min), Forms (20/hr) |
| Speed limiting | Gradual delay after 50 req/15min |
| NoSQL injection | express-mongo-sanitize |
| XSS protection | xss-clean |
| HTTP parameter pollution | hpp |
| Security headers | helmet |
| CORS | Whitelist-only origins |
| Input validation | express-validator on all endpoints |
| Soft delete | All models use `deletedAt` pattern |

---

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
# Build image
docker build -t ladli-api:latest .

# Run with env file
docker run -d \
  --name ladli-api \
  -p 5000:5000 \
  --env-file .env \
  ladli-api:latest
```

---

## ⏰ Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Appointment Reminders | Daily 10:00 AM IST | Email + WhatsApp for tomorrow's bookings |
| No-Show Marker | Daily 00:00 AM IST | Auto-marks unattended appointments |

---

## 📖 API Documentation

Swagger UI available at: `http://localhost:5000/api/v1/docs`

JSON spec at: `http://localhost:5000/api/v1/docs.json`

---

## 🔧 Scripts

```bash
npm run dev          # Development with nodemon
npm start            # Production start
npm run seed         # Seed database with sample data
npm run seed:destroy # Clear all seeded data
npm test             # Run tests with coverage
```

---

## 🌍 Environment Variables

See `.env.example` for full list. Critical ones:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Min 32-char random string |
| `JWT_REFRESH_SECRET` | Different from JWT_SECRET |
| `CLOUDINARY_*` | Cloudinary cloud credentials |
| `EMAIL_*` | SMTP credentials (Gmail app password) |
| `TWILIO_*` | Twilio WhatsApp credentials |
| `CLIENT_URL` | Frontend origin for CORS |
| `ADMIN_URL` | Admin panel origin for CORS |

---

## 📋 Response Format

All endpoints return a consistent JSON structure:

```json
{
  "success": true,
  "message": "Appointments fetched",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

*Built with 💖 for Ladli Bridal Studio*
