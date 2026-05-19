import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  apiGetNotices, apiCreateNotice, apiDeleteNotice,
  apiGetDocuments, apiUploadDocument, apiDeleteDocument,
  apiGetRseVideos, apiCreateRseVideo, apiDeleteRseVideo,
} from "../services/api";
import {
  Bell, FileText, Download, AlertCircle, Info, Plus,
  Trash2, Upload, User, Clock, Video, Play, X,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import Modal from "../components/Modal";
import { useLanguage } from "../context/LanguageContext";

const TYPE_STYLE = {
  urgente: { bg: "from-red-500 to-rose-600",    cat: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300",       icon: AlertCircle, label: "Urgente" },
  warning: { bg: "from-amber-500 to-amber-600",  cat: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300", icon: Bell,        label: "Atención" },
  info:    { bg: "from-blue-500 to-blue-600",    cat: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300",     icon: Info,        label: "Info" },
};

const DOC_STYLE = {
  PDF:  "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400",
  DOCX: "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400",
  PPTX: "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400",
  XLSX: "bg-green-50 dark:bg-green-500/10 text-green-500 dark:text-green-400",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days} día${days > 1 ? "s" : ""}`;
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function NoticeDetailModal({ aviso, onClose, onDelete, canDelete }) {
  if (!aviso) return null;
  const style = TYPE_STYLE[aviso.type] || TYPE_STYLE.info;
  const Icon = style.icon;
  return (
    <Modal open={!!aviso} onClose={onClose} title="">
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${style.bg} text-white`}>
          <Icon className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-semibold leading-tight">{aviso.title}</p>
            <p className="text-xs opacity-70 mt-0.5">{style.label}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed whitespace-pre-line">{aviso.content}</p>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/40 border-t border-gray-100 dark:border-white/10 pt-3">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {aviso.author?.name || "Sistema"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(aviso.createdAt)}
          </span>
        </div>
        {canDelete && (
          <button
            onClick={() => { onDelete(aviso.id); onClose(); }}
            className="w-full py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Eliminar aviso
          </button>
        )}
      </div>
    </Modal>
  );
}

function NoticeForm({ onSave, onClose }) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) { setError("Completa todos los campos"); return; }
    setLoading(true);
    try {
      const aviso = await apiCreateNotice({ title: titulo, content: contenido, type: tipo });
      onSave(aviso);
      onClose();
    } catch {
      setError("Error al publicar el aviso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Título</label>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Título del aviso"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Contenido</label>
        <textarea
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Escribe el mensaje completo aquí..."
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none dark:[color-scheme:dark]"
        >
          <option value="info">Informativo</option>
          <option value="warning">Atención</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium transition">
          {loading ? "Publicando..." : "Publicar aviso"}
        </button>
      </div>
    </form>
  );
}

function DocumentUploadForm({ onSave, onClose }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    if (!name && f) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name.trim() || file.name);
      fd.append("category", category);
      const doc = await apiUploadDocument(fd);
      onSave(doc);
      onClose();
    } catch {
      setError("Error al subir el archivo. Verifica el formato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition"
      >
        <Upload className="w-8 h-8 mx-auto text-gray-300 dark:text-white/20 mb-2" />
        {file ? (
          <p className="text-sm font-medium text-gray-700 dark:text-white/80">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-white/40">Haz clic para seleccionar un archivo</p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-1">PDF, DOCX, PPTX, XLSX y más</p>
          </>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Nombre del documento</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej. Manual de bienvenida 2025"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Categoría</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none dark:[color-scheme:dark]"
        >
          <option value="general">General</option>
          <option value="politicas">Políticas</option>
          <option value="procedimientos">Procedimientos</option>
          <option value="formatos">Formatos</option>
          <option value="rse">RSE</option>
          <option value="recursos-humanos">Recursos Humanos</option>
        </select>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
          <Upload className="w-4 h-4" />
          {loading ? "Subiendo..." : "Subir documento"}
        </button>
      </div>
    </form>
  );
}

// ── VIDEOS RSE ────────────────────────────────────────────────────────────────

function getYoutubeId(url) {
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return m ? m[1] : null;
}

function getVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function toEmbedUrl(url) {
  const yt = getYoutubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const vi = getVimeoId(url);
  if (vi) return `https://player.vimeo.com/video/${vi}`;
  return null;
}

function getThumb(url) {
  const yt = getYoutubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

function isLocalVideo(url) {
  return url?.startsWith("/uploads/");
}

function VideoPlayerModal({ video, onClose, baseUrl }) {
  if (!video) return null;
  const embed = toEmbedUrl(video.url);
  const local = isLocalVideo(video.url);
  const src   = local ? `${baseUrl}${video.url}` : video.url;
  return (
    <Modal open={!!video} onClose={onClose} title={video.title}>
      <div className="space-y-3">
        {local ? (
          <video
            src={src}
            controls
            className="w-full rounded-xl bg-black"
            style={{ maxHeight: "360px" }}
          />
        ) : embed ? (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embed}
              className="absolute inset-0 w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition"
          >
            <Play className="w-4 h-4" /> Ver video en nueva pestaña
          </a>
        )}
        <p className="text-xs text-gray-400 dark:text-white/30 text-center">{video.title}</p>
      </div>
    </Modal>
  );
}

function VideoForm({ onSave, onClose }) {
  const [mode, setMode]       = useState("url");   // "url" | "file"
  const [title, setTitle]     = useState("");
  const [url, setUrl]         = useState("");
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef();

  const thumb = mode === "url" && url ? getThumb(url) : null;
  const embed = mode === "url" && url ? toEmbedUrl(url) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("El título es obligatorio"); return; }
    if (mode === "url" && !url.trim()) { setError("Pega la URL del video"); return; }
    if (mode === "file" && !file) { setError("Selecciona un archivo de video"); return; }
    setLoading(true);
    try {
      let payload;
      if (mode === "file") {
        payload = new FormData();
        payload.append("file", file);
        payload.append("title", title.trim());
      } else {
        payload = { title: title.trim(), url: url.trim() };
      }
      const video = await apiCreateRseVideo(payload);
      onSave(video);
      onClose();
    } catch {
      setError("Error al guardar el video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {[{ key: "url", label: "Enlace (YouTube / Vimeo)" }, { key: "file", label: "Subir archivo" }].map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium transition ${
              mode === m.key
                ? "bg-blue-500 text-white"
                : "text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "url" ? (
        <>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">URL del video</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {url && !embed && (
              <p className="text-xs text-amber-500 mt-1">URL no reconocida — se abrirá como enlace externo.</p>
            )}
          </div>
          {thumb && (
            <div className="relative rounded-xl overflow-hidden h-32 bg-gray-100 dark:bg-white/5">
              <img src={thumb} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 transition"
        >
          <Video className="w-8 h-8 mx-auto text-gray-300 dark:text-white/20 mb-2" />
          {file ? (
            <p className="text-sm font-medium text-gray-700 dark:text-white/80">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-white/40">Haz clic para seleccionar un video</p>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-1">MP4, MOV, AVI, WebM · máx. 500 MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files[0];
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
            }}
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-white/70 block mb-1">Título del video</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej. Programa de reciclaje 2025"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
          <Video className="w-4 h-4" />
          {loading ? (mode === "file" ? "Subiendo..." : "Guardando...") : "Agregar video"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const NOTICE_FILTERS = [
  { key: "todos",   label: "Todos" },
  { key: "urgente", label: "Urgente" },
  { key: "warning", label: "Atención" },
  { key: "info",    label: "Info" },
];

function Comunicacion() {
  const { t } = useLanguage();
  const [avisos, setAvisos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeFilter, setActiveFilter] = useState("todos");
  const [docFilter, setDocFilter] = useState("todos");
  const canCreate = usePermission("canCreateNotices");

  useEffect(() => {
    Promise.all([
      apiGetNotices().catch(() => []),
      apiGetDocuments().catch(() => []),
      apiGetRseVideos().catch(() => []),
    ]).then(([a, d, v]) => {
      setAvisos(a);
      setDocumentos(d);
      setVideos(v);
    }).finally(() => setLoading(false));
  }, []);

  const urgentes = avisos.filter(a => a.type === "urgente").length;

  const filteredAvisos = activeFilter === "todos"
    ? avisos
    : avisos.filter(a => a.type === activeFilter);

  const docCategories = ["todos", ...new Set(documentos.map(d => d.category).filter(Boolean))];
  const filteredDocs = docFilter === "todos"
    ? documentos
    : documentos.filter(d => d.category === docFilter);

  const handleDeleteNotice = async (id) => {
    try {
      await apiDeleteNotice(id);
      setAvisos(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error eliminando aviso:", err);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await apiDeleteDocument(id);
      setDocumentos(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Error eliminando documento:", err);
    }
  };

  const handleDeleteVideo = async (id) => {
    try {
      await apiDeleteRseVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error("Error eliminando video:", err);
    }
  };

  const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("com_title")}</h1>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-1">{t("com_sub")}</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setNoticeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-4 h-4" /> Nuevo aviso
            </button>
          )}
        </div>

        {/* AVISOS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 dark:text-white">Avisos recientes</h2>
            {urgentes > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {urgentes} urgente{urgentes > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {NOTICE_FILTERS.map(f => {
              const count = f.key === "todos" ? avisos.length : avisos.filter(a => a.type === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    activeFilter === f.key
                      ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                      : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/15"
                  }`}
                >
                  {f.label}{count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
            </div>
          ) : filteredAvisos.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-white/30">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{activeFilter === "todos" ? "No hay avisos publicados" : "No hay avisos de este tipo"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredAvisos.map((a) => {
                const style = TYPE_STYLE[a.type] || TYPE_STYLE.info;
                const Icon = style.icon;
                const preview = a.content?.length > 110 ? a.content.slice(0, 110) + "…" : a.content;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAviso(a)}
                    className="relative flex gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:shadow-md dark:hover:bg-white/8 transition cursor-pointer group"
                  >
                    {canCreate && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteNotice(a.id); }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        title="Eliminar aviso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight truncate">{a.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${style.cat}`}>{style.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed line-clamp-2">{preview}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-white/30">
                        <User className="w-3 h-3" />
                        <span>{a.author?.name || "Sistema"}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DOCUMENTOS — full width */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400 dark:text-white/40" />
              Biblioteca de documentos
            </h2>
            {canCreate && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/8 transition"
              >
                <Upload className="w-3.5 h-3.5" /> Subir
              </button>
            )}
          </div>

          {/* Category filter */}
          {docCategories.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {docCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setDocFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
                    docFilter === cat
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/15"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-white/30">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{docFilter === "todos" ? "Sin documentos disponibles" : "No hay documentos en esta categoría"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filteredDocs.map((d) => {
                const ext = (d.url?.split(".").pop() || "PDF").toUpperCase();
                const docUrl = d.url?.startsWith("http") ? d.url : `${BASE_URL}${d.url}`;
                return (
                  <div key={d.id} className="flex items-center gap-1 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition group">
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={d.name}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${DOC_STYLE[ext] || DOC_STYLE.PDF}`}>
                        {ext.slice(0, 4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-white/80 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400 dark:text-white/40 capitalize">{d.category} · {timeAgo(d.createdAt)}</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition shrink-0" />
                    </a>
                    {canCreate && (
                      <button
                        onClick={() => handleDeleteDocument(d.id)}
                        className="ml-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-gray-300 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition shrink-0"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* VIDEOS RSE */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-gray-400 dark:text-white/40" />
                Videos RSE
              </h2>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Contenido audiovisual de responsabilidad social</p>
            </div>
            {canCreate && (
              <button
                onClick={() => setVideoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/8 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar video
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-white/30 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-2xl">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin videos RSE publicados</p>
              {canCreate && (
                <p className="text-xs mt-1">Agrega un enlace de YouTube/Vimeo o sube un video desde tu computadora</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => {
                const thumb = getThumb(v.url);
                const local = isLocalVideo(v.url);
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVideo(v)}
                    className="group rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:shadow-lg dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : local ? (
                        <video src={`${BASE_URL}${v.url}`} className="w-full h-full object-cover" muted preload="metadata" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
                        </div>
                      </div>
                      {canCreate && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteVideo(v.id); }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white/60 hover:text-red-400 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition"
                          title="Eliminar video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight line-clamp-2">{v.title}</p>
                      <p className="text-xs text-gray-400 dark:text-white/30 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(v.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <Modal open={noticeModalOpen} onClose={() => setNoticeModalOpen(false)} title="Publicar aviso">
        <NoticeForm
          onSave={nuevo => setAvisos(prev => [nuevo, ...prev])}
          onClose={() => setNoticeModalOpen(false)}
        />
      </Modal>

      <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Subir documento">
        <DocumentUploadForm
          onSave={doc => setDocumentos(prev => [doc, ...prev])}
          onClose={() => setUploadModalOpen(false)}
        />
      </Modal>

      <Modal open={videoModalOpen} onClose={() => setVideoModalOpen(false)} title="Agregar video RSE">
        <VideoForm
          onSave={video => setVideos(prev => [video, ...prev])}
          onClose={() => setVideoModalOpen(false)}
        />
      </Modal>

      <NoticeDetailModal
        aviso={selectedAviso}
        onClose={() => setSelectedAviso(null)}
        onDelete={handleDeleteNotice}
        canDelete={canCreate}
      />

      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        baseUrl={BASE_URL}
      />

    </DashboardLayout>
  );
}

export default Comunicacion;
