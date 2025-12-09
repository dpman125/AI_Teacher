# Instructions for Use

1. The site is seperated into 3 tabs, (home/general, Paper Checker, and Student list)

2. The first tab is for any general questions you may have asking to design lesson plans, review curiculum, and provide general teaching assistance.

3. The second tab allows the user to generate a grade for a particular student. The user will be asked to select a student (see third tab if there are not yet any students saved)

4. The third tab allows the user to add students to a student list. They will be ascociated with the grades given in the paper review section, or can be filled out manually.

This app uses OpenAIs API documentation to generate grades for reports, and assign them to students. It is a simple but effective workflow to streamline any professor's grading process. 

#How to run a local server. 

1. create a .env with the following format:
2. 
# Copy this file to .env and fill in your OpenAI API key
OPENAI_API_KEY = "" (you can use your own, or email me for my own for you to borrow. there is only 5 bucks on there so I am not too worried about it getting leaked.)
OPENAI_MODEL=gpt-4o-mini
PORT=3001
NODE_ENV=development

3. run 2 windows in your terminal with the following commands

4. To run the server from root directory /AI_Teacher:
- cd server
- node index.js

5. To run the client from root directory /AI_Teacher:
- cd client
- npm start

6. from here you should be able to open your localhost port, and view and test the full project for yourself. 