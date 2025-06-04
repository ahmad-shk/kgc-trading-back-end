const schedule = require('node-schedule');

const job = schedule.scheduleJob(' */5 * * * *', (fireDate) => {
    console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
});

process.on('SIGINT', () => {
    schedule.gracefulShutdown()
        .then(() => process.exit(0))
});

module.exports = job;