## Instructions to setup and run project
run `npm install` in the client and server directories.

Start the instance of MongoDB running in the background at "mongodb://127.0.0.1:27017/fake_so"

In the server directory:
  - run `node server.js` to start the server.
  - run `node init.js <admin_email> <admin_password>` to create the inital data in the database. This contains a number of pre-created sample questions, answers, tags, and comments, as well as two other users in addition to the admin account. The admin account will have username ADMIN. Log in with the credentials provided when running the init.js script.

In the client directory, run `npm start` to start the web server. Type in localhost:3000 if a browser window does not automatically open

## Notes
- The whole page should be viewable, but if the bottom of the page is cut-off (for example if the prev/next buttons aren't showing on the homepage with more than 5 questions) then press Ctrl+ Minus sign (-) to zoom out to see full page


