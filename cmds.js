
const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require("./model");



/**
 * Esta función devuelve una promesa que:
 *  - Valida que se ha intriducido un valor para el parámetro.
 *  - Convierte el parámetro en un número entero.
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
 *  Muestra la ayuda
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = (socket, rl) => {
    log(socket, " Comandos: ");
    log(socket, " h|help  -  Muestra esta ayuda. ");
    log(socket, " list  -  Listar todos quizzes existentes. ");
    log(socket, " show <id>  -  Muestra la pregunta y la respuesta del quiz indicado. ");
    log(socket, " add  -  Añadir un nuevo quiz interactivamente. ");
    log(socket, " delete <id>  -  Borrar el quiz indicado. ");
    log(socket, " test <id>  -  Probar el quiz indicado. ");
    log(socket, " p|play  -  Jugar a preguntar aleatoriamente todos los quizzes. ");
    log(socket, " credits  -  Créditos. ");
    log(socket, " q|quit  -  Salir del programa.");
    rl.prompt();
};
 

/**
 *  Lista  todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = (socket, rl) => {
    models.quiz.findAll()
    .each(quiz => {
        log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} `);
    })
    .catch(error =>{
        errorlog(socket, error.message);
    })
    .then(() =>{
        rl.prompt();
    });
};
    

/**
 *  Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave el quiz a mostrar.
 */
exports.showCmd = (socket, rl, id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error (`No existe un quiz asociado al id=${id}.`);
        }
        log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })  
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};  


/**
 *  Añade un nuevo quiz al modelo.
 *  Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = (socket, rl) => {
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
        log(socket, `${colorize('Se ha añadido ', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
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
exports.deleteCmd = (socket, rl, id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(socket, error.message);
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
exports.editCmd = (socket, rl, id) => {
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
        log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(socket, error.message);
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
exports.testCmd = (socket, rl, id) => {
    const testOne = quiz => {
        return new Sequelize.Promise((resolve, reject) => {
            if (!quiz){
                reject(new Error (`No existe un quiz asociado al id=${id}.`))
            }

            log(socket, `${colorize('Pregunta:', 'black')} ${quiz.question}`);
            makeQuestion(rl , `${colorize('Respuesta: ', 'black')}`)
            .then(a => {
                if(quiz.answer.toLowerCase() === a.toLowerCase().trim()){
                    resolve(log(socket, ' correct '))
                }else{
                    resolve(log(socket, ' incorrect '));
                }
            })
        })
    }

    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => testOne(quiz))
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(socket, error.message);
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

    let score = 0
    let toBeResolved = [] // Array con todos los ids de las preguntas que existen array de tamaño model.count

    const play = () => {
        return new Sequelize.Promise((resolve, reject) => {
            if (toBeResolved.length === 0 || toBeResolved[0] === "undefined" || typeof toBeResolved === "undefined") {
                resolve(log(socket, ` Fin del juego. Puntuación: ${score}`))
            } else {
                let i = Math.floor(Math.random() * (toBeResolved.length -1));
                let quiz = toBeResolved[i];
                log(socket, `${colorize('Pregunta:', 'black')} ${quiz.question}`);
                toBeResolved.splice(i, 1);
                
                makeQuestion(rl,`${colorize('Respuesta: ', 'black')}`)
                .then(a => {
                    if(quiz.answer.toLowerCase() === a.toLowerCase().trim()){
                        score++;
                        log(socket, `Respuesta correcta. Puntuación: ${score}`);
                        resolve(play())
                    } else {
                        resolve(log(socket, `Respuesta incorrecta. Fin del juego. Puntuación: ${score}`))
                    }
                })
            }
        })
    }

    models.quiz.findAll()
    .then(quizzes => {
        quizzes.forEach((quiz,id) =>{
            toBeResolved[id] = quiz;
        });
    })
    .then(() => play())
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    })
}

/**
 *  Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = (socket, rl) => {
    log(socket, ' Autores de la práctica: ');
    log(socket, ' Marta Bilbao Areitio');
    rl.prompt();
};


/**
 *  Terminar el juego.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};
    
