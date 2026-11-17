import React, { useState, useRef } from 'react';
import { apiService } from '../../services/apiService';

const SUGGESTED_TAGS = ['General', 'DSA', 'Placements', 'BTUExams', 'WebDev', 'AI_ML', 'ProjectCollab', 'LostAndFound'];

export default function CommunityPostComposer({ currentUser, onPostCreated, onRequireAuth, onActionNotification }) {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState(['General']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [pollDurationDays, setPollDurationDays] = useState(7);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Attachments state
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleAddCustomTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = customTagInput.trim().replace(/^#+/, '');
      if (clean && !selectedTags.includes(clean) && selectedTags.length < 5) {
        setSelectedTags([...selectedTags, clean]);
      }
      setCustomTagInput('');
    }
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!currentUser) {
      onRequireAuth?.();
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    for (const file of files) {
      try {
        const attachment = await apiService.uploadCommunityAttachment(file);
        setUploadedAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        console.error('File upload failed:', err);
        setUploadError(err.message || `Failed to upload ${file.name}`);
        onActionNotification?.(`Upload failed: ${err.message || file.name}`);
      }
    }

    setIsUploading(false);
    // Reset file inputs
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleRemoveAttachment = async (id) => {
    try {
      if (apiService.deleteCommunityAttachment) {
        await apiService.deleteCommunityAttachment(id);
      }
    } catch (_) {
      // Best effort deletion
    }
    setUploadedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (idx, val) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }

    if (!content.trim() || content.trim().length < 3) {
      setUploadError('Post content must be at least 3 characters long.');
      return;
    }

    // Validate poll if enabled
    let pollPayload = null;
    if (isPollOpen) {
      if (!pollQuestion.trim() || pollQuestion.trim().length < 3) {
        setUploadError('Please provide a valid poll question (at least 3 characters).');
        return;
      }
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setUploadError('A poll requires at least 2 non-empty options.');
        return;
      }
      pollPayload = {
        question: pollQuestion.trim(),
        options: validOptions,
        is_multiple_choice: isMultipleChoice,
        duration_days: pollDurationDays,
      };
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const payload = {
        content: content.trim(),
        tags: selectedTags,
        attachment_ids: uploadedAttachments.map((a) => a.id),
        attachments: uploadedAttachments,
        poll: pollPayload,
      };

      const created = await apiService.createCommunityPost(payload);

      // Reset form
      setContent('');
      setSelectedTags(['General']);
      setUploadedAttachments([]);
      setIsPollOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setIsPreviewMode(false);

      onActionNotification?.('Discussion published successfully to Campus Community!');
      onPostCreated?.(created);
    } catch (err) {
      console.error('Post creation failed:', err);
      setUploadError(err.message || 'Failed to publish post. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CS';

  const userDept = currentUser?.department || 'ECA Student';
  const userSem = currentUser?.semester ? `Sem ${currentUser.semester}` : '';

  const imageAttachments = uploadedAttachments.filter((a) => a.file_type === 'image');
  const docAttachments = uploadedAttachments.filter((a) => a.file_type === 'document');

  return (
    <div className="bg-[#081528] rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative overflow-hidden transition-all hover:border-slate-700">
      {/* Header with Author identity */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#71d8c8]/20 via-[#bac3ff]/20 to-[#04132a] border border-[#71d8c8]/30 flex items-center justify-center font-bold text-xs text-[#71d8c8] shadow-inner">
            {userInitials}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">
              {currentUser?.name || 'Guest / Campus Student'}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {currentUser ? `${userDept} ${userSem ? `• ${userSem}` : ''}` : 'Sign in to participate & post'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Write vs Preview */}
        <div className="flex items-center bg-[#04132a] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setIsPreviewMode(false)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              !isPreviewMode ? 'bg-[#71d8c8] text-[#04132a] shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Compose
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isPreviewMode ? 'bg-[#71d8c8] text-[#04132a] shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Error alert */}
      {uploadError && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-red-400">error</span>
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-200">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Composer Body */}
      {!isPreviewMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Textarea */}
          <div className="relative">
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your department or cohort? Ask a question, share academic notes, hackathon updates, or start a discussion..."
              maxLength={3000}
              className="w-full bg-[#04132a]/80 border border-slate-800 focus:border-[#71d8c8] rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden transition-all resize-y min-h-[110px]"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 px-1">
              <span>Supports hashtags and college discussion links</span>
              <span>{content.length}/3000</span>
            </div>
          </div>

          {/* Tag Selector */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-[#71d8c8]">sell</span>
              <span>Topics & Cohorts (Pick up to 5)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {SUGGESTED_TAGS.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#71d8c8]/20 text-[#71d8c8] border border-[#71d8c8]/50 shadow-xs'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="+ Add tag (Enter)"
                className="bg-transparent border border-dashed border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:border-[#71d8c8] focus:outline-hidden w-28"
              />
            </div>
          </div>

          {/* Interactive Poll Builder Drawer */}
          {isPollOpen && (
            <div className="p-4 rounded-xl bg-[#04132a] border border-[#71d8c8]/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-[#71d8c8] flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-sm">poll</span>
                  <span>Create Live Poll</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsPollOpen(false)}
                  className="text-slate-400 hover:text-red-400 text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Remove Poll</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Poll Question</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which elective are you planning to choose this semester?"
                  maxLength={300}
                  className="w-full bg-[#081528] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-[#71d8c8] focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 block">Options (2 to 6)</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      maxLength={200}
                      className="flex-1 bg-[#081528] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-[#71d8c8] focus:outline-hidden"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        title="Remove option"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs font-semibold text-[#71d8c8] hover:underline flex items-center gap-1 pt-1"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMultipleChoice}
                    onChange={(e) => setIsMultipleChoice(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-[#71d8c8] focus:ring-0"
                  />
                  <span>Allow multiple choices</span>
                </label>

                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-[11px] text-slate-400">Duration:</span>
                  <select
                    value={pollDurationDays}
                    onChange={(e) => setPollDurationDays(Number(e.target.value))}
                    className="bg-[#081528] border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-hidden"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (Standard)</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Attachments Preview Strip */}
          {uploadedAttachments.length > 0 && (
            <div className="space-y-2 pt-1">
              {/* Images */}
              {imageAttachments.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Attached Images ({imageAttachments.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imageAttachments.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-[#04132a] aspect-video">
                        <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(img.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors"
                          title="Remove image"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {docAttachments.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Attached Documents ({docAttachments.length})
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {docAttachments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#04132a] border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined text-base text-[#bac3ff]">description</span>
                          <span className="text-slate-200 font-medium truncate max-w-xs">{doc.file_name}</span>
                          <span className="text-slate-500 text-[10px]">({formatFileSize(doc.file_size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(doc.id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                          title="Remove file"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {/* Attachment buttons */}
            <div className="flex items-center gap-1.5">
              {/* Photo Upload */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Attach photos (JPG, PNG, WebP)"
              >
                <span className="material-symbols-outlined text-sm text-[#71d8c8]">image</span>
                <span>Photo</span>
              </button>

              {/* Document Upload */}
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'document')}
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Attach documents (PDF, Word, Excel, PPT)"
              >
                <span className="material-symbols-outlined text-sm text-[#bac3ff]">attach_file</span>
                <span>Document</span>
              </button>

              {/* Poll Toggle */}
              <button
                type="button"
                onClick={() => setIsPollOpen(!isPollOpen)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPollOpen
                    ? 'bg-[#71d8c8]/20 text-[#71d8c8] border-[#71d8c8]/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="Create a live poll"
              >
                <span className="material-symbols-outlined text-sm text-[#e6c277]">poll</span>
                <span>Poll</span>
              </button>
            </div>

            {/* Submit / Post Button */}
            <div className="flex items-center gap-2">
              {isUploading && (
                <span className="text-xs text-[#71d8c8] flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Uploading media...</span>
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isUploading || !content.trim() || content.trim().length < 3}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  isSubmitting || isUploading || !content.trim() || content.trim().length < 3
                    ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#71d8c8] to-[#bac3ff] text-[#04132a] hover:opacity-95 shadow-md shadow-[#71d8c8]/25 cursor-pointer active:scale-98'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold">send</span>
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Preview Mode */
        <div className="space-y-4 py-2 animate-in fade-in">
          <div className="p-4 rounded-xl bg-[#04132a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#71d8c8]/20 via-[#bac3ff]/20 to-[#04132a] border border-[#71d8c8]/30 flex items-center justify-center font-bold text-xs text-[#71d8c8]">
                  {userInitials}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">{currentUser?.name || 'You'}</h5>
                  <p className="text-[10px] text-slate-400">
                    {userDept} {userSem ? `• ${userSem}` : ''} • Just now
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#71d8c8] bg-[#71d8c8]/10 px-2 py-0.5 rounded-full border border-[#71d8c8]/20">
                Preview Mode
              </span>
            </div>

            <p className="text-sm text-slate-200 whitespace-pre-line">
              {content || <span className="text-slate-600 italic">No text written yet.</span>}
            </p>

            {/* Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((t) => (
                  <span key={t} className="text-[11px] font-semibold text-[#71d8c8] bg-[#71d8c8]/10 px-2 py-0.5 rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Poll Preview */}
            {isPollOpen && pollQuestion && (
              <div className="p-3 rounded-lg bg-[#081528] border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">📊 {pollQuestion}</span>
                <div className="space-y-1.5">
                  {pollOptions.filter(Boolean).map((opt, i) => (
                    <div key={i} className="p-2 rounded-md bg-[#04132a] border border-slate-800 text-xs text-slate-300">
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  {isMultipleChoice ? 'Multiple choice allowed' : 'Single choice'} • Poll open for {pollDurationDays} days
                </p>
              </div>
            )}

            {/* Attachments preview */}
            {imageAttachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imageAttachments.map((img) => (
                  <img key={img.id} src={img.file_url} alt="" className="rounded-lg object-cover h-36 w-full" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim() || content.trim().length < 3}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#71d8c8] to-[#bac3ff] text-[#04132a] text-xs font-extrabold shadow-md hover:opacity-95 cursor-pointer active:scale-98"
            >
              Looks Great, Publish!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

