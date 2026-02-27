# Markstagram 2.0

"A personal recreation of Instagram. Sign up and start posting today!"

This project is from the [the Odin Project](https://www.theodinproject.com) (specifically, from their [Full Stack Javascript](https://www.theodinproject.com/paths/full-stack-javascript) curriculum).

~~[Click here] to read more about the project specifications.~~ (Update: the Odin Project has restructured their Full Stack Javascript curriculum since version 1.0 of this app was created, and the original link no longer works. [Click here](https://www.theodinproject.com/lessons/nodejs-odin-book) for what this project has since been ported to.)

Version 2.0 has replaced Firebase as its server (for database API calls & authentication) with its own server, built in Typescript, Bun, Hono, Drizzle ORM, and Postgres.

Additionally, the client has been rewritten from Javascript to Typescript, as well as converted from CRA to Vite.

![Live preview of the Markstagram app](./client/public/images/sample.gif)

## Live App

[Click here](https://markstagram-client.onrender.com/) to check out the live version of the app!

## Runtime Notes

- Current default runtime is Bun (native-first).
- Bun migration is staged. See [BUN_MIGRATION_PLAN.md](./BUN_MIGRATION_PLAN.md).
- Local Bun commands:
  - `pnpm dev` (Bun API + native WebSocket on `/ws`)
  - `pnpm --filter @markstagram/server test`
- Realtime transport behavior:
  - Native WS endpoint defaults to `VITE_API_URL` with `/ws` and `ws://` / `wss://` protocol mapping.
  - Optional override via `VITE_WS_URL`.

## Deployment Notes (Render + Neon)

- Recommended Render build command:
  - `pnpm install --frozen-lockfile && pnpm --filter @markstagram/shared-types build && pnpm --filter @markstagram/server build`
- Recommended Render start command:
  - `pnpm --filter @markstagram/server db:migrate && pnpm --filter @markstagram/server start`
- Important Neon baseline note:
  - If your Neon database already existed before Drizzle migration files were introduced, baseline the initial Drizzle migration in `drizzle.__drizzle_migrations` first.
  - Do not run the initial table-creation migration against an already-populated production schema without a baseline strategy.

## Local Docker Test DB

- Use `pnpm test:server:docker` to run the server tests against a local Postgres container.
- The command:
  - starts `docker-compose.test.yml`,
  - applies Drizzle migrations,
  - runs `server` tests against Docker Postgres,
  - tears the container down automatically.
- Optional: run `pnpm test:server:docker:keepdb` to keep the test DB up after tests finish.
- Env defaults come from [`server/.env.test.sample`](./server/.env.test.sample). Create `server/.env.test` to override.

## Server Test Commands

- Docker-orchestrated standard run:
  - `pnpm --filter @markstagram/server test`
- Docker-orchestrated fast + parallel run:
  - `pnpm --filter @markstagram/server test:fast:parallel`
- Inner test commands (assume DB is already up/migrated):
  - `pnpm --filter @markstagram/server test:inner:run`
  - `pnpm --filter @markstagram/server test:inner:run:fast:parallel`

## Project Objectives

1. To recreate a fully-functional clone of Instagram that any external user can sign up for and start using.
2. To implement a polished client-side app that is written in React & Typescript.
3. To write & integrate an API built in Bun, Hono, Typescript, Drizzle ORM, and Postgres.

## Current Technologies Used

<p align="left"> 
<a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg" alt="html5" width="50" height="50"/></a> 
<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg" alt="css3" width="50" height="50"/></a>
<a href="https://www.typescriptlang.org/" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="typescript" width="50" height="50"/></a>
<a href="https://reactjs.org/" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="react" width="50" height="50"/></a>
<a href="https://nodejs.org/en/learn/getting-started/introduction-to-nodejs" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="nodejs" width="50" height="50"/></a>
<a href="https://expressjs.com/" target="_blank"><img src="./client/public/images/express.svg" alt="express" width="50" height="50"/></a>
<a href="https://www.prisma.io/" target="_blank"><img src="./client/public/images/prisma.svg" alt="prisma" width="50" height="50"/></a>
<a href="https://www.postgresql.org/" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" alt="postgres" width="50" height="50"/></a>
<a href="https://vitejs.dev/" target="_blank"><img src="./client/public/images/vite.svg" alt="vite" width="50" height="50"/></a>
</p>

## Former Technologies Used

<p align="left"> 
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="50" height="50"/></a>
<a href="https://create-react-app.dev/" target="_blank"><img src="./client/public/images/cra.svg" alt="creat-react-app" width="50" height="50"/></a>
<a href="https://firebase.google.com/" target="_blank"><img src="https://raw.githubusercontent.com/devicons/devicon/1119b9f84c0290e0f0b38982099a2bd027a48bf1/icons/firebase/firebase-plain.svg" alt="firebase" width="50" height="50"/></a>
</p>

## App Features

1. Enjoy responsive styling tailored for both desktop and mobile, created from scratch in vanilla CSS.
2. Create your own account and log in / log out whenever you please, facilitated by the Bun + Hono API.
3. Add posts by uploading photos & adding captions, which are stored & retrieved from the app's relational database (Postgres) and storage (Firebase Storage).
4. View a set number of posts on a given page (ie, home, profile, or saved), and load more by scrolling down the page.
5. View individual post pages and scroll through its full list of comments.
6. Comment on, like, and save posts along with clicking-to-copy URLs for sharing with others.
7. Send other users private direct messages in a chat system that updates in real-time, powered by native WebSockets.
8. Search for user profiles to view & users to direct message, thanks to queries in Drizzle ORM & Postgres.

## Instructions

1. Click the "Sign Up" button to create your account, or click the "Login" button to sign back in.
2. Enjoy a limited preview of the app before signing up / logging in. Visible pages include the home pages, user profiles, and individual post pages.
3. Create your first post by clicking the "+" button (either on the top navbar if on desktop / tablet or on the bottom navbar if on mobile). Click the blank image box to select a picture to upload, then give it a caption and hit the "Upload New Post" button!
4. Click the search box in the navbar and type in a name to search for other users. In the pop-up, you'll be able to click on the user whose profile you can navigate to.
5. Access your direct messages by clicking the "word bubble" icon in the navbar, then search for a user to reach out to, and just message away! Alternatively, you can go right to a direct message conversation with someone by clicking the "paper airplane" icon in their profile.
6. Like, save, and comment on posts by using the buttons & input bar found on a post reel (found on the home page) and full post page. You can access a full post page by clicking on the image itself in a post reel or post preview (found in user profiles & saved posts page).

## Areas for Improvement

1. Right now, the app only supports uploading images. Supporting GIFs and videos would be a nice touch.
2. Additionally, users cannot edit or delete posts, comments, or messages.
3. Images are styled with the CSS rule "object-fit: cover". This means that they'll get cropped if they are signifcantly wider or taller than a standard square (ie, aspect ratio of 1:1).

## Known Issues

1. Responsiveness is accomplished by creating separate CSS rules for screens larger vs. smaller than 800px. On mobile devices that are rotated horizontally, forms & pop-ups can be difficult to use.
2. There is no password-reset page available yet, meaning that users can potentially get locked out of their accounts.
3. In the PaaS that the client is hosted on (in this case, Render.com), manually refreshing the browsers results in a 404 error.
