import { db } from '../firebase';
import { collection, onSnapshot, addDoc, setDoc, doc, deleteDoc } from 'firebase/firestore';

export function subscribeToCollection<T>(colName: string, onUpdate: (items: T[]) => void) {
  const colRef = collection(db, colName);
  const unsub = onSnapshot(colRef, snapshot => {
    try {
      const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as T);
      onUpdate(items);
    } catch (e) {
      console.error(`Error processing snapshot for ${colName}:`, e);
    }
  }, (err) => {
    console.error(`Firestore snapshot error for ${colName}:`, err);
    // Clear local state to avoid stale/partial UI and surface the issue
    try { onUpdate([]); } catch (e) { /* ignore */ }
  });
  return unsub;
}

export async function saveDoc(colName: string, item: any) {
  if (item.id) {
    const ref = doc(db, colName, item.id);
    await setDoc(ref, item);
    return item.id;
  } else {
    const ref = await addDoc(collection(db, colName), item);
    return ref.id;
  }
}

export async function deleteDocById(colName: string, id: string) {
  await deleteDoc(doc(db, colName, id));
}
