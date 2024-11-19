import { Client, Databases, Account } from 'appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6738dc23000451790f85');

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = '6738dc550005429656ed';
export const COLLECTION_ID = '6738ddad000a6bccc0e3';
export const MASTER_KEYS_COLLECTION_ID = '673cca66001d6b97abd1';