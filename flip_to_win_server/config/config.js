module.exports = config = 
{
	port: 5678,
	host: '127.0.0.1:5678',
	db_options : {
		host: 'localhost',
		port: 3306,
		user: 'root',
		password: '',
		database: 'webstore'
	},
  
email : {
  sender : 'satender@ez2mo.com',
  subjectPrefix: '[FlipToWin]',
  smtp : {
    host: 'smtp.gmail.com',
    port: 465,
    user: 'satender@ez2mo.com',
    pass: '',
    use_authentication: true,
    ssl: true
  },
templatePath: __dirname + '/../resources/mail/',
extension: '.txt'
	}	
};
