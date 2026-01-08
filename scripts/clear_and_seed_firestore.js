#!/usr/bin/env node
/*
 Usage:
   node scripts/clear_and_seed_firestore.js /path/to/serviceAccountKey.json admin@example.com "Admin Name" optionalPassword

 This script deletes the main collections used by the app and creates a single admin user document.
 If an admin password is provided, it will also create a Firebase Auth user with that password.
*/

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

function usageAndExit() {
  console.log('Usage: node scripts/clear_and_seed_firestore.js /path/to/serviceAccountKey.json [adminEmail] [adminName] [adminPassword]');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1) usageAndExit();

const serviceAccountPath = args[0];
const adminEmail = args[1] || 'admin@prevencar.com.br';
const adminName = args[2] || 'Admin Principal';
const adminPassword = args[3] || null;

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function deleteCollection(collectionName) {
  console.log(`Deleting collection: ${collectionName}`);
  const colRef = db.collection(collectionName);
  const snapshot = await colRef.get();
  if (snapshot.empty) {
    console.log(` - no documents in ${collectionName}`);
    return;
  }
  const deletes = [];
  snapshot.forEach(doc => deletes.push(doc.ref.delete()));
  await Promise.all(deletes);
  console.log(` - deleted ${deletes.length} documents from ${collectionName}`);
}

async function main() {
  try {
    const collectionsToClear = ['inspections','users','indications','services','monthlyClosures','logs'];
    for (const col of collectionsToClear) {
      await deleteCollection(col);
    }

    console.log('Seeding admin user document in collection `users`');
    const adminDoc = {
      id: 'admin',
      name: adminName,
      email: adminEmail,
      role: 'admin'
    };
    await db.collection('users').doc(adminDoc.id).set(adminDoc);
    console.log(' - admin user document created:', adminEmail);

    if (adminPassword) {
      try {
        const userRecord = await admin.auth().createUser({ email: adminEmail, password: adminPassword, displayName: adminName });
        console.log(' - Firebase Auth user created:', userRecord.uid);
      } catch (e) {
        console.error(' - failed to create Firebase Auth user (maybe already exists):', e.message || e);
      }
    } else {
      console.log(' - adminPassword not provided: Firebase Auth user not created.');
    }

    console.log('Done. Only admin user document remains in Firestore collections listed.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(2);
  }
}

main();
