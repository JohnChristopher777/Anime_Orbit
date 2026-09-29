import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";

export const deleteCommunityEntryTree = async (entry: any, currentUserId: string) => {
  const batch = writeBatch(db);
  const removedIds = new Set<string>([String(entry.id)]);
  const isRoot = !entry.parentId;

  if (isRoot) {
    const replies = await getDocs(query(collection(db, "comments"), where("parentId", "==", entry.id)));
    replies.docs.forEach((reply) => {
      removedIds.add(reply.id);
      batch.delete(reply.ref);
    });
  }

  batch.delete(doc(db, "comments", entry.id));
  const notifications = await getDocs(collection(db, "users", currentUserId, "notifications"));
  notifications.docs.forEach((notice) => {
    const data = notice.data();
    if (
      removedIds.has(String(data.commentId || "")) ||
      data.parentId === entry.id ||
      data.sourceCommentId === entry.id
    ) batch.delete(notice.ref);
  });

  await batch.commit();
  return { removedEntries: removedIds.size, isRoot };
};
