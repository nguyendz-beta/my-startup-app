This folder will contain Prisma migration SQL files created by `npx prisma migrate dev`.

To generate and apply migrations (requires a running MySQL at DATABASE_URL):

1. Start the database (e.g., `docker-compose up -d mysql`).
2. Run `npx prisma migrate dev --name init` from the `backend` folder.
3. Run `npm run prisma:seed` to load seed data.
