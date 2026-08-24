"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { api, getErrorMessage } from "@/lib/api-client";
import { fetchCurrentUser, type CurrentUser } from "@/lib/auth";

const INITIAL_PARENT_COUNT = 5;
const PARENT_PAGE_SIZE = 5;
const INITIAL_REPLY_COUNT = 3;
const REPLY_PAGE_SIZE = 5;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type CommentReply = {
  id: number;
  workout_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  username: string;
  full_name: string | null;
  replies: CommentReply[];
};

type CommentData = {
  id: number;
  workout_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  username: string;
  full_name: string | null;
  replies: CommentReply[];
};

type Props = {
  workoutDate: string;
  isCoach: boolean;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function displayName(user: CurrentUser | null, comment: CommentData): string {
  if (user && user.id === comment.user_id) return "You";
  return comment.full_name || comment.username || "Unknown";
}

function initials(str: string): string {
  return str.trim().slice(0, 2).toUpperCase();
}
// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function WorkoutComments({ workoutDate, isCoach }: Props) {
  const t = useTranslations("comments");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [visibleParentCount, setVisibleParentCount] = useState(INITIAL_PARENT_COUNT);
  const [replyVisibleCount, setReplyVisibleCount] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<CommentData[]>(
        `/workouts/${workoutDate}/comments`,
      );
      setComments(data);
      setVisibleParentCount(INITIAL_PARENT_COUNT);
      setReplyVisibleCount({});
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load comments"));
    } finally {
      setLoading(false);
    }
  }, [workoutDate]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);
// ─── Infinite scroll for parent comments ──────────────────────────

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleParentCount((prev) => {
            const next = prev + PARENT_PAGE_SIZE;
            return next >= comments.length ? comments.length : next;
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [comments.length]);

  const visibleParents = useMemo(
    () => comments.slice(0, visibleParentCount),
    [comments, visibleParentCount],
  );

  function showMoreReplies(commentId: number) {
    setReplyVisibleCount((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] ?? INITIAL_REPLY_COUNT) + REPLY_PAGE_SIZE,
    }));
  }

  function getVisibleReplyCount(commentId: number): number {
    return replyVisibleCount[commentId] ?? INITIAL_REPLY_COUNT;
  }

// ─── Submit / Delete handlers ────────────────────────────────────

  async function handleSubmit() {
    const content = newContent.trim();
    if (!content || submitting || cooldownRemaining > 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/workouts/${workoutDate}/comments`, {
        content,
        parent_id: replyTo?.id ?? null,
      });
      setNewContent("");
      setReplyTo(null);
      setSubmitError(null);
      // Start cooldown timer client-side
      startCooldown(15);
      await loadComments();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to post comment");
      // Check if the server returned a rate-limit or duplicate error with
      // cooldown info (e.g. "You can comment again in ~12s")
      const cooldownMatch = msg.match(/you can comment again in ~?(\d+)/i);
      if (cooldownMatch) {
        startCooldown(parseInt(cooldownMatch[1], 10));
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function startCooldown(seconds: number) {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    setCooldownRemaining(seconds);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleDelete(commentId: number) {
    try {
      await api.delete(`/workouts/${workoutDate}/comments/${commentId}`);
      await loadComments();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete comment"));
    }
  }

  function cancelReply() {
    setReplyTo(null);
    setNewContent("");
    setSubmitError(null);
  }

  function canDelete(comment: CommentData): boolean {
    if (!user) return false;
    if (user.id === comment.user_id) return true;
    return isCoach;
  }
// ─── Render comment helper ─────────────────────────────────────────

  function renderComment(comment: CommentData, isReply = false) {
    const isOwn = user?.id === comment.user_id;
    const isCoachComment = isCoach && comment.user_id !== user?.id;

    return (
      <div
        key={comment.id}
        className={`${isReply ? "ml-8 mt-3 border-l-2 border-[#B4E3BD]/20 pl-4" : "border-t border-gray-800 pt-4 first:border-t-0 first:pt-0"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-[11px] font-bold text-[#B4E3BD]">
              {initials(comment.full_name || comment.username)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">
                  {displayName(user, comment)}
                </span>
                {isOwn && (
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                    you
                  </span>
                )}
                {!isOwn && isCoachComment && (
                  <span className="rounded-full bg-[#B4E3BD]/10 px-2 py-0.5 text-[10px] font-medium text-[#B4E3BD]">
                    coach
                  </span>
                )}
                <span className="text-[11px] text-gray-600">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>
            </div>
          </div>
          {canDelete(comment) && (
            <button
              type="button"
              onClick={() => handleDelete(comment.id)}
              aria-label="Delete comment"
              className="shrink-0 rounded-full p-1 text-gray-600 transition hover:text-red-400"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-gray-300">
          {comment.content}
        </p>
        {user && !replyTo && (
          <button
            type="button"
            onClick={() => {
              setReplyTo({ id: comment.id, username: comment.username });
              inputRef.current?.focus();
            }}
            className="mt-1.5 text-[11px] font-semibold text-gray-500 transition hover:text-[#B4E3BD]"
          >
            Reply
          </button>
        )}
        {comment.replies.length > 0 && (
          <div className="mt-1">
            {comment.replies.slice(0, getVisibleReplyCount(comment.id)).map((reply) => renderComment(reply, true))}
            {comment.replies.length > getVisibleReplyCount(comment.id) && (
              <button
                type="button"
                onClick={() => showMoreReplies(comment.id)}
                className="ml-8 mt-2 text-[11px] font-semibold text-gray-500 transition hover:text-[#B4E3BD]"
              >
                Show {Math.min(REPLY_PAGE_SIZE, comment.replies.length - getVisibleReplyCount(comment.id))} more {comment.replies.length - getVisibleReplyCount(comment.id) === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────

  return (
    <div className="mt-8">
      <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
            {t("title")}
          </h3>
          {comments.length > 0 && (
            <span className="text-xs text-gray-500">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          )}
        </div>

        {user ? (
          <div className="mb-5">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {t("replyTo")} <span className="font-semibold text-gray-300">@{replyTo.username}</span>
                </span>
                <button type="button" onClick={cancelReply} className="text-gray-600 transition hover:text-red-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-[11px] font-bold text-[#B4E3BD]">
                {initials(user.full_name || user.username)}
              </span>
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={newContent}
                  onChange={(e) => {
                    // Enforce 1000-char limit on the client side too
                    if (e.target.value.length <= 1000) {
                      setNewContent(e.target.value);
                      setSubmitError(null);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={replyTo ? `Reply to @${replyTo.username}...` : t("placeholder")}
                  rows={2}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                />
                {submitError && <p className="mt-1.5 text-xs text-red-400">{submitError}</p>}
                {cooldownRemaining > 0 && (
                  <p className="mt-1.5 text-xs text-yellow-500">
                    You can comment again in ~{cooldownRemaining}s
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-600">
                    {newContent.length > 0
                      ? `${newContent.length}/1000 ${t("chars")}`
                      : t("enterHint")}
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!newContent.trim() || submitting || cooldownRemaining > 0}
                    className="rounded-full bg-[#B4E3BD] px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cooldownRemaining > 0
                      ? `${cooldownRemaining}s`
                      : submitting
                        ? t("sending")
                        : replyTo
                          ? t("reply")
                          : t("send")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-dashed border-gray-800 px-4 py-3 text-center text-xs text-gray-500">
            {t("loginPrompt")}
          </div>
        )}

        {comments.length > 0 && <div className="mb-4 border-t border-gray-800" />}

        {loading && <div className="py-8 text-center text-sm text-gray-500">{t("loading")}</div>}

        {!loading && error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-4 text-center text-sm text-red-400">
            {error}
            <button type="button" onClick={loadComments} className="ml-2 underline transition hover:text-red-300">
              {t("retry")}
            </button>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">{t("empty")}</div>
        )}

        {!loading && !error && comments.length > 0 && (
          <div className="space-y-1">
            {visibleParents.map((comment) => renderComment(comment))}
            {/* Sentinel for infinite scroll — always rendered so the observer never loses its target */}
            <div
              ref={sentinelRef}
              className={`flex justify-center py-4 ${visibleParentCount >= comments.length ? "invisible pointer-events-none h-0 py-0" : ""}`}
            >
              {visibleParentCount < comments.length && (
                <span className="text-xs text-gray-500">Scroll for more comments...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}