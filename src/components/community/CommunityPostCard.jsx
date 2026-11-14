import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import CommunityMediaViewer from './CommunityMediaViewer';

export default function CommunityPostCard({
  post,
  currentUser,
  onTagClick,
  onPostDeleted,
  onRequireAuth,
  onActionNotification,
}) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Poll state
  const [poll, setPoll] = useState(post.poll);
  const [selectedPollOptions, setSelectedPollOptions] = useState([]);
  const [isVoting, setIsVoting] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Lightbox viewer state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date
  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (_) {
      return 'Recently';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getDocIcon = (mime = '', name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (mime.includes('pdf') || ext === 'pdf') return { icon: 'picture_as_pdf', color: 'text-red-400' };
    if (mime.includes('word') || ['doc', 'docx'].includes(ext)) return { icon: 'article', color: 'text-blue-400' };
    if (mime.includes('excel') || mime.includes('spreadsheet') || ['xls', 'xlsx'].includes(ext)) return { icon: 'table_view', color: 'text-emerald-400' };
    if (mime.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return { icon: 'slideshow', color: 'text-amber-400' };
    return { icon: 'description', color: 'text-slate-400' };
  };

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic toggle
    const nextState = !isLiked;
    const nextCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextState);
    setLikesCount(nextCount);

    try {
      const res = await apiService.toggleCommunityPostLike(post.id);
      setIsLiked(res.is_liked);
      setLikesCount(res.likes);
    } catch (err) {
      // Revert on error
      setIsLiked(!nextState);
      setLikesCount(likesCount);
      onActionNotification?.('Could not update like. Please verify backend connection.');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Poll Vote
  const handleVotePoll = async () => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (selectedPollOptions.length === 0 || !poll) return;

    setIsVoting(true);
    try {
      const updatedPoll = await apiService.voteCommunityPoll(poll.id, selectedPollOptions);
      setPoll(updatedPoll);
      onActionNotification?.('Your vote has been recorded!');
    } catch (err) {
      onActionNotification?.(err.message || 'Failed to submit vote.');
    } finally {
      setIsVoting(false);
    }
  };

  // Toggle comments
  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const fetched = await apiService.getCommunityComments(post.id);
        setComments(Array.isArray(fetched) ? fetched : []);
        setCommentsCount(fetched.length);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await apiService.createCommunityComment(post.id, newCommentText.trim(), replyingToId);
      setComments((prev) => [...prev, newComment]);
      setCommentsCount((prev) => prev + 1);
      setNewCommentText('');
      setReplyingToId(null);
      onActionNotification?.('Comment posted!');
    } catch (err) {
      onActionNotification?.(err.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await apiService.deleteCommunityComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      onActionNotification?.('Comment removed.');
    } catch (err) {
      onActionNotification?.(err.message || 'Failed to delete comment.');
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    setIsDeleting(true);
    try {
      await apiService.deleteCommunityPost(post.id);
      onActionNotification?.('Post deleted successfully.');
      onPostDeleted?.(post.id);
    } catch (err) {
      onActionNotification?.(err.message || 'Failed to delete post.');
      setIsDeleting(false);
    }
  };

  // Share post link
  const handleShare = () => {
    try {
      const shareUrl = `${window.location.origin}/#post-${post.id}`;
      navigator.clipboard.writeText(shareUrl);
      onActionNotification?.('Post link copied to clipboard!');
    } catch (_) {
      onActionNotification?.('Could not copy link to clipboard.');
    }
  };

  const images = (post.attachments || []).filter((a) => a.file_type === 'image');
  const documents = (post.attachments || []).filter((a) => a.file_type === 'document');

  const hasUserVoted = (poll?.user_voted_option_ids || []).length > 0;
  const isPollClosed = poll?.is_expired || false;
  const showPollResults = hasUserVoted || isPollClosed;

  return (
    <div
      id={`post-${post.id}`}
      className="bg-[#081528] rounded-2xl border border-slate-800/90 p-5 md:p-6 shadow-xl space-y-4 hover:border-slate-700/80 transition-all duration-200"
    >
      {/* 1. Header: Author & Options */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar Initials */}
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#71d8c8]/25 via-[#bac3ff]/20 to-[#04132a] border border-[#71d8c8]/40 flex items-center justify-center font-bold text-xs text-[#71d8c8] shadow-inner shrink-0">
            {post.author_initials || 'CS'}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white tracking-wide">{post.author_name}</h4>
              {post.author_role && post.author_role !== 'Student' && (
                <span className="text-[10px] uppercase font-bold text-[#e6c277] bg-[#e6c277]/10 px-2 py-0.5 rounded-full border border-[#e6c277]/30">
                  {post.author_role}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {post.author_department || 'Campus Peer'} {post.author_semester ? `• Sem ${post.author_semester}` : ''} •{' '}
              <span className="text-slate-500">{formatTime(post.created_at)}</span>
            </p>
          </div>
        </div>

        {/* Delete Post action if user owns it or is admin */}
        {post.can_delete && (
          <button
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
            title="Delete this post"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        )}
      </div>

      {/* 2. Post Content */}
      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words">
        {post.content}
      </div>

      {/* 3. Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((t) => (
            <button
              key={t}
              onClick={() => onTagClick?.(t)}
              className="text-xs font-semibold text-[#71d8c8] bg-[#71d8c8]/10 hover:bg-[#71d8c8]/20 px-2.5 py-0.5 rounded-lg border border-[#71d8c8]/20 transition-colors cursor-pointer"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* 4. Responsive Media Gallery (Images) */}
      {images.length > 0 && (
        <div className="pt-1">
          {images.length === 1 ? (
            <div
              className="rounded-xl overflow-hidden border border-slate-800 bg-[#04132a] cursor-pointer group"
              onClick={() => setLightboxIndex(0)}
            >
              <img
                src={images[0].file_url}
                alt={images[0].file_name}
                className="w-full max-h-[440px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          ) : images.length === 2 ? (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="rounded-xl overflow-hidden border border-slate-800 bg-[#04132a] aspect-4/3 cursor-pointer group"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img
                    src={img.file_url}
                    alt={img.file_name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : images.length === 3 ? (
            <div className="grid grid-cols-3 gap-2">
              <div
                className="col-span-2 rounded-xl overflow-hidden border border-slate-800 bg-[#04132a] aspect-4/3 cursor-pointer group"
                onClick={() => setLightboxIndex(0)}
              >
                <img
                  src={images[0].file_url}
                  alt={images[0].file_name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="grid grid-rows-2 gap-2">
                {images.slice(1, 3).map((img, i) => (
                  <div
                    key={img.id}
                    className="rounded-xl overflow-hidden border border-slate-800 bg-[#04132a] aspect-4/3 cursor-pointer group"
                    onClick={() => setLightboxIndex(i + 1)}
                  >
                    <img
                      src={img.file_url}
                      alt={img.file_name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {images.slice(0, 4).map((img, i) => {
                const isFourth = i === 3 && images.length > 4;
                return (
                  <div
                    key={img.id}
                    className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#04132a] aspect-video cursor-pointer group"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img
                      src={img.file_url}
                      alt={img.file_name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    {isFourth && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center font-bold text-white text-lg">
                        +{images.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Document Attachments */}
      {documents.length > 0 && (
        <div className="space-y-2 pt-1">
          {documents.map((doc) => {
            const docStyle = getDocIcon(doc.mime_type, doc.file_name);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#04132a] border border-slate-800 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <span className={`material-symbols-outlined text-2xl ${docStyle.color}`}>{docStyle.icon}</span>
                  <div className="truncate">
                    <span className="text-white font-medium block truncate max-w-xs md:max-w-md">{doc.file_name}</span>
                    <span className="text-slate-500 text-[11px]">{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  download={doc.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-[#71d8c8] hover:text-[#04132a] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download</span>
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Interactive Poll Section */}
      {poll && (
        <div className="p-4 rounded-xl bg-[#04132a] border border-slate-800 space-y-3 pt-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#e6c277]">poll</span>
              <span>{poll.question}</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {isPollClosed ? (
                <span className="text-red-400 font-semibold">Closed</span>
              ) : (
                <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
              )}
            </span>
          </div>

          {/* Options Display */}
          <div className="space-y-2">
            {poll.options.map((opt) => {
              const isVotedByMe = (poll.user_voted_option_ids || []).includes(opt.id);
              const isSelected = selectedPollOptions.includes(opt.id);

              if (showPollResults) {
                return (
                  <div key={opt.id} className="relative rounded-lg overflow-hidden bg-[#081528] border border-slate-800 p-2.5">
                    {/* Progress Bar */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ${
                        isVotedByMe
                          ? 'bg-linear-to-r from-[#71d8c8]/30 to-[#bac3ff]/30 border-r-2 border-[#71d8c8]'
                          : 'bg-slate-800/50'
                      }`}
                      style={{ width: `${Math.max(opt.percentage, 2)}%` }}
                    />
                    <div className="relative flex items-center justify-between text-xs z-10">
                      <div className="flex items-center gap-2">
                        {isVotedByMe && (
                          <span className="material-symbols-outlined text-xs text-[#71d8c8]">check_circle</span>
                        )}
                        <span className={`font-medium ${isVotedByMe ? 'text-[#71d8c8] font-bold' : 'text-slate-200'}`}>
                          {opt.option_text}
                        </span>
                      </div>
                      <span className="text-slate-400 font-semibold">{opt.percentage}% ({opt.votes_count})</span>
                    </div>
                  </div>
                );
              }

              // Voting interface
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (poll.is_multiple_choice) {
                      setSelectedPollOptions((prev) =>
                        prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                      );
                    } else {
                      setSelectedPollOptions([opt.id]);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#71d8c8]/15 border-[#71d8c8] text-[#71d8c8]'
                      : 'bg-[#081528] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      {isSelected ? (poll.is_multiple_choice ? 'check_box' : 'radio_button_checked') : (poll.is_multiple_choice ? 'check_box_outline_blank' : 'radio_button_unchecked')}
                    </span>
                    <span>{opt.option_text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Poll Footer & Submit */}
          {!showPollResults && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                {poll.is_multiple_choice ? 'Select one or more' : 'Select one option'}
              </span>
              <button
                type="button"
                onClick={handleVotePoll}
                disabled={isVoting || selectedPollOptions.length === 0}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isVoting || selectedPollOptions.length === 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-[#71d8c8] text-[#04132a] hover:opacity-90 shadow-sm'
                }`}
              >
                {isVoting ? 'Voting...' : 'Submit Vote'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Action Bar: Like, Comment, Share */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
              isLiked ? 'text-rose-400 drop-shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${isLiked ? 'font-fill' : ''}`}>
              {isLiked ? 'favorite' : 'favorite_border'}
            </span>
            <span>{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white font-semibold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">chat_bubble_outline</span>
            <span>{commentsCount}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-slate-400 hover:text-[#71d8c8] font-semibold transition-all cursor-pointer"
          title="Share post"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* 8. Comments & Discussion Section */}
      {showComments && (
        <div className="pt-3 border-t border-slate-800/60 space-y-3 animate-in fade-in duration-200">
          {/* Comment Composer */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={replyingToId ? `Replying to comment #${replyingToId}...` : 'Write a constructive comment or answer...'}
              maxLength={1000}
              className="flex-1 bg-[#04132a] border border-slate-800 focus:border-[#71d8c8] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
            />
            {replyingToId && (
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                title="Cancel reply"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmittingComment || !newCommentText.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSubmittingComment || !newCommentText.trim()
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-[#71d8c8] text-[#04132a] hover:opacity-90'
              }`}
            >
              Post
            </button>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin text-[#71d8c8]">progress_activity</span>
              <span>Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No comments yet. Start the conversation!</p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-[#04132a] border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-[#71d8c8]">
                        {c.author_initials || 'CS'}
                      </div>
                      <span className="font-bold text-white">{c.author_name}</span>
                      <span className="text-[10px] text-slate-500">
                        {c.author_department || 'Student'} • {formatTime(c.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(c.id);
                          setNewCommentText(`@${c.author_name} `);
                        }}
                        className="text-[11px] text-slate-400 hover:text-[#71d8c8]"
                      >
                        Reply
                      </button>
                      {c.can_delete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-500 hover:text-red-400 p-0.5"
                          title="Delete comment"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300 pl-8 leading-relaxed whitespace-pre-line">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <CommunityMediaViewer
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

