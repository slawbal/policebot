# policebot

This is a Discord Bot which allows to collect time logged on tasks for a specified user

#### Usage:
`!wlog {jira-username}`

or

`!wlog {jira-username} {last x days}`

to see the status:

`!status`

## Deployment:

1. Put your bot token into `auth.json.template` and modify the name to: `auth.json`
2. Modify configuration file `config.json.template` to fit your JIRA settings, and credentials for the user. Change name of the file to `config.json`
3. Build the image: `docker build -t police-bot .`
4. Run the image: `docker run --name policeBot police-bot`

## Run outside of the container
1. Follow steps 1. and 2. from Deployment chapter
2. `npm install`
3. `node src/bot.js`
