# rest-api-server-scaffold-v2

## README.md

## REST API Server with User Authentication and User Management

This project is a REST API server built with Node.js and PostgreSQL, featuring user authentication. It provides endpoints for user registration, login, and profile management.

This serves as the scaffold for building a RESt API with authentication using pgsql as its RDBMS.

## Features

- User registration and login
- JWT-based authentication
- User profile management
- Input validation

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Tokens)
- dotenv for environment variables

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd rest-api-server
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add your database connection details and secret keys:

   ```bash
   DATABASE_URL=your_database_url
   DATABASE_URL_DEV=postgres://scaffolddbadmin:scaffolddb%40dmin@192.168.88.23:5432/scaffold_db_dev
   DATABASE_URL_TEST=postgres://scaffolddbadmin:scaffolddb%40dmin@192.168.88.23:5432/scaffold_db_test
   DATABASE_URL_PROD=postgres://scaffolddbadmin:scaffolddb%40dmin@192.168.88.23:5432/scaffold_db_prod
   JWT_SECRET=your_jwt_secret
   TOKEN_EXPIRATION=1d
   API_PORT=3023
   NODE_ENV=development
   ```

   ```bash
   node generateKey.js to fill value of the JWT_SECRET if you want or run periodically in cron or docker/podman
   ```

## Running the Server

To start the server, run the following command:

```bash
npm start
```

The server will listen on the specified port (default is 3000).

## API Endpoints

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Login an existing user
- **GET /api/users/profile** - Get user profile (requires authentication)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.

## Endpoints

✦ The API has two versions, v1 and v2. It seems that v2 is the current and more feature-rich version.

  Here's a breakdown of the available endpoints:

  API V2

  Authentication

- POST /api/v2/auth/login: User login.
- POST /api/v2/auth/register: User registration (only in non-production environments).

  Users

- GET /api/v2/users/profile: Get the authenticated user's profile.
- PUT /api/v2/users/profile: Update the authenticated user's profile.
- GET /api/v2/users: Get all users.
- GET /api/v2/users/:id: Get a user by ID.
- PUT /api/v2/users/:id: Update a user by ID.
- DELETE /api/v2/users/:id: Delete a user by ID.
- PUT /api/v2/users/:id/reset-password: Reset a user's password.

  Recipients

- GET /api/v2/recipients: Get a paginated list of recipients.
- GET /api/v2/recipients/all: Get all recipients.
- POST /api/v2/recipients: Create a new recipient.
- PUT /api/v2/recipients/:id: Update a recipient.
- DELETE /api/v2/recipients/:id: Delete a recipient.

  Trackers

- GET /api/v2/trackers: Get a paginated list of trackers.
- GET /api/v2/trackers/all: Get all trackers.
- POST /api/v2/trackers: Create a new tracker.
- GET /api/v2/trackers/:id: Get a tracker by ID.
- PUT /api/v2/trackers/:id: Update a tracker.
- DELETE /api/v2/trackers/:id: Delete a tracker.

  Tracker Recipients

- GET /api/v2/trackers/:trackerId/recipients: Get all recipients for a tracker.
- POST /api/v2/trackers/:trackerId/recipients/bulk-update: Bulk update recipients for a tracker.
- POST /api/v2/trackers/:trackerId/recipients/:recipientId/action: Create or update a tracker-recipient.
- GET /api/v2/tracker-recipients/:id: Get a specific tracker-recipient by ID.
- PATCH /api/v2/tracker-recipients/:id/status: Update a tracker-recipient's status.
- DELETE /api/v2/tracker-recipients/:id: Delete a tracker-recipient.

  Recipient Actions

- GET /api/v2/trackers/:trackerId/recipient-actions: Get all actions for a tracker.
- POST /api/v2/trackers/:trackerId/recipient-actions/bulk-update: Bulk update actions for a tracker.
- POST /api/v2/trackers/:trackerId/recipients/:recipientId/action: Create or update an action for a tracker-recipient.
- GET /api/v2/recipient-actions/:actionId: Get a specific action by ID.
- PATCH /api/v2/recipient-actions/:actionId/status: Update an action's status.
- DELETE /api/v2/recipient-actions/:actionId: Delete an action.

  API V1 (Legacy)

  Authentication

- POST /api/v1/auth/login: User login.
- POST /api/v1/auth/register: User registration (only in non-production).

  Users

- GET /api/v1/users/:id: Get user by ID.
- PUT /api/v1/users/:id: Update user by ID.

## VAPID

- To test the implementation, follow these steps:


  1. Restart the Backend
  Ensure your backend server is restarted so it loads the new VAPID keys from the .env file and registers the new routes.


  2. Verify Frontend Registration
   1. Open your browser's Developer Tools (F12).
   2. Go to the Application tab and select Service Workers in the left sidebar.
   3. You should see sw.js registered and running.
   4. Check the Console. You should see:
       * Service Worker registered with scope: ...
       * User subscribed to push notifications (This happens after you log in).

  3. Check the Database
  Verify that the subscription was saved by running a query on your database:
   1 SELECT * FROM push_subscriptions;
  If you see a row with your user_id and an endpoint URL, the registration was successful.


  4. Trigger a Test Notification
  You can trigger a notification using curl or Postman. Since the test endpoint is protected, you'll need your JWT token.

  Using Curl:


   1 curl -X POST http://localhost:5007/v2/push/test \
   2      -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
   3      -H "Content-Type: application/json"


  5. Quick UI Test (Optional)
  If you want to test it directly from the UI, you can temporarily add a button to any screen (e.g., DashboardScreen.jsx):

   1 import api from '../utils/api';
   2
   3 // Inside your component:
   4 <button onClick={() => api.post('/push/test')}>
   5   Send Test Notification
   6 </button>


  Important Troubleshooting Tips:
   * Browser Permissions: Ensure you haven't blocked notifications for localhost. Click the "Lock" icon in the address bar to check
     permissions.
   * Localhost vs IP: Browsers only allow Service Workers on localhost or https. If you are accessing the site via an IP address (e.g.,
     http://192.168.1.5:5173), push notifications will fail unless you use HTTPS.
   * Incognito Mode: Some browsers disable the Push API in Incognito/Private mode. Test in a normal window.
