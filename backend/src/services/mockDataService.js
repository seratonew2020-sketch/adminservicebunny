import Mockaroo from 'mockaroo';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.MOCKAROO_API_KEY;

let client = null;

if (apiKey) {
  client = new Mockaroo.Client({
    apiKey: apiKey
  });
} else {
  console.warn('⚠️ MOCKAROO_API_KEY is missing in .env');
}

export const generateMockData = async (options) => {
  if (!client) {
    throw new Error('Mockaroo client is not initialized. Please check MOCKAROO_API_KEY.');
  }
  
  return client.generate(options);
};

export default client;
