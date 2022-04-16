# jobdansmultipro
jobdansmultipro


to run this app,
you need to run command

```
$ docker-compose up
```

or you can run with option ```--build```
that command will initiate MongoDB

after the application running,

you will need to register user first from

`/api/register`

if your registration successful,
now you can log in into

`/api/auth`


if you are going to access Job API,

you will need Bearer Token
list api JOB,

- `/api/jobs`

- `/api/jobs/{jobID}`


i also include the postman collection
please import the collection for detail request.
