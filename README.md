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
