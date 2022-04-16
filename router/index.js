exports.setup = function (app, mongoClient) {

	const auth = require(__dirname + '../../services/auth')
	const user = require(__dirname + '../../services/user')
	const job = require(__dirname + '../../services/job')


	app.route('/api/auth')
		.post((req, res, next) => {
			res.locals.mongo = mongoClient;
			auth.signIn(req, res, next);
		});

	//users
	app.route('/api/users')
		.get((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.getUsers(req, res, next);
		});

	app.route('/api/users')
		.post((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.postUser(req, res, next);
		});

	app.route('/api/register')
		.post((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.postUser(req, res, next);
		});

	app.route('/api/users/:userID')
		.get((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.getUser(req, res, next);
		})
		.put((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.putUser(req, res, next);
		})
		.delete((req, res, next) => {
			res.locals.mongo = mongoClient;
			user.deleteUser(req, res, next);
		});

	//list jobs
	app.route('/api/jobs')
		.get((req, res, next) => {
			// res.locals.mongo = mongoClient;
			job.getJobs(req, res, next);
		});


	//job detail
	app.route('/api/jobs/:jobID')
		.get((req, res, next) => {
			// res.locals.mongo = mongoClient;
			job.getJob(req, res, next);
		});

	//health check
	app.route('/env')
		.get((req,res, next) => {

			res.send({
				env: process.env.ENV || 'unknown'
			})

		});

	//catch all
	app.route('*')
		.get((req, res, next) => {
			res.status(404).send({});
		});

}
