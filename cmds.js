
const model = require("./model");
const {log, biglog, errorlog, colorize} = require("./out");

/**
 *  Muestra la ayuda
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
 	log(" Comandos: ");
  	log(" h|help  -  Muestra esta ayuda. ");
 	log(" list  -  Listar todos quizzes existentes. ");
 	log(" show <id>  -  Muestra la pregunta y la respuesta del quiz indicado. ");
  	log(" add  -  Añadir un nuevo quiz interactivamente. ");
 	log(" delete <id>  -  Borrar el quiz indicado. ");
  	log(" test <id>  -  Probar el quiz indicado. ");
 	log(" p|play  -  Jugar a preguntar aleatoriamente todos los quizzes. ");
	log(" credits  -  Créditos. ");
	log(" q|quit  -  Salir del programa.");
	rl.prompt();
};
 

/**
 *  Lista  todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(`[${colorize(id, 'magenta')}]: ${quiz.question} `);
	});
  	rl.prompt();
};
  	

/**
 *  Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
  	if(typeof id === "undefined"){
  		errorlog(`Falta el parámentro id`);
  	}else {
  		try{
  			const quiz = model.getByIndex(id);
  			log(`${colorize(id, 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  		}catch(error){
  			errorlog(error.message);
  		}
  	}
  	rl.prompt();
};


/**
 *  Añade un nuevo quiz al modelo.
 *  Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize(' Introduzca una respuesta: ', 'red'), answer => {
			model.add(question, answer);
			log(`${colorize('Se ha añadido ', 'magenta')}: ${question} ${colorize('=>', 'magenta')}	${answer}`);
			rl.prompt(); 
		});
	});
};


/**
 *  Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
	if(typeof id === "undefined"){
  		errorlog(`Falta el parámentro id`);
  	}else {
  		try{
  			model.deleteByIndex(id);
  		}catch(error){
  			errorlog(error.message);
  		}
  	}  
  	rl.prompt();
};


/**
 *  Edita un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
  	if(typeof id === "undefined"){
  		errorlog(`Falta el parámentro id`);
  		rl.prompt();
  	}else {
  		try{
  			const quiz = model.getByIndex(id);
  			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
  			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
  				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
				rl.question(colorize(' Introduzca una respuesta: ', 'red'), answer => {
					model.update(id, question, answer);
					log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt(); 
				});
			});
  		}catch(error){
  			errorlog(error.message);
  			rl.prompt();
  		}
  	}
  	rl.prompt();
};


/**
 *  Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a probar.
 */
exports.testCmd = (rl, id) => {
  	if(typeof id === "undefined"){
  		errorlog(`Falta el parámentro id`);
  		rl.prompt();
  	}else {
  		try{
  			const quiz = model.getByIndex(id);
  			rl.question(`${colorize('Pregunta:', 'black')} ${quiz.question} ${colorize('Respuesta:', 'black')} ` , answer => {  				
				if(answer.toLowerCase().trim() === quiz.answer.toLowerCase()){
					log(`${colorize('La respuesta es', 'black')} ${colorize('correcta', 'green')} `);
				}else{
					log(`${colorize('La respuesta es', 'black')} ${colorize('incorrecta', 'red')} `);
				}
			rl.prompt();
			});	
  		}catch(error){
  			errorlog(error.message);
  			rl.prompt();
  		}
  	}
  	rl.prompt();
};


/**
 *  Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 *  Se gana si se contesta a todos correctamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
  exports.playCmd = rl => {

	let score = 0;

	let toBeResolved = []; // Array con todos los ids de las preguntas que existen array de tamaño model.count

	for (i = 0; i < model.count(); i++) {
    toBeResolved[i] = i;
	};

const play = () => {
	if(toBeResolved.length == 0){
		log(`${colorize('Ya no hay mas preguntas!', 'black')} `);
		biglog(` Puntuación: ${score}`, 'yellow');
		rl.prompt();
	}else{
		let id = toBeResolved[Math.floor(Math.random() * (toBeResolved.length -1))];
		let quiz = model.getByIndex(id);

		for (i=0; i<toBeResolved.length; i++){
			if(toBeResolved[i] == id){
				toBeResolved.splice(i, 1);
			}
		}	

		rl.question(colorize(`${quiz.question}? `,'magenta'), answer => {				
			if(quiz.answer.toLowerCase() === answer.trim().toLowerCase()){
				score++;
				log(`${colorize('La respuesta es', 'black')} ${colorize('correcta', 'green')} `);
				play();
			} else{
				log(`${colorize('La respuesta es', 'black')} ${colorize('incorrecta', 'red')} `);
				log(`${colorize('Fin de la partida', 'black')} `);
				biglog(`Puntuación: ${score}`,'yellow');
				rl.prompt();
				};	
			});
		}
	}
 play();

};


/**
 *  Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
	log(' Autores de la práctica: ');
	log(' Marta Bilbao Areitio');
	rl.prompt();
};


/**
 *  Terminar el juego.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
	rl.close();
};
  	
  	


