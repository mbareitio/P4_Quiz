
const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require("./model");

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
  	models.quiz.findAll()
  	.each(quiz => {
  		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} `);
  	})
  	.catch(error =>{
  		errorlog(error.message);
  	})
  	.then(() =>{
  		rl.prompt();
  	});
};
  	
/**
 * Esta función devuelve una promesa que:
 * 	- Valida que se ha intriducido un valor para el parámetro.
 * 	- Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 * @param id Parámetro con el índice a validar
 */
const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if(typeof id === "undefined"){
			reject(new Error (`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);
			if(Number.isNaN(id)){
				reject(new Error(`El valor del parámetro <id> no es un número`));
			} else {
				resolve(id);
			}
		}
	});
};


/**
 *  Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
  	validateId(id)
  	.then(id => models.quiz.findById(id))
  	.then(quiz => {
  		if (!quiz) {
  			throw new Error (`No existe un quiz asociado al id=${id}.`);
  		}
  		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  	})	
  	.catch(error => {
  		errorlog(error.message);
  	})
  	.then(() => {
  		rl.prompt();
  	});
};	


/**
 * Esta funcion devuelve una promesa que, cuando se cumple, proporciona el texto introducido.
 * 
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hayq ue hacerle al usuario.
 */
const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};


/**
 *  Añade un nuevo quiz al modelo.
 *  Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca una respuesta: ')
		.then(a =>{
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
		log(`${colorize('Se ha añadido ', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/**
 *  Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	}) 
	.then(() =>{
		rl.prompt();
	});
};


/**
 *  Edita un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
	validateId(id)
  	.then(id => models.quiz.findById(id))
  	.then(quiz => {
  		if (!quiz){
  			throw new Error (`No existe un quien asociado al id=${id}.`);
  		}
  		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
  		return makeQuestion(rl, 'Introduzca la pregunta: ')
  		.then(q => {
  			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
  			return makeQuestion(rl, 'Introduzca la respuesta: ')
  			.then(a => {
  				quiz.question = q;
  				quiz.answer = a; 
  				return quiz;
  			});
  		});
  	})
  	.then(quiz => {
  		return quiz.save();
  	})
  	.then(quiz => {
  		log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  	})
  	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
  	.then(() => {
  		rl.prompt();
  	});
};


/**
 *  Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a probar.
 */
exports.testCmd = (rl, id) => {
  	validateId(id)
  	.then(id => models.quiz.findById(id))
  	.then(quiz => {
  		if (!quiz){
  			throw new Error (`No existe un quien asociado al id=${id}.`);
  	  	}
  	  	log(``);
  		log(`${colorize('Pregunta:', 'black')} ${quiz.question}`);
  		makeQuestion(rl , `${colorize('Respuesta:', 'black')}`)
  		.then(a => {
  			if(quiz.answer.toLowerCase() === a.toLowerCase().trim()){
				log(`${colorize('La respuesta es', 'black')} ${colorize('correcta', 'green')} `);
  			}else{
				log(`${colorize('La respuesta es', 'black')} ${colorize('incorrecta', 'red')} `);
  			}
  		})
  	})
  	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
  	.catch(error => {
  		errorlog(error.message);
  	})
  	.then(() => {
  		rl.prompt();
  	});
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
  	
  	


