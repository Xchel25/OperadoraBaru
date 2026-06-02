import { useEffect, useState, useRef, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { apiGetCourses, apiGetMyProgress, apiCreateCourse, apiUpdateProgress, apiDeleteCourse } from "../services/api";
import {
  BookOpen, Clock, CheckCircle, Award, Play, Plus, Video,
  FileText, ExternalLink, X as XIcon, Search, Filter,
  Users, Link2, ClipboardList, ChevronDown, Trash2, AlertTriangle,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../config/roles";
import Modal from "../components/Modal";
import { useLanguage } from "../context/LanguageContext";

const COURSE_COLORS = [
  "from-blue-500 to-blue-700",
  "from-amber-500 to-amber-700",
  "from-violet-500 to-violet-700",
  "from-green-500 to-green-700",
  "from-rose-500 to-rose-700",
  "from-gray-500 to-gray-700",
];

const CATEGORIES = ["Seguridad", "Liderazgo", "Sostenibilidad", "Atención al cliente", "TI", "RRHH", "General"];
const ALL_ROLES   = Object.keys(ROLE_LABELS);

// ─── helpers ─────────────────────────────────────────────────────────────────

function getYoutubeId(url) {
  if (!url) return null;
  const m1 = url.match(/[?&]v=([^&]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([^?]+)/);
  if (m2) return m2[1];
  return null;
}

function getVimeoId(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function toEmbedUrl(url) {
  if (!url) return null;
  const ytId = getYoutubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?enablejsapi=1`;
  const viId = getVimeoId(url);
  if (viId) return `https://player.vimeo.com/video/${viId}?api=1`;
  return null;
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

const VIDEO_EXTS = ["mp4", "mov", "avi", "webm", "mkv", "m4v"];

function detectContentType(url) {
  if (!url) return null;
  if (url.startsWith("/uploads/")) {
    const ext = url.split(".").pop().toLowerCase();
    return VIDEO_EXTS.includes(ext) ? "localvideo" : "localfile";
  }
  if (getYoutubeId(url)) return "youtube";
  if (getVimeoId(url))   return "vimeo";
  if (/docs\.google\.com\/forms|forms\.gle|typeform\.com|jotform\.com|surveymonkey|encuesta/i.test(url)) return "form";
  return "link";
}

const CONTENT_TYPE_META = {
  youtube:    { icon: Video,         label: "Video",         color: "text-red-500",      bg: "bg-red-50 dark:bg-red-500/10" },
  vimeo:      { icon: Video,         label: "Video",         color: "text-blue-500",     bg: "bg-blue-50 dark:bg-blue-500/10" },
  localvideo: { icon: Video,         label: "Video local",   color: "text-purple-500",   bg: "bg-purple-50 dark:bg-purple-500/10" },
  localfile:  { icon: FileText,      label: "Archivo",       color: "text-teal-500",     bg: "bg-teal-50 dark:bg-teal-500/10" },
  form:       { icon: ClipboardList, label: "Formulario",    color: "text-violet-500",   bg: "bg-violet-50 dark:bg-violet-500/10" },
  link:       { icon: Link2,         label: "Enlace",        color: "text-teal-500",     bg: "bg-teal-50 dark:bg-teal-500/10" },
};

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

// ─── CourseDetailModal ────────────────────────────────────────────────────────

function CourseDetailModal({ curso, userProgress, onProgressUpdate }) {
  const embedUrl    = toEmbedUrl(curso.videoUrl);
  const contentType = detectContentType(curso.videoUrl);
  const ytId        = getYoutubeId(curso.videoUrl);
  const [localProgress, setLocalProgress] = useState(userProgress);
  const [saving, setSaving]               = useState(false);
  const [contentOpened, setContentOpened] = useState(localProgress >= 50);
  const iframeRef   = useRef(null);
  const playerRef   = useRef(null);
  const pollRef     = useRef(null);
  const progressRef = useRef(localProgress);
  progressRef.current = localProgress;

  const saveProgress = useCallback(async (value) => {
    if (value <= progressRef.current) return;
    setSaving(true);
    try {
      await apiUpdateProgress(curso.id, value);
      progressRef.current = value;
      setLocalProgress(value);
      onProgressUpdate(curso.id, value);
    } catch { /* no-op */ } finally { setSaving(false); }
  }, [curso.id, onProgressUpdate]);

  // Auto 25% al abrir el modal
  useEffect(() => {
    if (localProgress === 0) saveProgress(25);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── YouTube IFrame API — progreso automático ──────────────────────
  useEffect(() => {
    if (contentType !== "youtube" || !ytId) return;

    const stopPolling = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    const startPolling = (player) => {
      stopPolling();
      pollRef.current = setInterval(() => {
        try {
          const dur = player.getDuration();
          const cur = player.getCurrentTime();
          if (!dur || dur <= 0) return;
          const pct = (cur / dur) * 100;
          if      (pct >= 90) saveProgress(100);
          else if (pct >= 75) saveProgress(75);
          else if (pct >= 50) saveProgress(50);
        } catch { /* no-op */ }
      }, 4000);
    };

    const createPlayer = () => {
      if (playerRef.current) return;
      const el = document.getElementById(`yt-${curso.id}`);
      if (!el || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(`yt-${curso.id}`, {
        videoId: ytId,
        playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onStateChange: ({ data }) => {
            const S = window.YT.PlayerState;
            if      (data === S.PLAYING)  startPolling(playerRef.current);
            else if (data === S.PAUSED)   stopPolling();
            else if (data === S.ENDED)    { saveProgress(100); stopPolling(); }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id    = "yt-api-script";
        tag.src   = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); createPlayer(); };
    }

    return () => {
      stopPolling();
      try { playerRef.current?.destroy(); } catch { /* no-op */ }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, ytId]);

  // ── Vimeo postMessage API — progreso automático ───────────────────
  useEffect(() => {
    if (contentType !== "vimeo") return;
    const handleMsg = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "playProgress") {
          const pct = (data.data?.percent ?? 0) * 100;
          if      (pct >= 90) saveProgress(100);
          else if (pct >= 75) saveProgress(75);
          else if (pct >= 50) saveProgress(50);
        }
        if (data?.event === "finish") saveProgress(100);
      } catch { /* no-op */ }
    };
    window.addEventListener("message", handleMsg);
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "playProgress" }), "*");
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "finish" }), "*");
    }, 1500);
    return () => { window.removeEventListener("message", handleMsg); clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  const progressColor =
    localProgress === 100 ? "from-green-500 to-emerald-600" :
    localProgress >= 50   ? "from-blue-500 to-blue-700" :
                            curso.color;

  const isVideoType = ["youtube", "vimeo", "localvideo"].includes(contentType);

  return (
    <div className="space-y-5">

      {/* CONTENIDO PRINCIPAL */}
      {contentType === "localvideo" ? (
        <video
          src={`${BASE_URL}${curso.videoUrl}`}
          controls
          className="w-full rounded-xl bg-black"
          style={{ maxHeight: "360px" }}
          onTimeUpdate={(e) => {
            const { currentTime, duration } = e.target;
            if (!duration) return;
            const pct = (currentTime / duration) * 100;
            if      (pct >= 90) saveProgress(100);
            else if (pct >= 75) saveProgress(75);
            else if (pct >= 50) saveProgress(50);
          }}
          onEnded={() => saveProgress(100)}
        />
      ) : contentType === "youtube" ? (
        /* Div placeholder — YouTube IFrame API crea el iframe aquí */
        <div className="rounded-xl overflow-hidden aspect-video bg-black">
          <div id={`yt-${curso.id}`} className="w-full h-full" />
        </div>
      ) : embedUrl ? (
        /* Vimeo u otros embeds */
        <div className="rounded-xl overflow-hidden aspect-video bg-black">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={curso.title}
          />
        </div>
      ) : curso.videoUrl ? (
        /* Formulario / encuesta / archivo / enlace externo */
        <div className={`rounded-xl p-6 bg-gradient-to-br ${curso.color} flex flex-col items-center gap-4 text-white`}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            {contentType === "form"      ? <ClipboardList className="w-8 h-8 text-white" /> :
             contentType === "localfile" ? <FileText className="w-8 h-8 text-white" /> :
             <Link2 className="w-8 h-8 text-white" />}
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">
              {contentType === "form"      ? "Formulario / Encuesta" :
               contentType === "localfile" ? "Archivo adjunto" : "Contenido externo"}
            </p>
            <p className="text-sm opacity-75 mt-1">Abre el contenido para completarlo</p>
          </div>
          <a
            href={contentType === "localfile" ? `${BASE_URL}${curso.videoUrl}` : curso.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { setContentOpened(true); saveProgress(50); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-white/90 transition shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            {contentType === "form" ? "Ir al formulario" : contentType === "localfile" ? "Abrir archivo" : "Ir al contenido"}
          </a>
        </div>
      ) : (
        <div className={`rounded-xl aspect-video bg-gradient-to-br ${curso.color} flex flex-col items-center justify-center`}>
          <Video className="w-10 h-10 text-white/40 mb-2" />
          <p className="text-sm text-white/50">Sin contenido adjunto</p>
        </div>
      )}

      {/* INFO */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{curso.title}</h3>
          {curso.mandatory && (
            <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 font-medium">
              Obligatorio
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-white/50">{curso.instructor} · {curso.category}</p>
        {curso.description && (
          <p className="text-sm text-gray-600 dark:text-white/60 mt-3 leading-relaxed">{curso.description}</p>
        )}
      </div>

      {/* MATERIAL ADJUNTO */}
      {curso.attachmentUrl && (
        <a
          href={curso.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Material de apoyo</p>
            <p className="text-xs text-blue-500/70 dark:text-blue-400/60 truncate">{curso.attachmentUrl}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
        </a>
      )}

      {/* PROGRESO */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-white">Mi progreso</span>
          <span className={`text-sm font-black ${localProgress === 100 ? "text-green-500" : "text-gray-900 dark:text-white"}`}>
            {saving ? "Guardando..." : localProgress === 100 ? "✓ Completado" : `${localProgress}%`}
          </span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className={`h-2.5 rounded-full bg-gradient-to-r ${progressColor} transition-all duration-700`}
            style={{ width: `${localProgress}%` }}
          />
        </div>

        {/* Indicador para videos: progreso automático */}
        {isVideoType && localProgress < 100 && (
          <p className="text-xs text-gray-400 dark:text-white/30 flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
            El progreso se registra automáticamente mientras ves el video
          </p>
        )}

        {/* Etiquetas de hitos para no-video */}
        {!isVideoType && (
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/30 mb-3">
            <span>Sin iniciar</span>
            <span>Iniciado</span>
            <span>Completado</span>
          </div>
        )}

        {/* Botón completar — solo para formularios/archivos/enlaces */}
        {localProgress < 100 && curso.videoUrl && !isVideoType && (
          <button
            onClick={() => saveProgress(100)}
            disabled={!contentOpened || saving}
            className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            {!contentOpened ? "Abre el contenido primero" : saving ? "Guardando..." : "✓ He completado este contenido"}
          </button>
        )}

        {/* Sin contenido: botón de respaldo */}
        {localProgress < 100 && !curso.videoUrl && (
          <button
            onClick={() => saveProgress(100)}
            disabled={saving || localProgress < 25}
            className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            {saving ? "Guardando..." : "✓ Marcar como completado"}
          </button>
        )}

        {localProgress === 100 && (
          <div className="flex items-center justify-center gap-2 py-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">¡Muy bien! Curso completado</span>
          </div>
        )}

        {/* Stats globales del curso */}
        {curso.stats && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-400 dark:text-white/30">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              {curso.stats.completed} de {curso.stats.total} completaron
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {curso.stats.started} iniciaron
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────

function CourseCard({ title, instructor, progress, color, category, mandatory, videoUrl, stats, onClick, onDelete, canDelete }) {
  const thumbnail   = getYoutubeThumbnail(videoUrl);
  const contentType = detectContentType(videoUrl);
  const meta        = contentType ? CONTENT_TYPE_META[contentType] : null;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:shadow-lg dark:hover:shadow-black/30 transition group cursor-pointer"
    >
      {/* HEADER — thumbnail o degradado */}
      <div className="relative h-36 overflow-hidden">
        {thumbnail ? (
          <>
            <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <div className={`h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white,transparent)]" />
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
              {meta
                ? <meta.icon className="w-5 h-5 text-white" />
                : <Play className="w-5 h-5 text-white ml-0.5" />
              }
            </div>
          </div>
        )}

        {/* Botón eliminar — solo PROJECT_MANAGER */}
        {canDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Desactivar curso"
            className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        )}

        {/* Badge completado */}
        {progress === 100 && (
          <div className={`absolute flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 shadow ${canDelete ? "top-2 left-10" : "top-2 left-2"}`}>
            <CheckCircle className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-semibold">Completado</span>
          </div>
        )}

        {/* Badge tipo de contenido */}
        {meta && (
          <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/40 text-white font-medium backdrop-blur-sm flex items-center gap-1">
            <meta.icon className="w-3 h-3" /> {meta.label}
          </span>
        )}

        {/* Badge obligatorio (si no hay tipo) */}
        {!meta && mandatory && (
          <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/30 text-white font-medium backdrop-blur-sm">
            Obligatorio
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="p-4">
        <p className="font-semibold text-sm text-gray-800 dark:text-white mb-0.5 truncate">{title}</p>
        <p className="text-xs text-gray-400 dark:text-white/40 mb-3 truncate">{instructor} · {category}</p>

        {/* Barra de progreso */}
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400 dark:text-white/40">Progreso</span>
          <span className={`text-xs font-semibold ${progress === 100 ? "text-green-500" : "text-gray-600 dark:text-white/60"}`}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className={`h-1.5 rounded-full transition-all ${progress === 100 ? "bg-green-500" : `bg-gradient-to-r ${color}`}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats de completados */}
        {stats && (
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/30 border-t border-gray-50 dark:border-white/5 pt-2">
            <Users className="w-3 h-3" />
            <span>{stats.completed}/{stats.total} completaron</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CourseForm ───────────────────────────────────────────────────────────────

function ModeToggle({ value, onChange, options }) {
  return (
    <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex-1 py-1.5 text-xs font-medium transition ${
            value === o.key
              ? "bg-blue-500 text-white"
              : "text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilePicker({ accept, maxLabel, file, onChange, iconComponent }) {
  const ref = useRef();
  const PickerIcon = iconComponent;
  return (
    <div
      onClick={() => ref.current.click()}
      className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition"
    >
      <PickerIcon className="w-6 h-6 mx-auto text-gray-300 dark:text-white/20 mb-1" />
      {file
        ? <p className="text-sm font-medium text-gray-700 dark:text-white/80">{file.name}</p>
        : <p className="text-xs text-gray-400 dark:text-white/40">Haz clic para seleccionar · {maxLabel}</p>
      }
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files[0])} />
    </div>
  );
}

function CourseForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    title: "", instructor: "", description: "", category: "General",
    mandatory: false, videoUrl: "", attachmentUrl: "", targetRoles: [], targetEmails: [],
  });
  const [videoMode,   setVideoMode]   = useState("url");   // "url" | "file"
  const [attachMode,  setAttachMode]  = useState("url");   // "url" | "file"
  const [videoFile,   setVideoFile]   = useState(null);
  const [attachFile,  setAttachFile]  = useState(null);
  const [emailInput,  setEmailInput]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const previewType = detectContentType(form.videoUrl);

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Correo inválido"); return; }
    if (form.targetEmails.includes(email)) { setError("Ese correo ya está en la lista"); return; }
    setForm(f => ({ ...f, targetEmails: [...f.targetEmails, email] }));
    setEmailInput("");
    setError("");
  };

  const removeEmail = (email) => setForm(f => ({ ...f, targetEmails: f.targetEmails.filter(e => e !== email) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.instructor) { setError("Título e instructor son obligatorios"); return; }
    if (videoMode === "file" && !videoFile) { setError("Selecciona un archivo de contenido o cambia a URL"); return; }
    setError("");
    setLoading(true);
    try {
      let payload;
      if (videoMode === "file" || attachMode === "file") {
        const fd = new FormData();
        fd.append("title",       form.title);
        fd.append("instructor",  form.instructor);
        fd.append("description", form.description || "");
        fd.append("category",    form.category);
        fd.append("mandatory",   form.mandatory);
        form.targetRoles.forEach(r => fd.append("targetRoles", r));
        form.targetEmails.forEach(e => fd.append("targetEmails", e));
        if (videoMode === "file" && videoFile)  fd.append("videoFile",      videoFile);
        else if (form.videoUrl)                  fd.append("videoUrl",       form.videoUrl);
        if (attachMode === "file" && attachFile) fd.append("attachmentFile", attachFile);
        else if (form.attachmentUrl)             fd.append("attachmentUrl",  form.attachmentUrl);
        payload = fd;
      } else {
        payload = { ...form, videoUrl: form.videoUrl || null, attachmentUrl: form.attachmentUrl || null };
      }
      const nuevo = await apiCreateCourse(payload);
      onSave(nuevo);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear el curso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Título del curso</label>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="Ej. Seguridad e higiene hotelera"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Instructor / Fuente</label>
        <input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })}
          placeholder="Ej. Lic. Ana Martínez"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Descripción</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción breve del contenido" rows={2}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Categoría</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none dark:[color-scheme:dark]">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col justify-end pb-0.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setForm({ ...form, mandatory: !form.mandatory })}
              className={`w-10 h-5 rounded-full transition relative shrink-0 ${form.mandatory ? "bg-blue-500" : "bg-gray-200 dark:bg-white/20"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.mandatory ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700 dark:text-white/70">Obligatorio</span>
          </label>
        </div>
      </div>

      {/* CONTENIDO DEL CURSO */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block">
          Contenido del curso
          <span className="font-normal text-gray-400 ml-1">(video, encuesta, formulario…)</span>
        </label>
        <ModeToggle
          value={videoMode}
          onChange={v => { setVideoMode(v); setVideoFile(null); }}
          options={[
            { key: "url",  label: "Enlace (YouTube · Forms · Vimeo)" },
            { key: "file", label: "Subir desde computadora" },
          ]}
        />
        {videoMode === "url" ? (
          <>
            <input type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtube.com/... · forms.gle/... · typeform.com/..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            {previewType && (
              <div className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-lg w-fit ${CONTENT_TYPE_META[previewType].bg} ${CONTENT_TYPE_META[previewType].color}`}>
                {(() => { const I = CONTENT_TYPE_META[previewType].icon; return <I className="w-3.5 h-3.5" />; })()}
                Detectado: {CONTENT_TYPE_META[previewType].label}
                {previewType === "youtube" && getYoutubeThumbnail(form.videoUrl) && (
                  <span className="text-gray-400 dark:text-white/30">· miniatura automática</span>
                )}
              </div>
            )}
          </>
        ) : (
          <FilePicker
            accept="video/*,application/pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls"
            maxLabel="MP4, PDF, PPTX · máx. 500 MB"
            file={videoFile}
            onChange={setVideoFile}
            iconComponent={Video}
          />
        )}
      </div>

      {/* MATERIAL DE APOYO */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block">
          Material de apoyo
          <span className="font-normal text-gray-400 ml-1">(opcional)</span>
        </label>
        <ModeToggle
          value={attachMode}
          onChange={v => { setAttachMode(v); setAttachFile(null); }}
          options={[
            { key: "url",  label: "Enlace (Google Drive · Dropbox)" },
            { key: "file", label: "Subir archivo" },
          ]}
        />
        {attachMode === "url" ? (
          <input type="url" value={form.attachmentUrl} onChange={e => setForm({ ...form, attachmentUrl: e.target.value })}
            placeholder="https://drive.google.com/..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        ) : (
          <FilePicker
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.zip"
            maxLabel="PDF, DOCX, PPTX · máx. 500 MB"
            file={attachFile}
            onChange={setAttachFile}
            iconComponent={FileText}
          />
        )}
      </div>

      {/* ROLES */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-2">
          Visible para roles <span className="font-normal text-gray-400">(vacío = todos)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map(role => (
            <button key={role} type="button" onClick={() => toggleRole(role)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                form.targetRoles.includes(role)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/10 hover:border-blue-300"
              }`}>
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* CORREOS */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-2">
          Correos específicos <span className="font-normal text-gray-400">(solo esas personas)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input type="email" value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addEmail())}
            placeholder="correo@empresa.com"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={addEmail}
            className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition">+</button>
        </div>
        {form.targetEmails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.targetEmails.map(email => (
              <span key={email} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs border border-blue-100 dark:border-blue-500/30">
                {email}
                <button type="button" onClick={() => removeEmail(email)} className="hover:text-red-500 transition">
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-60">
          {loading ? (videoMode === "file" || attachMode === "file" ? "Subiendo..." : "Creando...") : "Crear curso"}
        </button>
      </div>
    </form>
  );
}

// ─── Capacitacion ─────────────────────────────────────────────────────────────

function Capacitacion() {
  const { t } = useLanguage();
  const [cursos, setCursos]               = useState([]);
  const [progreso, setProgreso]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [modalOpen, setModalOpen]         = useState(false);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [search, setSearch]               = useState("");
  const [catFilter, setCatFilter]         = useState("");
  const [showFilters, setShowFilters]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }
  const [deleting, setDeleting]           = useState(false);
  const canCreate = usePermission("canCreateCourses");
  const canDelete = usePermission("canDeleteCourses");
  const { user }  = useAuth();

  useEffect(() => {
    Promise.all([
      apiGetCourses().catch(() => []),
      apiGetMyProgress().catch(() => []),
    ]).then(([c, p]) => {
      setCursos(c);
      setProgreso(p);
    }).finally(() => setLoading(false));
  }, []);

  const cursosConProgreso = cursos.map((c, i) => ({
    ...c,
    progress: progreso.find(p => p.courseId === c.id)?.progress ?? 0,
    color: COURSE_COLORS[i % COURSE_COLORS.length],
  }));

  const cursosVisibles = cursosConProgreso.filter(c => {
    const noRestriction = !c.targetRoles?.length && !c.targetEmails?.length;
    const byRole  = c.targetRoles?.includes(user?.role);
    const byEmail = c.targetEmails?.includes(user?.email?.toLowerCase());
    return noRestriction || byRole || byEmail;
  });

  const cursosFiltered = cursosVisibles.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !catFilter || c.category === catFilter;
    return matchSearch && matchCat;
  });

  const completados      = cursosVisibles.filter(c => c.progress === 100).length;
  const enProgreso       = cursosVisibles.filter(c => c.progress > 0 && c.progress < 100).length;
  const obligatoriosPend = cursosVisibles.filter(c => c.mandatory && c.progress < 100).length;

  const handleProgressUpdate = (courseId, value) => {
    setProgreso(prev => {
      const exists = prev.find(p => p.courseId === courseId);
      return exists
        ? prev.map(p => p.courseId === courseId ? { ...p, progress: value } : p)
        : [...prev, { courseId, progress: value }];
    });
    // Actualizar también el curso seleccionado si sigue abierto
    setSelectedCurso(prev => prev?.id === courseId ? { ...prev, progress: value } : prev);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiDeleteCourse(confirmDelete.id);
      setCursos(prev => prev.filter(c => c.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch { /* no-op */ } finally {
      setDeleting(false);
    }
  };

  const selectedUserProgress = selectedCurso
    ? (progreso.find(p => p.courseId === selectedCurso.id)?.progress ?? 0)
    : 0;

  const categoriesAvail = [...new Set(cursosVisibles.map(c => c.category))];

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("cap_title")}</h1>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-1">{t("cap_sub")}</p>
          </div>
          {canCreate && (
            <button onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition shadow-lg shadow-blue-500/30 sm:shrink-0">
              <Plus className="w-4 h-4" /> Nuevo curso
            </button>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Disponibles", value: cursosVisibles.length || "—", icon: BookOpen,     bg: "bg-blue-50 dark:bg-blue-500/10",   text: "text-blue-600 dark:text-blue-400",   border: "border-blue-100 dark:border-blue-500/20" },
            { label: "Completados", value: completados,                  icon: CheckCircle,  bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-100 dark:border-green-500/20" },
            { label: "En progreso", value: enProgreso,                   icon: Clock,        bg: "bg-violet-50 dark:bg-violet-500/10",text:"text-violet-600 dark:text-violet-400",border:"border-violet-100 dark:border-violet-500/20"},
            { label: "Oblig. pendientes", value: obligatoriosPend || "—", icon: Award, bg: "bg-amber-50 dark:bg-amber-500/10",text: "text-amber-600 dark:text-amber-400",  border: "border-amber-100 dark:border-amber-500/20" },
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${s.border} ${s.bg}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-white/10 shrink-0 shadow-sm">
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-white/40">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar curso o instructor..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${catFilter ? "bg-blue-500 text-white border-blue-500" : "bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/10 hover:border-blue-300"}`}
          >
            <Filter className="w-4 h-4" />
            {catFilter || "Filtrar"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {catFilter && (
            <button onClick={() => setCatFilter("")} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white/60 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 transition">
              <XIcon className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 -mt-4">
            {categoriesAvail.map(cat => (
              <button key={cat} onClick={() => { setCatFilter(cat === catFilter ? "" : cat); setShowFilters(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${cat === catFilter ? "bg-blue-500 text-white border-blue-500" : "bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 border-gray-200 dark:border-white/10 hover:border-blue-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* CURSOS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">Mis cursos</h2>
            {cursosFiltered.length !== cursosVisibles.length && (
              <span className="text-xs text-gray-400 dark:text-white/30">{cursosFiltered.length} de {cursosVisibles.length}</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
            </div>
          ) : cursosFiltered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-white/30">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{search || catFilter ? "Sin resultados para esa búsqueda" : "No hay cursos disponibles"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {cursosFiltered.map((c, i) => (
                <CourseCard
                  key={i}
                  {...c}
                  onClick={() => setSelectedCurso(c)}
                  canDelete={canDelete}
                  onDelete={() => setConfirmDelete({ id: c.id, title: c.title })}
                />
              ))}
            </div>
          )}
        </div>

        {/* EVALUACIONES / OBLIGATORIOS */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white">Evaluaciones obligatorias</h2>
            {obligatoriosPend > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 font-medium">
                {obligatoriosPend} pendiente{obligatoriosPend > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {cursosVisibles.filter(c => c.mandatory).length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-white/40 text-center py-4">Sin evaluaciones pendientes</p>
            ) : cursosVisibles.filter(c => c.mandatory).map((c, i) => {
              const contentType = detectContentType(c.videoUrl);
              const meta        = contentType ? CONTENT_TYPE_META[contentType] : null;
              return (
                <div key={i} onClick={() => setSelectedCurso(c)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.progress === 100 ? "bg-green-50 dark:bg-green-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
                    {c.progress === 100
                      ? <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      : <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40 flex items-center gap-1">
                      {meta && <meta.icon className="w-3 h-3" />}
                      {c.instructor} · {meta?.label || c.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.stats && (
                      <span className="text-xs text-gray-400 dark:text-white/30 hidden sm:block">
                        {c.stats.completed}/{c.stats.total}
                      </span>
                    )}
                    {c.progress === 100
                      ? <span className="text-xs font-bold text-green-500 dark:text-green-400">Completado</span>
                      : <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-100 dark:border-amber-500/20">
                          {c.progress > 0 ? `${c.progress}%` : "Pendiente"}
                        </span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL CONFIRMAR BORRADO */}
      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Desactivar curso</p>
                <p className="text-xs text-gray-400 dark:text-white/40">El curso dejará de ser visible para los usuarios</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-100 dark:border-white/10">
              <span className="font-semibold text-gray-800 dark:text-white">"{confirmDelete.title}"</span>
              <br />
              <span className="text-xs text-gray-400 dark:text-white/30 mt-1 block">Los datos y el progreso de los usuarios se conservan en la base de datos.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {deleting ? "Desactivando..." : "Sí, desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CURSO */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo curso">
        <CourseForm
          onSave={nuevo => setCursos(prev => [nuevo, ...prev])}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* MODAL DETALLE */}
      <Modal open={!!selectedCurso} onClose={() => setSelectedCurso(null)} title={selectedCurso?.title || ""}>
        {selectedCurso && (
          <CourseDetailModal
            curso={selectedCurso}
            userProgress={selectedUserProgress}
            onProgressUpdate={handleProgressUpdate}
          />
        )}
      </Modal>

    </DashboardLayout>
  );
}

export default Capacitacion;
