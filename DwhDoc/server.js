const app = require('./app');

const appport=(process.env.PORT == null || process.env.PORT == "") ? 4000 : process.env.PORT;

app.listen(appport, function() {
     console.log('Express server listening on port ' + appport);
});


