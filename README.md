# README #

Bank balance Telegram Bot. To use just create .env file based on .env.template with your Credentials.
The bot is configured to get the balance from ING-DiBa online banking. It uses headless PhantomJS
browser to pass two steps authorization and prepare the data from the main balance page. Also
bot can be configured to use Sparkasse online banking. There is a PhantomJS script in the PhantomScripts directory.

To run configured bot you even do not have to install anything except the Docker. After docker installed
all you have to do is just run ```docker-compose up -d``` and enjoy.

Note: It is not yet fully finished. The idea is to check the balance with Cron that is why there is a cron
job in the crontab config of the docker. At the moment cron job starts every hour. Also the bot listener
daemon starting by default to be able to subscribe on notifications. To subscribe you should define the
password in ```.env``` file and then send ```/subscribe <YOUR PASS>``` command from your Telegram client
 to the bot.
 
 Work is still in progress and this bot mainly written to demonstrate the abilitites of Teebot framework
 and as bonus to freely receive the updates of bank's balance. Any bank with an online banking can be added
 to this bot, of course if there is ready to use PhantomJS scenario script.