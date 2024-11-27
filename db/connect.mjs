import chalk from 'chalk';
import mongoose from 'mongoose'
import ora from 'ora';

export const connectdb = async() => {
    try {
        const loaderConnnectDB = ora(` ${chalk.blue('Conectando base de datos local.....')}`).start();
        loaderConnnectDB.spinner = 'arc';
        loaderConnnectDB.color = 'blue';
        await mongoose.connect( 'mongodb+srv://MiguelFullstack:hookom119@hook.lb2oqov.mongodb.net/movistar' );
        loaderConnnectDB.color = 'green'
        loaderConnnectDB.succeed(`${chalk.greenBright('¡Base de datos local conectada con éxito!')}`)
    } catch (error) {
        console.log(error);
        throw new Error('Error a la hora de iniciar la base de datos');
    }
}