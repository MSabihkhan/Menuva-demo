import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyC4llxWWMsb8ZXHYxdqgMlz17rJzUc1vWo',
  authDomain: 'realtime-test-f1ca6.firebaseapp.com',
  databaseURL: 'https://realtime-test-f1ca6-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'realtime-test-f1ca6',
  storageBucket: 'realtime-test-f1ca6.firebasestorage.app',
  messagingSenderId: '521841116888',
  appId: '1:521841116888:web:702e12f9d0c581606579ad',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getDatabase(app);
