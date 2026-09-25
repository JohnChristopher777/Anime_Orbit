import * as React from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";

export interface OrbitNotification {
  id: string;
  type: "reply" | "like" | "controversial";
  mediaType?: "ANIME" | "MANGA";
  recipientId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  animeId: string;
  animeTitle: string;
  commentId: string;
  parentId?: string;
  sourceCommentId?: string;
  preview: string;
  read: boolean;
  createdAt?: any;
}

export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = React.useState<OrbitNotification[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const reference = query(
      collection(db, "users", currentUser.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(60),
    );
    return onSnapshot(reference, (snapshot) => {
      setNotifications(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as OrbitNotification)));
      setLoading(false);
    }, () => setLoading(false));
  }, [currentUser]);

  const markRead = React.useCallback(async (notificationId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "notifications", notificationId), { read: true });
    } catch {
      // A transient sync failure leaves the item unread for the next attempt.
    }
  }, [currentUser]);

  const markAllRead = React.useCallback(async () => {
    if (!currentUser) return;
    const unread = notifications.filter((item) => !item.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((item) => batch.update(doc(db, "users", currentUser.uid, "notifications", item.id), { read: true }));
    try {
      await batch.commit();
    } catch {
      // Keep unread state intact if the batch cannot sync.
    }
  }, [currentUser, notifications]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    loading,
    markRead,
    markAllRead,
  };
}
