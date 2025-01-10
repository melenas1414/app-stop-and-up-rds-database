import { Handler, APIGatewayProxyResult } from 'aws-lambda';

import { DatabaseService } from '../modules/database/database.service';
// Instanciamos el servicio de base de datos
const dbService = new DatabaseService();

// Definimos el tipo de evento
interface Event {
  action: string;
}

// Definimos el tipo de la respuesta
type Response = string | { message: string; data?: any };

const generateResponse = (
  statusCode: number,
  body: Response,
): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(body),
});

export const handler: Handler<Event> = async (event) => {
  if (!event?.action) {
    return generateResponse(400, { message: 'Missing action parameter' });
  }
  let response: any;

  try {
    switch (event.action) {
      case 'databaseDown':
        response = await dbService.databaseDown();
        break;
      case 'databaseUp':
        response = await dbService.databaseUp();
        break;
      default:
        response = { message: 'Invalid action' };
    }
  } catch (error) {
    console.error('Error executing action:', error);
    response = { message: 'Internal server error', data: error.message };
    return generateResponse(500, response);
  }

  return generateResponse(200, response);
};
